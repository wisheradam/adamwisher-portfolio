# Admin Console and engineering handbook

The Admin Console manages portfolio content and site configuration through a private
Next.js application. The public site also has source-controlled content. Which data
a public route uses depends on that route's publication and cutover code.

| Guide | Use it to |
| --- | --- |
| [Architecture and security](architecture.md) | Trace requests, accounts, sessions, permissions, validation and audit records |
| [Module reference](modules.md) | Find tables, Admin APIs, public consumers and limitations for each module |
| [Publication and cutover](publication.md) | Follow working edits through publication, parent filtering and rollback |
| [Infrastructure and operations](operations.md) | Set up a local environment, understand hosting and database choices, and plan recovery |
| [Development history and verification](history.md) | Check merge, CI and deployment evidence and see open release gates |

## Scope and maintenance

The implementation reference is the GitHub `main` tree at
[`ae1113d`](https://github.com/wisheradam/adamwisher-portfolio/commit/ae1113dd084301613233934fdcd225eb1895a5a9).
The operations and history guides identify the separate deployed revision and open
drafts. [Earlier Admin notes](../admin-console.md) retain their stage-by-stage
evidence, and the [SEO guide](../seo.md) covers the public metadata contract.

When changing a module, update its reference, any publication changes and the
corresponding operations or release evidence in the same review. Use the source
links to check the current handler, migration and public reader. Date live
observations and link to the actual commit or CI run. Keep credentials, private
content, production identifiers that are unnecessary for operation, and recovery
evidence containing data out of this handbook.
