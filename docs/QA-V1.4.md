# CompetitorLens V1.4 verification record

Verified November 12, 2026. Final production build passed without build warnings. **48 unit tests and 45 browser tests passed.** Final application source changes were included in these runs. Public-site acceptance and the native launcher were exercised separately. Earlier release records remain in `QA-V1.3.md`, `QA-V1.2.md`, and `QA-V1.1.md`.

## Environment and scope

- Windows, bundled Node.js 24.16.0, Playwright, headless Microsoft Edge 157.
- Built `CompetitorLens.html` served on loopback: existing UI tests at `http://127.0.0.1:4173`, injected-fixture and live collector tests on random loopback ports, production launcher at `http://127.0.0.1:4184`.
- 1440 × 900 desktop, 768 × 1024 tablet, 390 × 844 phone, and 320 × 720 narrow phone. Earlier 1536 × 1024 checks also pass.
- **Browser plugin not available.** Repository Playwright was the supported fallback. Direct file-protocol automation was not performed; no earlier browser restriction was bypassed.
- Fresh contexts only. No saved user browser profile, account, other project, remote repository, deployment, or AgentGit session was accessed. Website requests were explicit, public and read-only.

The flow under test was: **Welcome → New Project → enter competitor URLs → collect → inspect/edit evidence and audience proposals → save → compare → opportunity validation → report/export → backup/restore → reload**, with repeat research, cancellation, failures and manual recovery exercised separately.

## Required checks

| Check | Result |
|---|---|
| Page identity | PASS — expected title, Welcome, project and page headings |
| Nonblank rendering | PASS — all core pages, editor steps, research tabs, history, review and dialogs |
| Framework overlay | PASS — none observed |
| Console health | PASS — no application console/uncaught errors in responsive audits; no uncaught errors in final live journey. Expected failed-request responses are exercised in negative tests. |
| Screenshot evidence | PASS — desktop/mobile research, numeric review, source excerpts, dashboard, comparison, audience and report views inspected |
| Interaction proof | PASS — 45 browser regressions plus the live and launcher journeys |
| Layout/readability | PASS — no document-level horizontal overflow; tables scroll locally; audited visible text at least 12px and mobile controls at least 44px |
| Offline/manual behavior | PASS — retained manual workflows, content import, inference, editing, CSV, reports and backup/restore without an AI key or collection service |
| Print/export | PASS — HTML exports and A4 PDF; all 53 final live-report pages inspected as contact sheets, with chart and traceability pages inspected at full rendered size |
| Persistence | PASS — final live backup restore and reload reproduce the entire exported state exactly |

Only the test runner's existing NO_COLOR/FORCE_COLOR warning remains. It is unrelated to application execution.

## Final real-site acceptance

Completed **2026-11-12T14:45:33.738Z**. Three real competitor websites, **11 retained pages, 72 accepted evidence-linked proposals, zero collection failures** in the final run. These are research/test record counts, not market or audience statistics. Proposals were accepted to exercise integration; the test does not certify the truth of each business claim.

| Competitor | Pages | Accepted proposals | Recorded audience labels | Segments with needs/motivations |
|---|---:|---:|---:|---:|
| Plausible Analytics | 4 | 39 | 8 | 4 |
| Umami | 2 | 6 | 1 | 0 |
| Fathom Analytics | 5 | 27 | 5 | 1 |

Collected source URLs:

- **Plausible Analytics:** `https://plausible.io/`, `https://plausible.io/features`, `https://plausible.io/about`, `https://plausible.io/for-ecommerce`
- **Umami:** `https://umami.is/`, `https://umami.is/pricing`
- **Fathom Analytics:** `https://usefathom.com/`, `https://usefathom.com/pricing`, `https://usefathom.com/features`, `https://usefathom.com/about`, `https://usefathom.com/why-fathom-analytics/for-european-companies`

Every accepted finding retained an exact quotation present in its linked saved source. Source methods were fetched, dates were recorded, and inferred findings remained classified as inferred. Umami's limited static content produced a low-confidence exploratory audience and no fabricated needs or motivations. Numeric prices were left unknown where symbols/units/conditions were ambiguous. Explicit zero-price application and analyst-confirmed numeric pricing were tested separately with controlled quotations.

The final journey visited Overview, Competitors, Audience Analysis, Competitive Matrix, Opportunities and Reports at all four target widths; exported HTML and a PDF; saved a full JSON backup; restored it through the UI; reloaded; and compared saved state for exact equality. No uncaught application errors occurred.

### Public access variability observed

An earlier live pass successfully collected 14 pages across Plausible, Simple Analytics and Fathom. After the final inference refinements, Simple Analytics' home and pricing pages repeatedly timed out although its robots file returned HTTP 200. The application showed a meaningful timeout, retained completed competitors, and exposed retry. Those incomplete runs were **not counted as passing three-competitor acceptance**. The final successful run substituted Umami; no blocks or timeouts were bypassed.

Failure/manual recovery is covered by browser fixtures: HTTP 403 → visible error → retry → manual page import → evidence-checked optional suggestion → selected finding → explicit numeric-price confirmation → save. A separate successful-retry regression recovers six discovered pages and the brand name while retaining the original failure log. Private-address/DNS, redirect, robots, non-text, size and local API failures are covered by service tests.

## Regression coverage

| Area | Verified behavior |
|---|---|
| Collection | Relevant same-origin discovery, page limits, progress, cancellation, retry, successful brand recovery, failed-attempt history, no execution of website scripts |
| Analysis credibility | Exact-source quotations; statement/inference/analyst distinctions; qualitative confidence; no traffic/share/demographics/scores; incidental biographies, generic “for” phrases and adjacent general copy do not invent scoped needs |
| Pricing | Revenue excluded; ambiguous currency remains qualitative; explicit candidate and zero work; manual confirmation ties amount/currency/unit/conditions to a selected quote; existing numeric price preserved |
| Human review | Edit/deselect/filter, source inspection, manual additions preserve prior edits and IDs, optional suggestion citations rejected when nonexistent, imported suggestions start deselected/low confidence |
| Integration | Profiles, audience scopes, evidence matrices, recorded-count positioning, opportunities, report citations and HTML export receive accepted findings |
| Update/history | New runs append; identical source content reused; original notes and prices retained; rejected proposals/logs saved; opportunity validation becomes stale rather than disappearing; deleted current sources do not erase run snapshots |
| Migration/data | Schema 1/2 accepted and schema 3 round-trips; old source methods/maps and generic notes retained; migration alone does not stale opportunities; CSV preserves accepted findings/sources/audiences; whole-save limits remain atomic |
| Demo restoration | Restore exits temporary demo, persists real saved workspace and survives reload; pre-restore backup contains original real workspace |
| Existing workflows | Manual CRUD/editor, project management, CSV preview, selected report scope, source drilldowns, corrupt/quota recovery, unsaved and cross-tab protection, opportunity decisions/history |
| Service boundaries | Exact loopback Host/Origin/token, no wildcard CORS, checked public DNS and redirects, robots handling, cancellation, response bounds, encoding support, no filesystem workspace API |

## Visual review

The existing blue/purple/green/orange palette, cards, sidebar, comparison controls, heatmap and report styling remain. The new research workspace uses the same tokens. Findings have readable edits, confidence explanations and expandable source quotations; numeric review is a disclosure; tabs wrap and forms stack on phones. No decorative statistics or unsupported chart series were introduced. Recorded feature/audience axes are explicitly research coverage, not quality or market share.

Reviewed screenshots include the initial viewport and scrolled research content, numeric-price disclosure, mobile manual import, collected pages, full history, live profiles, dashboard, audience navigation, opportunities, matrix, report settings and exported report. The 53-page PDF includes full traceability and source text; it is intentionally lengthy. Some appendix endings contain substantial whitespace due to page breaks. There is no detected clipping or overlapping text. Narrower exports can omit full evidence and reduce scope; pagination varies by browser/settings.

## Launch and package

Native `CompetitorLens.exe` → bundled Node → loopback app → New Project → Automated Research collection ready → authenticated clean shutdown passed in an isolated Edge context. Default-browser opening was suppressed so no saved user profile was touched. The packaged runtime's Windows signature was valid and identified the OpenJS Foundation. The native launcher itself is unsigned. `runtime/LICENSE.txt` includes the Node runtime and dependency notices.

Root and `dist` portable HTML files have identical SHA-256 hashes and contain all UI assets. ZIP verification checks every archived file against the source, archive integrity, exclusions and required files. A fresh extraction is used for the final launcher smoke check. Source, lockfile, tests, examples, README, launcher/service, runtime and notices are included; node_modules, test-results, live research and QA screenshots are excluded. The previous V1.3 ZIP remains intact.

## Reproduce

```powershell
npm.cmd run build
npm.cmd test
npm.cmd run test:e2e
node tests/launcher-smoke.mjs
node tests/live-research.mjs
```

The live script defaults to Plausible, Umami and Fathom. `CL_LIVE_URLS` can supply another newline-separated list. `CL_QA_DIR` writes screenshots outside the repository. `CL_LAUNCH_ROOT` lets the launcher smoke script verify a fresh package extraction. Native launcher build instructions are in `service/README.md`. Poppler `pdfinfo` / `pdftoppm` rendered the live PDF.

Evidence remains in the sibling `competitorlens-v14-review` folder: `v14-*.png` (new workflow/viewport checks), `v13-*.png` (preserved core journeys), `live-*.png`, `live-acceptance.json`, `live-backup.json`, `live-report.html`, `live-report.pdf`, `print-final-*.png` and `final-contact-*.png`. Live source text is test evidence, not bundled demo data.

## Remaining limitations

- Deterministic English-language rules can miss or misinterpret website content. Exact citations establish traceability, not independent verification. Human review remains required.
- Collection is static public HTML/text with documented bounds. Robots, blocking, timeouts, JavaScript-only pages and unsupported responses require manual input. A successful test does not guarantee future access to any website.
- Optional AI is evidence-brief export and structured JSON import, not a built-in model/API integration.
- Old file-based browser storage and the service origin are separate. Upgrade through full backup/restore; the same storage key alone cannot bridge origins.
- Accepted updates append information; users resolve outdated/conflicting claims. Browser quotas and history limits apply. Unsaved drafts are not crash-recoverable.
- Native package tested on Windows x64/Edge. Direct file-protocol persistence, Safari/Firefox, native mobile launch, other OS platforms, and opening the user's actual default browser profile were not automated.
- Reports with full source text can be long. Print pagination is browser-dependent. No old dates/evidence can be reconstructed when a previous version never saved them.

Optional for future development: installing the Browser plugin would provide in-app navigation, DOM snapshots, screenshots and console inspection.
