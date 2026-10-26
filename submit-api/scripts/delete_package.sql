-- =============================================================================
-- delete_package(p_package_id)
--
-- Manually and completely removes a single package and every related row.
--
-- WHY THIS IS NOT JUST "DELETE FROM packages WHERE id = ...":
--   Several child tables ARE wired with ON DELETE CASCADE and would be removed
--   automatically (package_metadata, items -> submission_reviews ->
--   submission_review_entries / submission_item_notes / submissions,
--   update_requests, internal_staff_documents).
--
--   But these related rows are NOT cascaded and a plain delete would orphan them:
--     * submitted_forms      - submissions.submitted_form_id points TO it (no cascade)
--     * submitted_documents  - submissions.submitted_document_id points TO it (no cascade)
--     * geo_data_uploads     - no FK at all; linked by raw_s3_key == document url
--     * activity_logs        - keyed by value, not FK:
--                                PACKAGE    -> package_versions.original_package_id
--                                SUBMISSION -> submission id
--     * email_queue          - entity_type='PACKAGE', entity_id = package id
--     * package_versions     - packages.version_id points TO it (no cascade)
--
-- This function deletes everything in FK-safe order inside one transaction
-- (the whole function body runs atomically; any error rolls it all back).
--
-- NOTE: geo_data_uploads also have S3 artifacts (raw/preview/standard keys).
--       This function removes the DB rows only. It RETURNS the affected S3 keys
--       so the caller can clean up object storage. SQL cannot delete from S3.
--
-- USAGE:
--   SELECT * FROM delete_package(123);
--
-- Returns one row: counts per table + the S3 keys that still need deletion.
-- =============================================================================

CREATE OR REPLACE FUNCTION delete_package(p_package_id INTEGER)
RETURNS TABLE (
    deleted_package_id        INTEGER,
    items_deleted             INTEGER,
    submissions_deleted       INTEGER,
    submitted_forms_deleted   INTEGER,
    submitted_documents_deleted INTEGER,
    geo_uploads_deleted       INTEGER,
    reviews_deleted           INTEGER,
    review_entries_deleted    INTEGER,
    item_notes_deleted        INTEGER,
    update_requests_deleted   INTEGER,
    internal_docs_deleted     INTEGER,
    package_metadata_deleted  INTEGER,
    activity_logs_deleted     INTEGER,
    email_queue_deleted       INTEGER,
    package_versions_deleted  INTEGER,
    s3_keys_to_delete         TEXT[]
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_item_ids            INTEGER[];
    v_submission_ids      INTEGER[];
    v_review_ids          INTEGER[];
    v_form_ids            INTEGER[];
    v_document_ids        INTEGER[];
    v_document_urls       TEXT[];
    v_version_id          INTEGER;
    v_original_package_id INTEGER;

    v_items_deleted             INTEGER := 0;
    v_submissions_deleted       INTEGER := 0;
    v_forms_deleted             INTEGER := 0;
    v_documents_deleted         INTEGER := 0;
    v_geo_deleted               INTEGER := 0;
    v_reviews_deleted           INTEGER := 0;
    v_review_entries_deleted    INTEGER := 0;
    v_item_notes_deleted        INTEGER := 0;
    v_update_requests_deleted   INTEGER := 0;
    v_internal_docs_deleted     INTEGER := 0;
    v_package_metadata_deleted  INTEGER := 0;
    v_activity_logs_deleted     INTEGER := 0;
    v_email_queue_deleted       INTEGER := 0;
    v_package_versions_deleted  INTEGER := 0;
    v_package_logs_deleted      INTEGER := 0;

    v_s3_keys TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Guard: package must exist.
    IF NOT EXISTS (SELECT 1 FROM packages WHERE id = p_package_id) THEN
        RAISE EXCEPTION 'Package % does not exist', p_package_id;
    END IF;

    -- -------------------------------------------------------------------------
    -- 1. Resolve the id graph BEFORE deleting anything.
    -- -------------------------------------------------------------------------
    SELECT version_id INTO v_version_id FROM packages WHERE id = p_package_id;

    IF v_version_id IS NOT NULL THEN
        SELECT original_package_id INTO v_original_package_id
        FROM package_versions WHERE id = v_version_id;
    END IF;

    -- Items under this package.
    SELECT array_agg(id) INTO v_item_ids
    FROM items WHERE package_id = p_package_id;
    v_item_ids := COALESCE(v_item_ids, ARRAY[]::INTEGER[]);

    -- Submissions under those items.
    IF array_length(v_item_ids, 1) IS NOT NULL THEN
        SELECT array_agg(id) INTO v_submission_ids
        FROM submissions WHERE item_id = ANY(v_item_ids);

        SELECT array_agg(id) INTO v_review_ids
        FROM submission_reviews WHERE item_id = ANY(v_item_ids);
    END IF;
    v_submission_ids := COALESCE(v_submission_ids, ARRAY[]::INTEGER[]);
    v_review_ids     := COALESCE(v_review_ids, ARRAY[]::INTEGER[]);

    -- Forms and documents referenced by those submissions.
    IF array_length(v_submission_ids, 1) IS NOT NULL THEN
        SELECT array_agg(DISTINCT submitted_form_id)
        INTO v_form_ids
        FROM submissions
        WHERE id = ANY(v_submission_ids) AND submitted_form_id IS NOT NULL;

        SELECT array_agg(DISTINCT submitted_document_id)
        INTO v_document_ids
        FROM submissions
        WHERE id = ANY(v_submission_ids) AND submitted_document_id IS NOT NULL;
    END IF;
    v_form_ids     := COALESCE(v_form_ids, ARRAY[]::INTEGER[]);
    v_document_ids := COALESCE(v_document_ids, ARRAY[]::INTEGER[]);

    -- Document URLs (used to find geo uploads and to report S3 cleanup).
    IF array_length(v_document_ids, 1) IS NOT NULL THEN
        SELECT array_agg(url) INTO v_document_urls
        FROM submitted_documents WHERE id = ANY(v_document_ids);
    END IF;
    v_document_urls := COALESCE(v_document_urls, ARRAY[]::TEXT[]);

    -- Collect S3 keys from internal staff documents for the caller to clean up.
    SELECT COALESCE(array_agg(url), ARRAY[]::TEXT[])
    INTO v_s3_keys
    FROM internal_staff_documents
    WHERE package_id = p_package_id AND url IS NOT NULL;

    -- Add document urls to the S3 cleanup report.
    v_s3_keys := v_s3_keys || v_document_urls;

    -- Add geo upload S3 tiers (raw/preview/standard) for matching documents.
    IF array_length(v_document_urls, 1) IS NOT NULL THEN
        SELECT v_s3_keys
               || COALESCE(array_agg(raw_s3_key)      FILTER (WHERE raw_s3_key IS NOT NULL),      ARRAY[]::TEXT[])
               || COALESCE(array_agg(preview_s3_key)  FILTER (WHERE preview_s3_key IS NOT NULL),  ARRAY[]::TEXT[])
               || COALESCE(array_agg(standard_s3_key) FILTER (WHERE standard_s3_key IS NOT NULL), ARRAY[]::TEXT[])
        INTO v_s3_keys
        FROM geo_data_uploads
        WHERE raw_s3_key = ANY(v_document_urls);
    END IF;

    -- -------------------------------------------------------------------------
    -- 2. Delete value-keyed / non-cascaded tables that reference the package
    --    or its children, from the leaves inward.
    -- -------------------------------------------------------------------------

    -- 2a. geo_data_uploads (no FK; matched by document url == raw_s3_key).
    IF array_length(v_document_urls, 1) IS NOT NULL THEN
        DELETE FROM geo_data_uploads WHERE raw_s3_key = ANY(v_document_urls);
        GET DIAGNOSTICS v_geo_deleted = ROW_COUNT;
    END IF;

    -- 2b. activity_logs for the submissions (entity_type = 'SUBMISSION').
    IF array_length(v_submission_ids, 1) IS NOT NULL THEN
        DELETE FROM activity_logs
        WHERE entity_type = 'SUBMISSION' AND entity_id = ANY(v_submission_ids);
        GET DIAGNOSTICS v_activity_logs_deleted = ROW_COUNT;
    END IF;

    -- 2c. activity_logs for the package.
    --     Historically keyed by package_versions.original_package_id; older rows
    --     may still be keyed by the raw package id. Clear both to be safe.
    DELETE FROM activity_logs
    WHERE entity_type = 'PACKAGE'
      AND entity_id IN (p_package_id, COALESCE(v_original_package_id, -1));
    GET DIAGNOSTICS v_package_logs_deleted = ROW_COUNT;
    v_activity_logs_deleted := v_activity_logs_deleted + v_package_logs_deleted;

    -- 2d. email_queue for the package.
    DELETE FROM email_queue
    WHERE entity_type = 'PACKAGE' AND entity_id = p_package_id;
    GET DIAGNOSTICS v_email_queue_deleted = ROW_COUNT;

    -- -------------------------------------------------------------------------
    -- 3. Delete the package. ON DELETE CASCADE removes, in order:
    --      package_metadata, update_requests, internal_staff_documents,
    --      items -> submission_reviews -> submission_review_entries,
    --              submission_item_notes, submissions.
    --    We capture counts first so the return value is accurate.
    -- -------------------------------------------------------------------------
    SELECT count(*) INTO v_package_metadata_deleted FROM package_metadata WHERE package_id = p_package_id;
    SELECT count(*) INTO v_update_requests_deleted   FROM update_requests  WHERE submission_package_id = p_package_id;
    SELECT count(*) INTO v_internal_docs_deleted     FROM internal_staff_documents WHERE package_id = p_package_id;
    v_items_deleted          := COALESCE(array_length(v_item_ids, 1), 0);
    v_submissions_deleted    := COALESCE(array_length(v_submission_ids, 1), 0);
    v_reviews_deleted        := COALESCE(array_length(v_review_ids, 1), 0);
    v_forms_deleted          := COALESCE(array_length(v_form_ids, 1), 0);
    v_documents_deleted      := COALESCE(array_length(v_document_ids, 1), 0);

    IF array_length(v_review_ids, 1) IS NOT NULL THEN
        SELECT count(*) INTO v_review_entries_deleted
        FROM submission_review_entries WHERE review_id = ANY(v_review_ids);
    END IF;
    IF array_length(v_item_ids, 1) IS NOT NULL THEN
        SELECT count(*) INTO v_item_notes_deleted
        FROM submission_item_notes WHERE item_id = ANY(v_item_ids);
    END IF;

    DELETE FROM packages WHERE id = p_package_id;

    -- -------------------------------------------------------------------------
    -- 4. Now that submissions are gone, remove the forms/documents they
    --    pointed to (these FKs point TO those tables, so they survive the
    --    cascade and must be deleted explicitly, after the package).
    -- -------------------------------------------------------------------------
    IF array_length(v_document_ids, 1) IS NOT NULL THEN
        DELETE FROM submitted_documents WHERE id = ANY(v_document_ids);
        GET DIAGNOSTICS v_documents_deleted = ROW_COUNT;
    END IF;

    IF array_length(v_form_ids, 1) IS NOT NULL THEN
        DELETE FROM submitted_forms WHERE id = ANY(v_form_ids);
        GET DIAGNOSTICS v_forms_deleted = ROW_COUNT;
    END IF;

    -- -------------------------------------------------------------------------
    -- 5. package_versions lineage row.
    --    Only delete it if no OTHER package still references this version id
    --    (a version row can be shared across the version lineage).
    -- -------------------------------------------------------------------------
    IF v_version_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM packages WHERE version_id = v_version_id) THEN
            DELETE FROM package_versions WHERE id = v_version_id;
            GET DIAGNOSTICS v_package_versions_deleted = ROW_COUNT;
        END IF;
    END IF;

    -- -------------------------------------------------------------------------
    -- 6. Return the report.
    -- -------------------------------------------------------------------------
    deleted_package_id          := p_package_id;
    items_deleted               := v_items_deleted;
    submissions_deleted         := v_submissions_deleted;
    submitted_forms_deleted     := v_forms_deleted;
    submitted_documents_deleted := v_documents_deleted;
    geo_uploads_deleted         := v_geo_deleted;
    reviews_deleted             := v_reviews_deleted;
    review_entries_deleted      := v_review_entries_deleted;
    item_notes_deleted          := v_item_notes_deleted;
    update_requests_deleted     := v_update_requests_deleted;
    internal_docs_deleted       := v_internal_docs_deleted;
    package_metadata_deleted    := v_package_metadata_deleted;
    activity_logs_deleted       := v_activity_logs_deleted;
    email_queue_deleted         := v_email_queue_deleted;
    package_versions_deleted    := v_package_versions_deleted;
    s3_keys_to_delete           := v_s3_keys;

    RETURN NEXT;
END;
$$;
