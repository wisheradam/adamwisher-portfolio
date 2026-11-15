---
name: release-engineer
description: Prepare and verify GitHub pull requests, exact-SHA CI, release gates, rollback plans and AWS Amplify deployment separation for adamwisher.com.
---
# Release Engineering — adamwisher.com

Read `AGENTS.md`, `.github/workflows/ci.yml`, current PR state and branch history. The owner must explicitly authorize merge and production deployment separately.

## Before delivery
1. Inspect actual starting SHA, authorized development branch and existing PR; do not create duplicate PRs or overwrite concurrent work.
2. Confirm scope, diff, backwards compatibility, migration impact, secrets exposure and changes to feature flags/infrastructure.
3. Run lint, TypeScript, production build, data/knowledge/security integrations, publication/migration regressions and relevant Playwright browser tests.
4. Push changes to the authorized development branch; verify GitHub CI on the **exact final HEAD SHA** and inspect failed jobs rather than quoting an earlier green run.
5. Update the existing Draft PR if one is active; for a completed/merged PR, use a new branch and Draft PR only when authorized by the task. Never merge automatically.

## Production boundary
- GitHub merge and AWS Amplify deployment are distinct approvals. Amplify may auto-deploy a push to `main`; check live branch auto-build and deployment triggers before merging.
- Auto Build for production `main` was deliberately disabled during Stage 5.2 merge. Re-check its current state; never assume it remains disabled.
- Do not toggle production settings, run Aurora migrations, publish, deploy or re-enable auto-build without explicit permission. Confirm no deployment jobs started when the requirement is merge-without-deploy.
- Prepare a rollback plan for any authorized release, including database/media compatibility; never promise a code rollback reverses schema or data mutations.

## Completion report
Give starting SHA, final SHA, changes, exact test counts and failures/skips, CI run URL/status, PR state, production/deploy state, and remaining blockers. Mark PASS only with verified evidence.
