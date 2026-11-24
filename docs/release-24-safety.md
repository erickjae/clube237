# Release 24 — Meu universo cinematográfico

Status: foundation draft only; not ready for production. Full PRD implementation pending.

Mandatory gates: full logical backup including auth, separate Storage object backup, restore into isolated environment, verify counts and login, benchmark existing search/queue/review, test migration, review security, test regression and responsive UI before merge. No destructive migration. No changes to existing data or functions in foundation. Existing movies.runtime reused. New metadata tables are service-role only. No worker, backfill or report enabled yet. Verify actual production schema against repository before applying. Keep backups and credentials outside Git. Roll back application independently; leave unused additive tables intact rather than deleting data. If migration fails, transaction rolls back. Do not merge as completed release until all PRD features and gates are satisfied.
