# Test library

A small Calibre library for spec 003 tests (CLI, ingest and e2e), made with `calibredb` (Calibre
9.18) on 2026-11-24. Do not open it in the Calibre GUI: that may rewrite `metadata.db`.

| Book                                   | Shape it tests                                 | Source                                                                                 |
| -------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------- |
| Dracula, Moby Dick, Middlemarch        | EPUB with cover                                | Project Gutenberg EPUBs from `apps/web/static/sample/books/` (public domain in the US) |
| The King in Yellow                     | Two formats: EPUB plus a one-page PDF stand-in | EPUB as above; the PDF is generated text written for these tests                       |
| Paradise Lost                          | No cover                                       | Project Gutenberg EPUB as above, added with `calibredb add_format` to an empty record  |
| The Evening Courier [Sat, 14 Nov 2026] | News issue (tag `News`)                        | Generated text written for these tests, converted with `ebook-convert`                 |

Nothing here comes from the owner's library.
