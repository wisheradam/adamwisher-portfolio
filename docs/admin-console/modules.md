# Admin modules

[Handbook](README.md) · [Permissions](architecture.md#permissions) · [Publication](publication.md)

[The SQL migrations](../../lib/admin/migrations) define tables and constraints.
[Record validation](../../lib/admin/records.ts) and [structured field configuration](../../lib/admin/module-config.ts)
define the editable fields. Collection APIs use GET for listing and POST for creation.
Detail APIs accept GET, PATCH and DELETE unless a row below states otherwise.
List endpoints use search and 25-item pages. Most deletion is soft deletion, and
readers exclude deleted rows. Users are deactivated through a PATCH. Feature flag
deletion removes the override row.

| Admin module and API key | Main data and dependencies | Publication and public integration |
| --- | --- | --- |
| Projects · `/admin/projects`, `records/projects` | `projects` stores unique slug, title, summary/body, category/role, ordering, visibility and editorial status. Edits to already-published Projects need publish permission. Draft preview at `/admin/preview/[id]`. | Public eligible rows augment the six canonical case studies in the Work catalog under database cutover. New slugs use `/work/[slug]`. Existing case-study routes are reserved. Legacy readers use the current published row, and there is no separate Project snapshot or uploaded-attachment relationship. |
| Apps & Tools · `/admin/apps`, `records/products` | `products` stores slug, type, summary/body, status, version and HTTPS links. Apps have additional working statuses such as `CONCEPT`, `BETA`, `RELEASED` and `PAUSED`. Preview at `/admin/preview/apps/[id]`. | `PUBLISHED` creates or advances a snapshot. Listing at `/apps`, detail at `/apps/[slug]` and eligible changelog. Listing checks `show_apps`. Verify direct route access independently of listing and sitemap visibility. |
| Experience · `modules/experience` | `experience` stores roles/employer, date range, descriptions, ordering, optional logo and company URL. | Snapshot-backed. `/about` uses reconciled public rows after matching knowledge cutover. |
| Education · `modules/education` | `education_records` stores institution, program, degree/field, dates, optional media and institution URL. | Snapshot-backed. `/education` uses the reconciled reader after matching knowledge cutover. |
| Certifications & Training · `modules/certifications` | `certifications` stores provider, credential type, dates, reference ID/URL, optional certificate media and skills. The Admin label is Certifications & Courses. | Snapshot-backed. The Education page presents qualifications and training with the site's source classification and date precision. An imported course does not automatically become a professional certification. |
| Releases and Changelog · `modules/releases` | `releases` stores version, title, release date, platform/build, notes and optional media. Foreign keys check the references. At least one product or project is required. | Snapshot-backed. Eligible product releases appear at `/apps/[slug]/changelog`. A child is hidden when the linked parent loses eligibility. There is no equivalent general public project changelog route. |
| Timeline / History · `modules/timeline` | `timeline_events` stores event type, title, date range, optional app/project/release, asset or external link. | Snapshot-backed. `/history` requires database source, the `show_history` flag and eligible events. Linked parents must be public. |
| Media · `/admin/media`, `media` | `media_assets` stores upload metadata and storage keys. Use collection POST to upload, detail PATCH to edit text, PUT to replace, DELETE to soft-delete and `media/[id]/file` to read bytes. Accepts PNG/JPEG/WebP/PDF up to 10 MiB. Referenced assets cannot be deleted. | On main, local files are authenticated Admin-only, and Aurora mode rejects this local storage path. Main replacement updates the same media ID and removes the old file on a best-effort basis. Back up referenced files before replacement. The private S3 adapter and publication-gated public file route are [draft work](history.md#open-work). |
| SEO · `modules/seo` | `seo_metadata` holds path, title/description, canonical and Open Graph overrides, robots controls and an optional media reference. | Configuration uses ordinary content edit permission, with no snapshot. Applies when the database source is active and route eligibility passes. The [SEO guide](../seo.md) describes canonical, sitemap, social-image and noindex behavior. |
| Redirects · `modules/redirects` | `redirects` maps unique source path to destination, HTTP status 301/302, enabled state and notes. Validation checks protected paths, loops and matching routes. | Immediate configuration when both database and redirect gates are enabled. Middleware asks `/api/public/redirect` for a lookup. Admin, API and protected Projects paths are excluded. |
| Feature Flags · `modules/feature-flags` | `feature_flags` stores an allowlisted key, enabled state and description. Delete restores code defaults. | Runtime consumers include Apps listing, History and Ask Adam. The schema also accepts `show_education` and `show_experimental_projects`. Main has no runtime callers for these keys. |
| Users and Access · `/admin/users`, `users` | `admin_users` stores unique email, salted hash, role, active flag, session version and login metadata. GET/POST for collection and PATCH for role or activation. | SUPER_ADMIN only. Role or active-state changes revoke sessions, and the last active SUPER_ADMIN is protected. Settings provides change-own-password. No public user API or snapshot. |

Every key above is relative to `/api/admin/`. Structured module panels live at
`/admin/<module>`. Editors can create and update working content and edit SEO.
Reads of redirects and flags also require their management permissions. Use the
[record routes](../../app/api/admin/records),
[module routes](../../app/api/admin/modules), [media routes](../../app/api/admin/media)
and [user routes](../../app/api/admin/users) as the method and status-code reference.


## Route and authorization details

- **Projects and Apps.** Both use record collection and detail routes. Reader
  roles can view Admin data. Editors create and edit working rows and access
  authenticated previews. A SUPER_ADMIN performs publication, unpublication and
  deletion. The legacy Project edit restriction applies while already published.
- **Experience, Education, Certifications, Releases and Timeline.** Use the
  structured collection and detail routes with the API keys above. Editors save
  working records. SUPER_ADMIN controls release and deletion. Validate date
  ranges and referenced IDs before writing. For Releases and Timeline, check
  parent publication for every linked object before relying on a public listing.
- **Media.** All three roles can read through the protected Admin file route.
  Editors can upload, edit metadata and replace bytes. SUPER_ADMIN deletes.
  References may come from working content or a published snapshot. A local
  file and its metadata have independent storage semantics.
- **SEO.** Ordinary content readers can view, editors can create and patch,
  and SUPER_ADMIN can delete overrides. There is no preview-to-public promotion
  step. A valid override on an ineligible route cannot grant public eligibility.
- **Redirects and Feature Flags.** Both reads and writes require SUPER_ADMIN
  management permission. A redirect row is soft-deleted. Flags are removed
  directly to restore code defaults. Verify both configured gates before testing
  a managed redirect with an anonymous request.
- **Users.** The collection lists and creates. The detail endpoint patches an
  approved role or active status; it has no remove-user method. Password
  self-service is a separate authenticated endpoint. See the
  [account runbook](operations.md#account-and-publishing-operations).
