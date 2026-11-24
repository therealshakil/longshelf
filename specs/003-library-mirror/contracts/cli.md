# Contract: `longshelf` CLI

Node 24 on Linux and macOS. Package `packages/sync-cli`, binary `longshelf`. It opens
`metadata.db` read-only and never writes to the Calibre library (FR-001, SC-008).

## Commands

```
longshelf library [--dry-run] [--yes] [--library <path>]
longshelf config set <url|client-id|client-secret> <value>
longshelf config show            # secrets shown as ****1234
```

`library`:
1. Read the library and hash new or changed files and covers. The hash cache is keyed by path,
   size and mtime.
2. Ask the server's `plan`.
3. If `removalNeedsConfirm`, list the books and ask "Remove these N books from the mirror?
   [y/N]". `--yes` skips this only when 10 or fewer books would go.
4. Upload missing blobs, largest first, two at a time, with a progress line.
5. Build and upload the catalogue, then commit.
6. Print the report.

`--dry-run` stops after step 3 and prints what would happen.

## Configuration

Priority, highest first:
1. `--library`;
2. environment variables `LONGSHELF_URL`, `LONGSHELF_CLIENT_ID`, `LONGSHELF_CLIENT_SECRET` and
   `LONGSHELF_CALIBRE_LIBRARY`;
3. the config file, `$XDG_CONFIG_HOME/longshelf/config.json` (macOS:
   `~/Library/Application Support/longshelf/config.json`), written with mode 0600;
4. the library Calibre itself uses (DR-0009).

## Output (FR-008)

```
Longshelf: 670 books in Calibre, mirror at library.longshelf.app
Uploaded 3 books (41 MB), updated 2, removed 1. 0 problems.
```
With a problem:
```
1 problem:
  "The Count of Monte Cristo": file missing on disk (EPUB). Fix it in Calibre, then run again.
Mirror updated for everything else.
```
With no changes: `Nothing changed. Mirror is up to date (checked 670 books in 4 s).`

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Done, with or without changes |
| 1 | Finished, but some books had problems (listed) |
| 2 | Not configured, or the credential was refused: says which `longshelf config set` to run |
| 3 | Another run holds the lock: says when it expires |
| 4 | The owner declined the removals: nothing changed |
