# Manual package deletion

`delete_package.sql` defines a Postgres function `delete_package(p_package_id)`
that removes a package and **all** related rows in one atomic transaction.

## Install

```bash
psql "$DATABASE_URL" -f scripts/delete_package.sql
```

## Run

```sql
SELECT * FROM delete_package(123);
```

It returns a single row with the number of rows removed per table and a
`s3_keys_to_delete` array.

## What it deletes

Removed automatically by `ON DELETE CASCADE` when the `packages` row goes:

| Table | FK | 
|---|---|
| `package_metadata` | `package_id` |
| `update_requests` | `submission_package_id` |
| `internal_staff_documents` | `package_id` |
| `items` | `package_id` |
| `submission_reviews` | `items.id` |
| `submission_review_entries` | `submission_reviews.id` |
| `submission_item_notes` | `items.id` |
| `submissions` | `items.id` |

Removed explicitly by the function because they are **not** cascaded:

| Table | How it is linked |
|---|---|
| `submitted_forms` | `submissions.submitted_form_id` points to it |
| `submitted_documents` | `submissions.submitted_document_id` points to it |
| `geo_data_uploads` | no FK; `raw_s3_key` matches a document url |
| `activity_logs` | value-keyed: `PACKAGE` -> `package_versions.original_package_id`, `SUBMISSION` -> submission id |
| `email_queue` | `entity_type='PACKAGE'`, `entity_id` = package id |
| `package_versions` | `packages.version_id` points to it (only deleted if no other package shares it) |

## Important caveats

- **S3 is not touched.** SQL cannot delete object storage. The function returns
  `s3_keys_to_delete` (internal staff docs, submitted document urls, and the
  raw/preview/standard tiers of matching geo uploads). Delete those keys from S3
  separately after the transaction commits.
- **Atomic.** The whole function runs in one transaction; any error rolls back
  every delete.
- **Preview first.** To see what a delete would touch without committing:

  ```sql
  BEGIN;
  SELECT * FROM delete_package(123);
  ROLLBACK;
  ```

- **Version lineage.** `package_versions` is only removed when no other package
  still references that `version_id`, so sibling versions are preserved.
