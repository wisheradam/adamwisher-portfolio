# Owner-side restore catalog inspection

The owner approved the temporary inspection of the isolated restore database
in [Draft PR #14](https://github.com/wisheradam/adamwisher-portfolio/pull/14#issuecomment-6982056828).
The script embeds and verifies the exact three reviewed SQL statements. It checks the
database identity and original ACL and membership before the grant, and verifies
the original state after the revoke.

## Private CloudShell prerequisites

Use the existing approved private operator environment and checkout. Use the
existing owner credentials in a private libpq passfile owned by your user (regular
file, mode 0600). The passfile needs entries for the exact direct endpoint on
port 5432, user `neondb_owner`, and databases `neondb` and
`recovery_pr14_7955d1df`. Keep the passfile and its contents out of Git, chat,
command arguments and shell history. Run in an exclusive operator window with
the independent owner cleanup channel available throughout.

The AWS CloudShell `psql` client reported 16.15. The script uses Python 3.9+ and
the **loaded libpq 16+** directly. It checks the library version at runtime.
No PostgreSQL 18 client or Python dependency needs to be installed when the
existing libpq meets the version check. The target server remains PostgreSQL 18.
Native DNS must return the previously verified address set. TLS uses the approved
hostname, direct pinned IP, `verify-full` and system roots. The script requires
independent authenticated maintenance connections and confirms the detached watchdog
can see the expected baseline from a separate backend before committing CONNECT.

After the prerequisites pass, run the command from the reviewed checkout. The
passfile path below assumes the approved passfile is already `~/.pgpass`.

```bash
python3 -I scripts/neon-catalog-inspect.py --passfile "$HOME/.pgpass" --approval 6ad843189e650af38304d00fdafa7ffa67902be60e05eead2b9bb8127cd17be1
```

The watchdog starts cleanup on request, parent exit, or its deadline. It revokes
the grant over its own connection. The parent also has an independent cleanup
connection. After revocation is verified, the one already-open read-only session
runs the catalog query and closes. A successful run prints only aggregate catalog
and cleanup evidence. Run only once per approved inspection. Treat a cleanup
failure, total terminal loss or dropped database access during the short committed
CONNECT window as an incident. Use the independent operator channel and the
grantor-specific revoke procedure already in the reviewed PR. The detached process
can survive the parent process dying, but cannot survive destruction of its entire
execution environment. Verify the exact baseline before closing the incident.

## Disposable tests

`python3 scripts/test-neon-catalog-inspect.py -v` uses the CI PostgreSQL 18
service on localhost and synthetic roles only. The tests exercise a successful
inspection, a target connection failure, a watchdog authentication failure, its
deadline, SIGTERM, parent SIGKILL and loss of both cleanup paths. The dual cleanup
failure must exit with no success output and explicitly require independent cleanup.
