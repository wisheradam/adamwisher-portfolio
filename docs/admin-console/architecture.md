# Architecture and security

[Handbook](README.md) · [Module reference](modules.md) · [Publication](publication.md)

## Request boundaries

The site uses Next.js 15 App Router, React 19, strict TypeScript and Tailwind CSS.
Admin pages and layouts live in [`app/admin`](../../app/admin) and interactive panels
in [`components/admin`](../../components/admin). The overview at `/admin` is the
landing page. It counts non-deleted Draft/Published Project rows and Published
App working rows. These counts do not represent public snapshot eligibility.
SUPER_ADMIN sees up to eight recent events. The section route selects panels for content, media, users, audit
and settings. Navigation also includes reserved sections such as Messages and
Ask Adam. A navigation entry does not imply a management API.

The browser sends JSON or multipart data to [`/api/admin`](../../app/api/admin).
Server handlers use the Node.js runtime and call [`lib/admin`](../../lib/admin)
for authorization, validation, storage and publication. The Store exposes a query
and a transaction interface. Dynamic SQL identifiers come from checked module or
record keys. Values are bound through the adapter. Public content readers execute
on the server and return only what the route needs.

The private `/projects` area has its own
[middleware](../../middleware.ts) and [authentication](../../lib/projects-auth.ts).
Admin sessions do not grant access there. Files delivered by the Admin Media API
require an Admin session with content-view permission.

## Authentication and settings

- [Login](../../app/api/admin/login/route.ts) normalizes the email, checks the
  database-backed attempt limit and verifies a salted scrypt password hash with a
  timing-safe comparison. The limiter permits five attempts per normalized-email
  window of 15 minutes and uses a temporary block after excess attempts. Unknown or
  inactive accounts return the same generic credential error as an incorrect password.
- [Session handling](../../lib/admin/auth.ts) generates a random 32-byte token.
  Only its SHA-256 digest is stored in `admin_sessions`. The browser receives an
  eight-hour `adam_admin_session` cookie with HttpOnly, SameSite Strict and Secure
  in production. A valid request needs an active user, a matching session version
  and a session within its expiry.
- Logout removes the presented session. Account updates and password changes
  invalidate sessions. The [password endpoint](../../app/api/admin/password/route.ts)
  uses the authenticated user's current password and enforces the new-password
  minimum. The Settings panel exposes self-service password changes. Environment
  variables and service credentials are operator configuration.
- Bootstrap is an explicit seed operation for an empty user table. It does not
  reset an existing user. The old Stage 1 signed Admin cookie is historical.
  The current Admin cookie is an opaque token looked up in the database.

## Permissions

[`permissions.ts`](../../lib/admin/permissions.ts) supplies the role matrix.
Admin routes enforce it server-side. An unauthenticated request returns 401
where a permission is required. A signed-in user lacking that permission receives 403.

| Action | SUPER_ADMIN | EDITOR | READ_ONLY |
| --- | --- | --- | --- |
| View ordinary content and protected media | Yes | Yes | Yes |
| Create and edit working content, including SEO configuration | Yes | Yes | No |
| Preview protected Projects or Apps drafts | Yes | Yes | No |
| Upload, replace or edit media metadata | Yes | Yes | No |
| Publish or unpublish snapshot-backed entries | Yes | No | No |
| Delete content or media | Yes | No | No |
| View or manage redirects and feature flags, manage users or view audit | Yes | No | No |
| Change own password | Yes | Yes | Yes |

An edit to an already-published legacy Project requires publish permission.
SEO configuration uses ordinary content permissions and lacks a working/published
snapshot pair. See [module-level gates](modules.md) before treating a setting as
draft-only.

## Validation and audit

Mutation handlers compare the Origin host to the request host, using the forwarded
host when present, and reject missing or mismatched origins. Header integrity
depends on trusted deployment proxy configuration. Server validation covers slugs,
reserved routes, lengths, enum values, approved URL forms, record relationships and
media signatures. Database constraints provide additional enforcement. Snapshot
writes use row locking and version checks where supported.

`audit_events` records actor, action, entity and timestamp, with before/after state on
content changes. Content mutations and snapshot/audit updates share a transaction.
Security actions record events without passwords or session tokens. The
[Admin audit API](../../app/api/admin/audit/route.ts) and panel require audit permission and display up to 100 event summaries.
This history supports accountability and investigation. The repository does not
implement an external immutable audit ledger, centralized identity federation or MFA
for the Admin Console. Treat audit payloads as private Admin data.
