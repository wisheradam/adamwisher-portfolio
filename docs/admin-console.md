# Admin Console (draft implementation)

This branch adds a local review implementation at `/admin`. It is **not deployable to the existing AWS Amplify production runtime**: the SQLite database lives on the application filesystem, which is not durable or shared across instances. A durable database adapter and migration are required before release. Do not merge or deploy this branch as is.

## Local setup

Run `npm ci`. Generate a random secret (at least 32 characters) and a scrypt password hash with a unique salt. Set `ADMIN_SESSION_SECRET`, `ADMIN_PASSWORD_HASH=scrypt:<salt>:<128-hex-character-hash>`, and optionally `ADMIN_DB_PATH` in `.env.local`. The hash can be generated with Node's `crypto.scryptSync(password, salt, 64).toString('hex')`. Never commit credentials. Run `npm run dev`, open `/admin/login`, and sign in. The database is initialized from `lib/admin/migrations/001_init.sql` at first access and defaults to `.data/admin.sqlite` (ignored by Git).

## Architecture and security

Next.js App Router server routes guard `/admin` and `/api/admin`. A separate eight-hour HttpOnly, SameSite Strict HMAC cookie protects the console; POST/PATCH/DELETE enforce same-origin requests. The password is checked server-side with scrypt and timing-safe comparison. The current credential represents one SUPER_ADMIN. The role types EDITOR and READ_ONLY are reserved for a later identity provider and user store; they cannot be assigned through the UI. Sessions are not individually revocable. Login rate limiting is not yet implemented. Deploying this implementation publicly before those controls and durable storage are added is not approved.

Projects, products, and audit events are separate SQLite tables. Project status is Draft, Review, Published, or Archived; visibility is Public or Private. Only Published/Public managed projects appear under `/work/<slug>` and the Work listing. Existing six case studies stay in source and retain their routes. Products are managed in admin only. Changes to a record do not publish unless the status is explicitly set. Preview at `/admin/preview/<id>` requires a session and carries noindex metadata. It is a simplified content preview, not an exact public page rendering. Soft deletes are recorded but restoration is not exposed yet. Audit stores previous/new record data; do not put secrets in content fields.

## Scope and next steps

The dashboard, projects, apps and tools, basic search/pagination, preview, and audit persistence are implemented. Other navigation sections are explicit placeholders. Media upload, contact inbox, Ask Adam management, experience, education, timeline, releases, SEO, redirects, feature flags, users, scheduling, and full structured migrations of existing static content are deferred. The Contact endpoint still uses its existing SES/DynamoDB handling; Ask Adam retains its static knowledge source. No existing production data is mutated.

Before production, use the established AWS account's durable data store, write versioned migrations and backup/restore steps, seed existing content with exact fact and route preservation, implement account-based authentication with role enforcement and revocation, add login rate limiting, media storage/validation, and end-to-end tests. A new module should have its own schema/migration, server repository, validation and permission checks, admin UI, public publication query, audit event, and tests. A new public content type must select only published, public records server-side.
