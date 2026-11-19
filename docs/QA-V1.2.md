# CompetitorLens V1.2 verification record

Verified November 12, 2026. Production build succeeded. **21 unit tests and all 25 browser workflow tests passed.** After the final report-only pagination/background refinements, the 21 unit tests and three affected report/visual workflows passed again. A final mobile segment-width correction was rechecked with the two audience workflows and both full-page responsive audits. The earlier verification record is preserved in `QA-V1.1.md`.

## Environment

- Windows, Node.js 24.16.0, Playwright, isolated headless Microsoft Edge 157.0.4341.46.
- Target: the actual standalone `CompetitorLens.html`, served at `http://127.0.0.1:4173` by the included loopback-only server.
- Viewports: desktop 1536 × 1024; mobile 390 × 844; additional welcome concept comparison at its native 1448 × 1086.
- **Browser plugin not available.** Regular Playwright was the supported fallback. A prior in-app attempt had blocked file URLs and could not load the loopback preview. That limitation was not bypassed.
- Tests use fresh browser contexts and synthetic fixtures. User browser profiles and research were not accessed.
- Direct double-click/file-protocol automation was not performed. Static checks confirm the portable file has no external script/style dependency or module script, and executes after the root element exists.

## Rendered checks

| Check | Result |
| --- | --- |
| Page identity | Expected CompetitorLens title and welcome/dashboard headings |
| Nonblank content | Welcome, every core page, competitor detail, and all editor steps render |
| Error overlay/boundary | None observed |
| Console health | No application console errors or uncaught errors during page audits |
| Background requests | No automatic external requests during desktop/mobile page audits |
| Responsive layout | No document-level horizontal overflow at either primary viewport |
| Visual evidence | Playwright captures inspected with the image viewer; concepts compared at native sizes |
| Working controls | Entry buttons, chart filters, comparison cells, editor, imports, exports, recovery, and navigation exercised |

The reviewed pages include Welcome, Overview, Competitors (profiles and pricing), Audience Analysis, Competitive Matrix, Opportunities, Reports, Data Management, competitor details, and Profile / Audience / Evidence editing steps. Tables intentionally scroll inside their panels. Mobile navigation and dialog sizing are tested. Screenshots and print-review files remain outside the source tree in the sibling `competitorlens-v12-review` folder.

## New V1.2 interaction loops

1. Welcome → New Project → create → reload → Continue Workspace: the new project is active and existing research remains identical.
2. Welcome → Explore Demo → edit a competitor → export full backup → Back to welcome → Continue Workspace: the demo export contains its edits while the saved local-storage bytes remain unchanged.
3. Overview → All mentions / Source-linked: removing one mapped audience source changes the linked count without changing recorded mentions.
4. Audience bar → keyboard/programmatic focus tooltip → selected audience analysis.
5. Research coverage legend → contributing competitor fields; activity filter → stored profile dates only.
6. Competitors → Pricing & positioning → pricing bar → pricing-specific source view; positioning axis toggle retains all assessed competitors.
7. Competitive Matrix → Evidence shading toggle; Opportunities → validation-pipeline filter → matching empty/results state.
8. Reports → chart preview → HTML export: audience counts, 0–4 scale, coverage denominator, and caveats appear in the downloaded document.
9. Welcome and pricing analytics at desktop/mobile sizes → no overflow, runtime errors, or background requests.

## Existing features preserved

- Add, edit, save, reload, and delete competitors; attach evidence and preserve field mappings.
- Move between editor steps without losing drafts; protect unsaved work when navigating.
- Search/sort competitors; open dedicated details and field-filtered evidence.
- Select/search audience segments, filter competitors, and inspect structured notes and sources.
- Filter the competitive matrix; verify sticky headers; inspect linked evidence; reset an undersized comparison.
- Start opportunity validation; persist notes and statuses through reloads.
- Preview and import CSV; reject invalid/duplicate/oversized input atomically; export safe CSV.
- Export customized HTML reports, print to PDF, export/restore complete JSON, and preserve demo markings.
- Preserve normalized V1 fixtures exactly through new views and JSON exports. A single-field edit preserves unrelated fields, custom currencies, sources, and opportunity notes.
- Keep unreadable storage untouched until explicit recovery; allow complete export when storage is unavailable.
- Protect dirty drafts during cross-tab updates.
- Review locally intercepted public-page extraction; strip scripts; retain manual fallback for blocked websites.

## Domain and credibility tests

Audience charts count records once and distinguish linked/unlinked mentions. Pricing groups separate currencies and billing units, retain explicit zero values, exclude missing amounts, and never mutate records. Activity excludes undated entries and sorts recorded dates. Empty and hostile report labels remain safe, without NaN/Infinity or executable markup. Existing CSV parsing, formula neutralization, URL validation, backup validation, source mappings, and opportunity-limit tests remain passing.

The storage key and backup schema are unchanged. No audience migration was needed. Source-linked remains distinct from independently verified; missing information remains unknown. Demo data is fictional and visibly labeled.

## Print and export inspection

The seven-page A4 demo report was rendered and inspected: title and credibility notice, audience and coverage charts, comparison table with repeated headers, structured audience notes, hypotheses, methodology, and complete evidence appendix. The final print adjustment keeps normal source entries together and removes the tinted trailing page area. Long excerpts can still continue naturally across pages. The same blue/purple brand mark appears in reports.

Both live-preview and downloaded-HTML chart markup are checked. The included sample report was regenerated from the existing sample JSON without replacing that dataset.

## Issues found and fixed

- Legacy 50% widths left mobile segment buttons at half of their grid cells. Full-width buttons now fill the two-column navigation cleanly.
- A centered main flex child expanded to the matrix's intrinsic width on mobile. Explicit full-width containment fixes the document overflow while preserving table scrolling.
- Pipeline cards and status tabs shared accessible names. Pipeline cards now have distinct action labels and pressed state.
- Bar tooltips relied only on focus-visible. They now respond to actual focus and stay inside the chart's scroll region.
- The welcome preview initially cropped most heatmap rows. Its aspect ratio now accommodates the complete real comparison.
- Final print pages inherited the canvas background; print surfaces now explicitly remain white.
- Evidence-source blocks could split their heading and excerpt; ordinary blocks now remain together.

## Commands and limitations

`npm run build`, `npm test`, `npm run test:e2e`, and an affected-workflow rerun after report refinements. Native viewport images were captured with a small isolated Playwright script outside the repository. `pdfinfo` and `pdftoppm` were used for the seven-page print review.

Safari, Firefox, native mobile file launch, and direct file-protocol persistence were not verified. Arbitrary public websites may reject browser requests; the success test uses an intercepted fixture. Browser/file-location storage differences are explained in the README, with a backup-first upgrade procedure. No third-party account, deployment, remote repository, AgentGit session, or other project was connected.
