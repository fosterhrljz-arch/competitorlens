# CompetitorLens V1.1 verification record

Verified November 12, 2026. The production build completed successfully. All **17 unit tests and 19 browser workflow tests passed** on the final implementation.

## Environment and scope

- Windows, Node.js 24.16.0, isolated headless Microsoft Edge 157 through Playwright.
- The actual portable `CompetitorLens.html` was served at `http://127.0.0.1:4173` using the included loopback-only server.
- Desktop viewport: 1536 × 1024. Mobile viewport: 390 × 844.
- The dedicated Browser plugin was unavailable. The in-app preview had blocked `file://` and failed to load the initial loopback preview; isolated Playwright was used for browser verification.
- User browser profiles and saved research were not used. Every test uses a fresh browser context or explicitly seeded V1 fixtures.
- Direct double-click/file-protocol automation was not performed. Static checks verify that the distributable has no external script/style dependencies, no module script, and starts only after the root element exists.

## Page and responsive coverage

Both desktop and mobile runs visit Overview, Competitors, Audience Analysis, Competitive Matrix, Opportunities, Reports, Data Management, competitor details, and all three editing steps. They verify visible rendering, no document-level horizontal overflow, and no application error boundary. Navigation, documentation dialog sizing, and Escape dismissal are exercised.

Rendered screenshots were inspected for hierarchy, spacing, neutral colors, typography, sticky comparison regions, mobile stacking, readable form controls, and retained demo labels. Comparison tables intentionally scroll inside bounded regions. Screenshots and PDF inspection files are outside the source tree in the sibling `competitorlens-redesign-review` folder.

## Working interaction loops

1. Overview → unknown audience cell → linked audience cell → mapped source library.
2. Comparison chips → changed matrix scope → reset; whole-project research status remains unchanged.
3. Positioning map → evidence axis → competitor sharing the same chart coordinate → dedicated details.
4. Overview research brief → the matching opportunity hypothesis.
5. Competitor search/sort → summary card → detail tabs → field-specific evidence.
6. Add competitor → Profile → Audience → Evidence → attach source → save → reload → edit → delete with confirmation.
7. Unsaved draft → change steps → leave request → keep editing → explicit discard.
8. V1 fixture with custom currency, notes, full evidence mappings, and opportunity state → all new views → JSON export → single-field edit → full restore.
9. Segment navigation → structured customer insights → supporting source → competitor filter → segment search.
10. Competitive matrix → differences-only / features-only → sticky-header scroll check → field sources → fewer than two selected → reset.
11. Opportunity → Start validation → notes → reload → status filter → validation decision.
12. New project → CSV preview → confirmed import → recorded-only audience cell → invalid import rejected atomically.
13. Report title/commentary → generation → complete standalone HTML export → print mode → CSV and JSON downloads.
14. Public-page fixture → reviewed extraction → pending-source guard → field mapping → attachment. Script text is stripped. Reserved demo URLs produce actionable manual-fallback guidance.
15. Corrupt storage → rejected write preserves original bytes → explicit recovery.
16. Unavailable storage → in-memory workspace → downloadable complete backup.
17. Cross-tab update during editing → keep draft or explicitly load the saved workspace.

## Data and evidence checks

- Backup schema and storage key unchanged. Existing normalized V1 fixtures survive navigation and JSON round trips exactly.
- Editing one field preserves unrelated fields, custom currency, source IDs/excerpts/mappings, and validation notes.
- Audience and research projections do not mutate source records.
- Source-only fields do not count as populated claims. A zero price is a recorded value.
- Case-insensitive audience matching distinguishes linked, recorded-only, and unknown cells.
- Existing CSV quoting, duplicate rejection, numeric/URL validation, formula neutralization, backup validation, report escaping, and demo-label tests remain passing.
- No automatic external requests or app console errors were observed during page audits. Website collection success is tested with local intercepted fixtures, not a claim that arbitrary websites permit CORS access.

## Print and export review

The customized demo report was rendered as a seven-page A4 PDF. All pages were inspected, including the comparison table with repeated headers, customer insights, opportunity hypotheses, evidence appendix, and numbered footers. Printed output hides application navigation and uses the full printable width. HTML, CSV, and full JSON download contents were checked.

## Issues caught and fixed

- Equal chart coordinates originally overlaid clickable targets. The chart now preserves one accurate marker and provides separate names for each record.
- Reusing the editor’s Continue button as a submit button could submit during the same click. Continue now prevents default submission and has a separate React key from Save & finish.
- Mobile Documentation had lost its accessible name when its visible text was hidden. It now has an explicit accessible label.
- Print layout needed a final override to remove the app sidebar margin.
- Recovery-mode CSV import no longer announces success when the write is blocked.

## Practical limits

Safari, Firefox, native mobile local-file launch, and arbitrary third-party CORS behavior were not verified. Local-file storage behavior depends on browser and file path; the README explains backing up and restoring before an upgrade or move. There is no real traffic/audience provider, background collection, predictive model, or independent verification of analyst-entered claims. No AgentGit session, external account integration, remote repository, or deployment was created.
