# Archived: Ravelry integration

Woolgaze dropped Ravelry support (decided 2026-10-28). The code here is kept for
reference only and is not imported or built.

- `ravelry.js` is the client as it stood: read-only Basic Auth yarn search, a
  connection test, and the share-text builder. The share-text builder now lives in
  `src/lib/share.js`.
- Removed UI: the Ravelry connection card in Settings, the "Look up details on
  Ravelry" button in the yarn form, and the "Open Ravelry" link in the share dialog.
- To see the app exactly as it was, check out commit `baa3500` (the last commit before this archive).
