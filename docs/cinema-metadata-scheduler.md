# Metadata scheduler
Disabled by default. Do not enable before migrations, build and production smoke tests.
Set Vercel CRON_SECRET to a strong random secret and CINEMA_METADATA_ENABLED=true.
Set GitHub Actions secret CINEMA_METADATA_CRON_SECRET to the same value.
Set repository variable CINEMA_METADATA_ENABLED=true only after verifying plan allowance.
The workflow runs twice per hour, up to ten sequential requests, stops on empty queue or failure, and never overlaps itself. Scheduled Actions run on the default branch and may be delayed. No paid service is required by design, but private repository runner minutes are limited by plan; verify allowance and disable paid overage before activation.
Disable either flag to stop processing. Existing movie and review flows remain independent.
Manually dispatch once and inspect counts before enabling recurring execution.
A TMDB 429 delays the affected job; global cooldown across runs remains a follow-up before activation.
