# CompetitorLens V1.5 verification record

Date: November 12, 2026. Scope: the existing independent V1.4 application upgraded in place; no other project, session, account, or saved browser profile was connected.

## Environment and method

- Windows x64, Microsoft Edge via Playwright, Node 24.16.0 bundled runtime, production inline HTML.
- Local app tests: `http://127.0.0.1:4173/` and isolated ephemeral local-service ports. Native launcher: `http://127.0.0.1:4184/`. Portable smoke: actual `file://` URL.
- Browser plugin not available; the frontend-testing-debugging skill's Playwright fallback used the repository's existing runner. No browser dependencies were added.
- Viewports: 1536/1440 desktop, 768 tablet, 390 and 320 mobile widths. Both languages tested on all nine main pages at 1440, 390, and 320. Existing editor/research workflows also cover 768.
- Fresh browser contexts and temporary credential directories only. No real user projects, browser storage, credentials, or accounts were inspected.
- Screenshots, downloads, and Playwright output are outside the source tree in sibling `competitorlens-v15-review`.

Flow tested: configure provider → create project → collect three websites → review findings/evidence → accept opportunities → save/compare → bilingual reports → research updates → validation history → backup/restore/reload.

## Results

| Check | Result | Evidence |
|---|---|---|
| Production build | PASS | Inline JS/CSS, no external app assets; bundle runs after root |
| Unit regressions | PASS — 64/64 | AI schema/transport/vault, storage, migration, updates, reports, collector |
| Full browser regressions | PASS — 53/53 | Existing V1.2–V1.4 workflows plus eight V1.5 scenarios |
| Final V1.5 browser rerun | PASS — 8/8 | Final localization/network-message changes rechecked |
| Real public website journey | PASS | Three competitors, 14 retained pages, 95 reviewed proposals, no failed attempts in successful run |
| Standalone file launch | PASS | Actual file:// open, create/edit/save/reload, persistent Chinese UI, zero external requests |
| Rebuilt archive/native launcher | PASS | Fresh ZIP extraction, every file hash, bundled runtime, isolated AI vault, native and portable launch |
| Page identity / nonblank | PASS | Correct Welcome, project pages, headings and navigation |
| Framework errors / console | PASS | No relevant browser runtime errors in tested flows; only test-runner color-environment warnings |
| Interaction proof | PASS | UI controls change real state, exported/downloaded data and persisted records |
| Responsive visual inspection | PASS | Dashboard, AI settings/review/update, reports; no page-width overflow |
| Source/report integrity | PASS | Exact quotations, valid report evidence anchors, unchanged original-language excerpts |

## Functional coverage

**AI provider setup.** Actual HTTP requests against a synthetic OpenAI-compatible local provider verify settings, model listing, a structured connection test, independent output language, analysis, and reported token usage. Authentication errors, 429/5xx retries, malformed JSON, invalid source IDs/quotes, unsupported numbers, truncated output, cancellation and timeout are tested. Invalid results leave prior drafts and storage unchanged.

**Credentials.** A real Windows DPAPI helper encrypts/decrypts fake test keys in temporary directories. Plaintext is absent from the settings file. Endpoint changes clear credentials; tampered endpoint bindings cannot forward an old key. Session-only mode and removal are covered. Status endpoints never return keys, and project backups/reports exclude them. Exact origin/token enforcement and stale-token health detection are tested.

**AI review journey.** Three synthetic sites (two English and one Chinese) exercise structured findings, audience-scoped needs, manual editing, opportunity acceptance, comparison, reports in both languages, and a second revision. Modified/conflicting findings block saving until the analyst chooses append/replace/skip. Replacement retains the previous record. Validated notes remain in stale history. Backup/restore/reload is deeply compared for equality.

**Storage.** Throwing quota errors, fully blocked storage, and silent discarded writes do not show success or close the review/editor. Complete pending-workspace backups are downloadable. Retrying after storage recovers succeeds. Corrupt original bytes remain until an explicit recovery decision. Cross-tab changes protect dirty drafts. Capacity notices are derived from serialized payload size.

**Migration/history.** Schemas 1–3 migrate to schema 4 without dropping old fields, audience mappings, original quotes, source methods, research metadata, or validated notes. Reading legacy data alone does not rewrite storage. CSV/JSON round trips and demo-mode backup restoration remain covered.

**Localization.** English/Chinese switching is immediate and persists, including during an unsaved editor draft. Stored status enums remain stable English identifiers. UI/AI/report language settings are independent. Source and analyst text remain unchanged. All main pages are exercised in both languages at desktop/mobile widths.

**Research service.** Health polls/focus/manual checks handle offline/recovery and stale launch credentials. A failed-page retry requests only that page, preserving failure history. Public-network/robots/DNS/redirect/size/time constraints, Chinese charset decoding, manual import, and CSV workflows remain covered. Network/TLS errors now explain retry/manual options.

## Live website acceptance

Successful real network run completed at 2026-11-12T16:19:27Z. Analysis was rule-based; no model provider was called.

| Competitor | Pages | Findings | Recorded audience labels | Audience records with scoped needs/motivations |
|---|---:|---:|---:|---:|
| Plausible Analytics — plausible.io | 4 | 39 | 8 | 4 |
| Simple Analytics — simpleanalytics.com | 5 | 29 | 4 | 3 |
| Fathom Analytics — usefathom.com | 5 | 27 | 5 | 1 |
| Total | 14 | 95 | Counts are research labels, not people | 8 |

Every accepted finding was checked against an exact substring in its retained source. All three competitors had collected pages, audience proposals, and findings. Comparison, Overview, profiles, audiences, opportunities, HTML/PDF reports, JSON backup, restore and reload passed. Responsive checks at 1440/768/390/320 passed. Source URLs and exact counts are retained in `live-acceptance.json`; the successful run recorded zero collection failures and no browser runtime errors.

An earlier attempt using Umami failed twice during TLS connection. Additional reachability checks encountered a robots crawl-delay restriction for Matomo and a TLS failure for GoatCounter. These failures were not bypassed or represented as extracted data. Simple Analytics supplied the third successful competitor. Website accessibility can change; the app cannot guarantee future extraction.

## Visual and export evidence

Inspected screenshots retain the existing light background, blue/purple/green/orange analytics colors, readable cards, explicit source/coverage labels, and responsive forms. New AI settings follow the same visual system; review uses source-linked cards and before/after decisions without a redesign of the existing dashboard.

Evidence files include:
- `v15-en-US-ai-settings-1440.png`, `v15-zh-CN-ai-settings-390.png`
- `v15-ai-review-desktop.png`, `v15-update-review-desktop.png`, `v15-update-review-mobile-zh.png`
- `live-overview-desktop.png`, `live-matrix-desktop.png`, `live-reports-390.png`
- `v15-report-en.html`, `v15-report-zh.html` (synthetic AI fixture research, not real model output)
- `live-report.html`, `live-report.pdf`, `live-backup.json`, `live-acceptance.json` (real public collection)
- `portable-file-mode-zh.png`

The real-site concise PDF has 23 pages because this acceptance project retains many findings and six hypotheses. The historical/manual detailed journey PDF has 11 pages. Rendered first/last pages were inspected for readable typography and evidence/methodology labels. Detailed HTML retains expandable source snapshots; print identifies full snapshots as available in HTML/JSON. Concise means fewer findings/history details, not a fixed page count.

## Reproduction

```powershell
npm.cmd run build
npm.cmd test
npm.cmd run test:e2e
npx.cmd playwright test tests/v15.spec.mjs
node tests/portable-smoke.mjs
node tests/launcher-smoke.mjs
node tests/live-research.mjs
python scripts/release.py
```

Set `CL_QA_DIR` to an external evidence directory. Set `CL_LAUNCH_ROOT` to a freshly extracted package for launcher/portable tests. The release contains 114 files and is approximately 39.5 MiB. Every packaged file matched its SHA-256 manifest, and the standalone HTML matched the production build byte-for-byte. No node_modules, test output, local credential files, or temporary translation scripts are packaged.

The native smoke suppresses automatic default-browser launch, uses an isolated vault, and refuses to stop another process already occupying port 4184. It starts the packaged EXE/runtime/service and shuts down only that test service.

## Limits and unverified conditions

- No commercial AI key was supplied. Actual HTTP integration is verified with a local mock, not real commercial inference, quality, quotas, or billing. User review remains essential; exact quotes do not establish semantic correctness.
- AI input is bounded to 6,000 characters/page and 120,000/request; omitted content is disclosed. Provider model/parameter support varies.
- Collection does not execute website JavaScript, bypass logins/challenges/robots, decode compressed responses, or extract PDFs. Inaccessible content requires manual import.
- Drafts are not crash recovery: unsaved collection/review state lives in memory. Failed-save recovery backups preserve the candidate workspace. Browser quotas and policies vary.
- Update detection is text-based. New feature/audience labels are additive, missing labels are unknown, and numeric price changes remain explicitly edited.
- Report locale translates labels/methodology; original research, AI prose, and quotations remain in their original language.
- Native Windows x64/Edge tested. Mobile viewports are emulated, not native mobile launch. macOS/Linux, Safari/Firefox, and real-user browser policies are untested.
- The custom EXE/helper are unsigned. No remote deployment, external account integration, or cloud sync is included.

Historical verification is preserved in [QA-V1.4.md](QA-V1.4.md) and earlier QA documents.

