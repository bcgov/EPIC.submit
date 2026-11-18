-- =============================================================================
-- Remove the 'IPD' and 'Additional Information' package types so they can be
-- re-created through POST /api/staff/package-types with start/end phases and a
-- phase_label.
--
-- Rows referencing package_types.id (the only two foreign keys):
--   * packages.type_id                    - NOT cascaded. The script ABORTS if any
--                                           package still uses these types.
--   * package_item_types.package_type_id  - link rows, deleted here first.
-- item_types is intentionally NOT touched: item types can be shared with other
-- package types, and the POST endpoint re-links them (by id, or by name).
--
-- HOW TO RUN (psql, one transaction):
--   1. Run STEP 1 and SAVE the output. The POST payload needs the same
--      mandatory / approval_type / versioning_enabled / success_message values
--      and the same item types, in the same sort order.
--   2. Run STEP 2. It deletes inside a transaction and prints what was removed.
--   3. Check the output, then COMMIT; (or ROLLBACK; to undo).
-- =============================================================================

-- STEP 1: capture the current configuration before deleting anything.
SELECT pt.id, pt.name, pt.title, pt.mandatory, pt.approval_type, pt.versioning_enabled,
       pt.start_phase_id, pt.end_phase_id, pt.phase_label, pt.success_message
FROM package_types pt
WHERE pt.name IN ('IPD', 'Additional Information')
ORDER BY pt.name, pt.id;

SELECT pt.name, pit.item_type_id, it.name AS item_type_name, it.submission_method,
       pit.sort_order, pit.is_required
FROM package_item_types pit
JOIN package_types pt ON pt.id = pit.package_type_id
JOIN item_types it ON it.id = pit.item_type_id
WHERE pt.name IN ('IPD', 'Additional Information')
ORDER BY pt.name, pit.sort_order;

-- STEP 2: delete (transactional).
BEGIN;

DO $$
DECLARE
    v_type_ids      INTEGER[];
    v_package_count INTEGER;
    v_links_deleted INTEGER;
    v_types_deleted INTEGER;
BEGIN
    SELECT COALESCE(array_agg(id), ARRAY[]::INTEGER[]) INTO v_type_ids
    FROM package_types
    WHERE name IN ('IPD', 'Additional Information');

    SELECT count(*) INTO v_package_count
    FROM packages
    WHERE type_id = ANY (v_type_ids);

    IF v_package_count > 0 THEN
        RAISE EXCEPTION 'Aborting: % package(s) still reference these package types. Delete them first.',
            v_package_count;
    END IF;

    DELETE FROM package_item_types WHERE package_type_id = ANY (v_type_ids);
    GET DIAGNOSTICS v_links_deleted = ROW_COUNT;

    DELETE FROM package_types WHERE id = ANY (v_type_ids);
    GET DIAGNOSTICS v_types_deleted = ROW_COUNT;

    RAISE NOTICE 'Deleted % package_item_types row(s) and % package_types row(s) (ids: %)',
        v_links_deleted, v_types_deleted, v_type_ids;
END $$;

-- Expect zero rows:
SELECT id, name FROM package_types WHERE name IN ('IPD', 'Additional Information');

-- Review the NOTICE and the result above, then run COMMIT; (or ROLLBACK; to undo).
-- COMMIT;
