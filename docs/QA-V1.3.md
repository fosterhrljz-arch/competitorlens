# CompetitorLens V1.3 verification record

Verified November 12, 2026. Production build succeeded. **32 unit tests and all 35 browser tests passed.** The complete non-demo journey was then strengthened to disable networking after collection; that targeted regression also passed. No application source changes followed the final full run. Earlier verification records remain in `QA-V1.2.md` and `QA-V1.1.md`.

## Environment

- Windows, Node.js 24.16.0, Playwright, isolated headless Microsoft Edge 157.
- Actual rebuilt `CompetitorLens.html`, served at `http://127.0.0.1:4173` by the included loopback server.
- Full responsive journeys: 1440 × 900, 768 × 1024, 390 × 844, and 320 × 720. Existing 1536 × 1024 checks also pass.
- **Browser plugin not available.** The existing Playwright workflow was the supported fallback. Direct file-protocol automation was not performed; the earlier in-app browser restriction was not bypassed.
- Fresh test contexts and synthetic fixtures only. No saved user profile, external account, remote repository, deployment, or other project was accessed.

## Checks

| Check | Result and evidence |
|---|---|
| Page identity | PASS — expected title, Welcome heading, project and page headings |
| Nonblank content | PASS — all primary pages, details, three editor steps, and dialogs |
| Framework overlay | PASS — none observed |
| Console health | PASS — no application console errors or uncaught errors in responsive audits |
| Background requests | PASS — no automatic external requests in desktop/mobile audits |
| Screenshot evidence | PASS — rendered captures inspected at all four target widths |
| Interaction proof | PASS — all 35 workflows, including the full non-demo journey below |
| Mobile readability | PASS — visible text at least 12px; primary reading content enlarged; audited mobile controls at least 44px tall |
| Layout | PASS — no document-level horizontal overflow; wide matrices/report tables scroll within their containers |
| Offline behavior | PASS — manual creation, editing, comparisons, validation/history, HTML export, backup and restore with network disabled after initial load |
| Print | PASS — all nine pages of the non-demo A4 PDF visually inspected |

The only command-line warnings concern `NO_COLOR` and `FORCE_COLOR` being set together by the test runner. They are unrelated to application execution.

## Complete journey

`First launch → New Project → three competitors → distinct audience notes and evidence → compare/filter → validate → change research → History → scoped report → full backup → replace workspace → restore → reload`.

The journey creates Alpha, Beta, and Gamma through the UI. Each has two audiences, with overlapping Small studios and Agencies segments. Their prices are 0, 12, and 24 USD/month. Evidence uses user-pasted URL text, an intercepted successful page fetch, and a manual research note. Generic company notes remain distinct from segment-specific notes. This is controlled synthetic research in a non-demo workspace, not evidence about real businesses.

Audience and feature drilldowns open the correct scope. Removing Gamma selects a two-competitor report. A purchase-flexibility hypothesis is marked Validated with a note; changing Alpha's offer creates new current hypotheses while the old decision remains Stale / Needs review in History. The report includes the original note, selected scope, collection methods, and zero price. JSON restore reproduces the exported state exactly, and reload preserves the decision. After Beta's fetch, the strengthened test disables networking before creating Gamma and performing the remaining edits/exports/restore; networking is re-enabled only to reload the test server.

## Regression coverage by requested fix

| Fix | Verified behavior |
|---|---|
| First-run isolation | Empty storage stays empty at Welcome; Resume disabled; demo edits do not enter real storage/backups; New Project starts empty |
| Audience scope and migration | Schema-1 fixtures representing V1/V1.1/V1.2 preserve old fields, source metadata/maps, and generic notes; no generic-to-segment copying; retained labels survive; schema-2 round trips |
| Opportunity history | Stable revision snapshots retain status, notes, and evidence after changes/deletion; orphan and still-matching legacy decisions recovered as stale; new evidence never inherits old validation |
| Pricing | Missing/invalid values excluded; zero accepted; currency/unit validation; amount/currency/unit conflicts; reviewed conflicts invalidated by changed inputs; comparisons use one numeric representation |
| Provenance and pending evidence | Pasted/fetched/manual/demo/unknown-legacy methods distinct; edited fetched drafts lose fetched classification; URL-only and mapping-only drafts block saving until attached/cleared |
| Readability | Font and touch-target assertions plus visual inspection on all primary screens and report charts |
| Welcome/onboarding | Native mobile preview; no saved demo on first launch; empty-project manual/CSV checklist |
| Series colors | Five distinct stable indices; duplicate imported indices repaired; consistent chart/chip/legend colors |
| Comparison scope | Last selected chip protected; filtered report scope preserved; project-wide opportunity/history labeling; sticky headers; local scrolling; tooltip/drilldown interactions |
| Credibility | Record counts differ from audience size; source counts differ from record counts; unknown fields remain unknown; heuristic basis/limitations explicit; CORS/manual fallback |
| Reports and wording | Feature/audience source drilldowns; current and stale evidence; scope/provenance/status/caveats; HTML export/print; hostile labels safely escaped |
| Data safety | Full-source CSV/JSON round trips; malformed CSV atomic rejection; demo flags preserved; quota-failure one-click backup and recovery; corrupt bytes untouched; unsaved and cross-tab draft protection |

The three migration cases exercise the common schema-1 format used by those releases. They are fixture-based compatibility tests, not an inspection of a user's existing browser research.

## Visual review and fixes

Inspected at every target width: Welcome; empty-project onboarding; Overview; Competitors and pricing; Audience Analysis; Competitive Matrix; Opportunities Current and History; Reports; Data Management; competitor detail Overview, Audience and Sources; Profile, Audience and Evidence editing steps; new-project, discard and documentation dialogs; exported HTML and its chart section.

The V1.2 palette, sidebar/navigation, dashboard hierarchy, cards and analytical chart styles remain. Changes address readability and functional scope, without a new visual theme.

Issues found and corrected during QA:

- Report preview expanded the mobile document to its intrinsic table width: containment and local scrolling now keep the page within the viewport.
- Old 38px overrides affected project/source selectors: mobile controls now meet the 44px target.
- The narrowest editor tab wrapped the final letter of “positioning”: its mobile label is now “Profile,” retaining the full accessible name.
- Opportunity status tabs hid the final filter on phones: tabs now wrap.
- Audience matrix cells could count only generic sources: each audience label now opens its segment-scoped evidence and count.
- Legacy validation could be applied to a newly generated matching key: old decisions now receive separate recovered stale snapshots.
- Printed hypothesis headings could be separated from their metadata/body: heading and metadata break rules keep their opening context together.

Full-page modal captures show the fixed overlay over the viewport and the underlying document below it; this is screenshot behavior, not a live overlay gap.

## Evidence and reproducibility

Screenshots and print files remain outside the project in the sibling `competitorlens-v13-review` folder. They are not bundled as application assets. Names use `v13-<screen>-<width>.png`; `journey-report.html`, `journey-report.pdf`, and `print-page-1.png` through `print-page-9.png` record report review. Use `CL_QA_DIR` to recreate captures in a chosen external folder.

Commands: `npm.cmd run build`, `npm.cmd test`, `npm.cmd run test:e2e`, then `npm.cmd run test:e2e -- tests/v13.spec.mjs -g "Complete non-demo journey"` for the enhanced offline case. `pdfinfo` and `pdftoppm` were used to inspect the nine-page A4 report. The build writes identical portable HTML files at the root and in `dist`; packaging checks verify embedded assets, archive integrity, and the included source/test files.

## Remaining limitations

- Edge/Windows was automated; Safari, Firefox, native mobile file launch, and direct file-protocol persistence were not. Browser and file location can affect local storage; follow the README's backup-first upgrade steps.
- Successful/failed collection uses controlled fixtures. Arbitrary websites can block CORS/redirects; manual paste and CSV remain available.
- Source-linked is not verified. Opportunity rules and qualitative positioning require analyst judgment; complex price notes may need explicit review.
- Old versions did not save full historical evidence or dates. V1.3 retains old notes but cannot reconstruct missing history.
- Research changes conservatively stale current hypotheses. Growing history is subject to browser quotas and documented import limits; use full backups.
- Print pagination can differ between browsers and settings. Wide tables intentionally use local horizontal scrolling on mobile.

Optional for future development: the Browser plugin can provide in-app navigation, screenshots, DOM snapshots, console logs, and interaction validation.
