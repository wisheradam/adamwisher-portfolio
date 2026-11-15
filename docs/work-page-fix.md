# Work route availability regression

Root cause: /work always queried projects before rendering its six source-controlled
case studies. Without production database configuration, the old driver defaulted to
PGlite under Amplify's transient /tmp/app path and failed creating .data/admin-pg.

Work now calls the existing publicProjects catalog and shares ProjectFolders with Home.
The source-controlled six folders require no database. Managed discovery remains explicitly
opted in with PUBLIC_CONTENT_SOURCE=database and retains existing published/public/nondeleted
filters and private-field exclusion. A configured reader failure propagates; no catch
silently substitutes content. No database is initialized to mask the production exception.

The audit also gated dynamic managed Project/App detail pages, App metadata and the Apps
listing before database reads in static mode. Static project routes retain priority and SEO.
Sitemap already had the correct source gate. History/changelog and factual knowledge readers
retain their existing cutover gates. Admin routes remain authenticated and database-backed.

HTTP regression runs a built production server with driver/credential configuration removed
and an inaccessible database path: Home/Work, all six case studies, Apps, sitemap and robots
must respond, unknown managed details return 404, Work renders six folders. A separately
configured invalid driver must fail 500 for Work/sitemap/managed Project details. Managed
fixtures verify Draft/private/deleted/archived content and working body material never leak.

Browser coverage exercises Work at 1440/1280/768/390/320px, both themes, axe, real images,
keyboard, touch and reduced motion. CI publishes admin-work-folders screenshots.

Coordination: based on main 4bbbef5462c637cfbb460ad710c4c8f086fd119a. PR #14 was inspected
at 720f7fc5fcde16f85b5426768d32b03108162704. This fix does not edit its database adapter,
migration engine, dependencies or AWS settings and can be integrated independently.
No merge/deployment is authorized; production Auto Build is enabled.
