# CompetitorLens — Competitor Audience Intelligence

**Version 1.4.** Independent competitor intelligence for small businesses. Collect public website content, review evidence-linked profiles and audience hypotheses, compare two to five competitors, and generate reports. Your existing manual research, opportunity history, and colorful dashboard are preserved. The built-in analysis needs no API key.

## Launch without a terminal

**Windows 10/11, x64 — automated and manual research**

1. Extract the complete ZIP into a folder you want to keep. Do not run files from inside the ZIP.
2. Double-click **CompetitorLens.exe**. Keep `runtime`, `service`, and `CompetitorLens.html` together.
3. Your default browser opens `http://127.0.0.1:4184/`. Choose **New Project**, **Explore Demo**, or **Resume Recent Project**.
4. Open **Automated Research**. The **Local collection ready** badge means website collection is available.

**Success:** Welcome displays “A clearer view of your competition.” A first-time browser has Resume disabled. Creating a project saves an empty real workspace without copying demo data. No terminal, Node installation, account, or API key is needed; the package includes its own Node.js runtime and a native Windows launcher. `Start CompetitorLens.vbs` is a fallback launcher on systems with Windows Script Host enabled.

**Portable/manual mode:** double-click **CompetitorLens.html** in a current Edge or Chrome browser. The single file contains the entire UI, icons, and demo. Manual website-content analysis, editing, comparisons, imports, reports, and backups work without the local service. Automated collection requires the Windows launcher. The HTML can be used on other operating systems, but those environments were not tested.

The service runs only on loopback and stops after 30 minutes without research requests. Reopen the launcher if collection reports that it is unavailable. If port 4184 is occupied by another application, the launcher explains the failure in `launch-error.txt`; close the conflicting app and try again. Closing a tab does not immediately stop the service. All research remains in browser storage, not on the service's disk. Opening the app does not start a crawl.

**Back up before moving the app or clearing browser data.** Use the same browser and launch address. Private browsing, browser policies, and storage quotas can prevent persistence. If saving fails, **Download current backup** preserves the complete in-memory workspace. Browser and operating-system dialogs follow your system language; all app content is English.

## Upgrade safely from V1–V1.3

1. Open the old app and choose **Data Management → Download full backup**. Keep this original JSON file.
2. Extract V1.4 into its own folder and launch **CompetitorLens.exe**.
3. If your old app was opened as a file, its browser storage is separate from the new local-service address. Create an empty project, open **Data Management → Choose backup**, select the original JSON, and confirm **Replace workspace**. This is a deliberate transfer; the launcher cannot read another browser origin's storage.
4. Compare project names, notes, evidence, audience records, and opportunity decisions with your original backup. Reload and choose **Resume Recent Project** to verify persistence.

**Success:** original research remains intact, including source methods and opportunity history. Restoring from the temporary demo now exits demo mode and persistently replaces the real workspace. The restore dialog offers a backup of the existing real workspace first, even while exploring the demo.

V1.4 keeps storage key `competitorlens.v1`, reads schemas **1, 2, and 3**, and writes **schema 3**. Earlier V1–V1.2 backups used schema 1; V1.3 used schema 2. Reading alone does not rewrite saved JSON. The next explicit save persists the migration. Keep the original backup for older app versions, which do not understand the new schema.

Migration adds empty automated-research metadata without changing old notes or marking an otherwise current opportunity stale merely because of the upgrade. General notes stay competitor-wide. Existing audience records, retained labels, source mappings, and history remain. Legacy source methods/dates and missing historical evidence are never invented.

## Automated research: URLs to report

1. Create or open a project, then choose **Automated Research**.
2. Enter **two to five website URLs**, one per line. One website is also supported for a profile. Existing domains update their records; new domains must fit the five-competitor limit.
3. Select **Collect & analyze websites**. Watch the collection log. The app reads the starting page and up to five relevant same-origin links covering Pricing, Features, Products/Services, About, and audience pages. Missing categories remain unknown.
4. Review each competitor's **Profile & pricing**, **Audience insights**, and **Collected pages**. Edit text, deselect weak proposals, inspect exact quotations, and confirm the competitor name. Editing a proposal labels it an analyst interpretation.
5. If an explicit numeric offer was extracted, choose its **Use …** checkbox. Otherwise expand **Optional numeric starting price for charts**, select a pricing quotation, and confirm amount, currency, unit, and conditions. Ambiguous `$` symbols do not silently become USD. Existing numeric prices remain unchanged; use Edit competitor to replace them.
6. Confirm **I reviewed…**, then choose **Save & compare**. The matrix, audiences, profiles, charts, and opportunity hypotheses use the accepted research. Collection alone never saves changes.
7. Open **Reports**, choose scope and sections, then **Export HTML** or **Print / Save PDF**.
8. Return to **Automated Research → Research history** to inspect saved pages, accepted and rejected proposals, and collection errors. **Research these websites again** starts an update. Earlier runs and opportunity decisions remain available.

**Success:** each accepted finding has a classification, qualitative confidence explanation, exact quotation, source URL, and collection date. Needs and motivations belong to a specific competitor × audience. A navigation-only audience label never receives copied general needs. Reload retains accepted research and run history.

Updates append reviewed information and reuse identical current source content. They do not erase manually entered notes or automatically reconcile contradictory old/new claims. Review outdated claims in the competitor editor. Research drafts are in memory until saved; navigation and closing warn about unsaved work, but browser crashes cannot recover a draft.

### Inaccessible pages and optional AI

A failed page shows its reason in the collection log. **Retry this website** retries failed URLs while preserving reviewed findings. For blocked, login-only, JavaScript-only, unsupported, or otherwise inaccessible pages:

1. Choose **Import website content** at the start, or **Manual / optional AI** during review.
2. Enter the relevant page URL from that competitor's domain. Paste text or choose a saved `.txt` / `.html` file.
3. Select **Analyze pasted content**, inspect proposals, then save as usual.

**Success:** manual content stays labeled **User-supplied excerpt**, never fetched or verified. No API key is required for this structured analysis.

Optional AI is an **export/import workflow**, not a built-in model connection: download an evidence brief, optionally give it to an external tool of your choice, and paste its JSON proposals back. Nothing is uploaded by CompetitorLens. The brief specifies allowed fields and exact source quotations. Invalid citations are rejected; valid imported suggestions start deselected and labeled low-confidence inferences. Decide what information to share with that external tool yourself.

## Your first comparison

1. Choose **New Project**, enter a name and optional industry, then **Create project**.
2. Choose **Add competitor**. Enter a name or website and the information you actually know. Manual editing does not automatically collect a URL; use Automated Research for collection.
3. On **Profile & positioning**, record products, features, pricing notes, and optional numeric price. Numeric prices need a recognized currency and a meaningful unit, such as `month`, `seat per month`, or `250 g bag`. Zero is valid. Correct flagged conflicts or explain the difference explicitly.
4. On **Audience**, enter audience labels separated by `|`. Select a segment in **Research scope** and enter its needs, motivations, interests, and purchasing behavior. Choose **Competitor-wide notes** for general context.
5. On **Evidence**, paste a relevant excerpt or use **Fetch page**. Choose its audience scope and supported fields, then **Attach source**. An incomplete source must be attached or explicitly cleared; saving cannot silently discard its URL or field selections.
6. Select **Save competitor** and repeat for two to five competitors.
7. Compare audience cells, pricing groups, and feature evidence. Use the comparison chips to select competitors; the final selected chip cannot be removed.

**Success:** changing the selected audience changes its specific notes and evidence. General company notes remain in their own section. Sources mapped to one audience do not automatically support another audience.

Removing an audience label from the active list retains its research and source mappings. It remains available in the editor as retained research. Re-entering the same label reconnects that record. A different label creates a distinct segment; notes are not guessed or reassigned.

## What each page does

| Page | Working features |
|---|---|
| Overview | Onboarding for empty projects; four record metrics; positioning; audience bars; evidence heatmap; research coverage; activity; selected-scope report export |
| Automated Research | Bounded public collection; progress/cancel/retry; editable proposals; audience-scoped citations; manual/optional AI import; persistent research runs |
| Competitors | Search and sort; profile cards; dedicated details; pricing groups; positioning; three-step editor; add/edit/delete; source library |
| Audience Analysis | Segment navigation; competitor filter; distinct segment insights; mapped evidence; insight coverage; separate legacy/general notes |
| Competitive Matrix | Competitor scope; differences/features filters; evidence shading; sticky headings; horizontal scrolling; feature and audience evidence drilldowns |
| Opportunities | Rule explanation; separate record/source counts; unknowns; suggested validation; analyst status/notes; durable Current and History snapshots |
| Reports | Selected competitor subset; title/commentary; readable charts; provenance; optional evidence and project-wide history; HTML export; Print / Save PDF |
| Data Management | Atomic CSV preview/import; CSV export; full JSON backup; confirmed restore; project deletion; corruption recovery |

## Evidence, prices, and chart meanings

| Label | Meaning |
|---|---|
| User-supplied excerpt (URL provided) | Pasted text with a URL; not collected by the app |
| Fetched page text | Text returned by an explicit Fetch page action; still not independently verified |
| Manual research note | User-entered research without a source URL |
| Demo source | Fictional sample evidence |
| Legacy source · collection method unknown | Preserved older source whose acquisition method cannot be established |
| Linked / Source-linked | An explicit field or audience mapping, not independent verification |
| Recorded only | A recorded claim without evidence mapped to that scope |
| Not recorded | Unknown; not evidence that something is unavailable |
| Website statement | Wording extracted from a site; a claim by that site, not independent verification |
| Inferred insight | A rule-based or optional external interpretation requiring validation |
| Analyst-edited interpretation | Text edited during review; its quotation still needs to support the interpretation |

Editing fetched text or its URL changes the pending source to user-supplied/manual provenance. Collection dates describe saved collection records, not necessarily the publication date. Analyst-entered and imported claims are never automatically verified.

- **Audience bars** count competitor records mentioning each label, optionally restricted to evidence mapped to that exact segment. They are not audience size, overlap, demographics, or market share.
- **Positioning** defaults to recorded feature × audience counts when no qualitative assessments exist. Other modes use your optional 1–5 assessments or recorded source counts. Counts show research coverage, not market position, product quality, or market share. Unknown scores are excluded; automation does not invent them. Each competitor retains a unique series color.
- **Research coverage** counts six competitor-wide fields. **Insight coverage** counts four notes for the selected competitor × audience. Neither is a confidence score.
- **Pricing bars, cards, tables, and reports** use the same validated numeric amount. Notes are shown separately. Unresolved prices are excluded from charts. Groups require matching currency and unit labels; there is no currency, package, seat, tax, discount, or billing-period conversion.
- **Recent activity** uses existing edit/collection dates. It is not a complete audit trail or a market trend series.
- **Validation stages** count hypotheses by analyst-assigned status. “Validated” is your decision, not certification by the application.

Pricing-note checks recognize explicit monetary amounts, currency codes, € / £ symbols, and common billing/package units. Free-form language cannot be fully parsed. Ambiguous currency symbols and complex pricing conditions still need human review. Any conflict explanation is tied to the exact amount, currency, unit, and notes; changing them invalidates that review.

**Confidence is qualitative:** High means direct wording, Medium means contextual interpretation, and Low means an exploratory hypothesis. It is not a probability, verified truth, or measured audience size. Website mentions can be testimonials or incidental references; review them.

The application never estimates traffic, audience percentages, demographics, market share, revenue, customer counts, or hidden opportunity scores. There is no Semrush data connection or built-in AI API.

## Validate opportunities without losing history

1. Open **Opportunities** and inspect **Why proposed**, the research records, mapped sources, and limitations.
2. Choose **Start validation**, enter your findings, and select a status. Notes save as you type.
3. Edit the competitor research and save.
4. Open **History**. The earlier snapshot is marked **Stale / Needs review** and retains its status, notes, and supporting excerpts. Current hypotheses are generated separately.

**Success:** you can still find the earlier decision after a source changes or a competitor is deleted. Reloading or restoring a backup retains it. Whole-project deletion still intentionally removes that project's history after confirmation.

Rules are deterministic: subscription/commitment keywords in at least two records suggest investigating flexibility; missing audience mentions suggest a documentation gap; otherwise the app requests deeper research. These are not proof of customer frustration or underserved demand. Up to three current hypotheses appear; earlier snapshots remain in History. Any saved competitor research change conservatively makes prior current snapshots stale, even if that edit seems minor.

## Collection boundaries

The packaged local service avoids browser CORS restrictions for explicit public collection. It accepts HTTP/HTTPS hostnames on standard ports, checks public DNS addresses, pins each request to a checked address, rechecks redirects, honors `robots.txt`, limits response sizes, and identifies itself as CompetitorLens. It rejects private/local addresses, authentication credentials, disallowed pages, and excessive crawl delays. Website scripts are never executed. No cookies, login sessions, accounts, background crawling, or telemetry are used.

The service listens only on `127.0.0.1`; collection requires the app's origin and a per-launch token. The browser receives public text for local parsing. Websites necessarily see the collection request and your network address. Requests are bounded to readable HTML/text; no JavaScript rendering, PDF extraction, paywall/challenge bypass, or compressed-response handling is provided. Timeouts, blocking, site changes, and unsupported encodings can require manual import.

The older **Evidence → Fetch page** control remains available for an individual source. In direct-file mode it depends on browser CORS; use the automated workspace or manual paste when unavailable. Editing fetched text or its URL changes its provenance to user-supplied/manual.

## Import, backup, and restore

For CSV, use **Data Management → Download template**, retain the header, enter a name or URL, and separate features/audiences/source-field keys with `|`. Quote cells containing commas or newlines. **Choose CSV → review → Import records** adds valid records without replacing existing ones. A malformed import is rejected as a whole.

Supported columns:

```text
name,url,positioning,products,pricing,price_amount,currency,price_unit,features,audiences,needs,motivations,interests,behavior,notes,breadth,tier,source_title,source_url,source_excerpt,source_fields,demo,audience_research,sources_json,price_note_review,research_findings
```

V1.4 CSV includes complete sources, audience records, and accepted automated-finding metadata as JSON cells. Older flat source columns remain supported. The source-field keys are `positioning`, `products`, `pricing`, `features`, `audiences`, `needs`, `motivations`, `interests`, `behavior`, `scores`, and `notes`. Unsupported source keys are rejected. JSON source columns preserve methods, dates, and audience mappings. Set `demo` to `true` for fictional records; demo sources also preserve that classification. CSV does not include project settings, research-run snapshots, or opportunity history, so **JSON backup is the complete workspace transfer format**. Exported spreadsheet formulas receive a safety apostrophe, which can remain on reimport.

For complete backup, choose **Download full backup**. To restore, select **Choose backup**, review its counts, and confirm **Replace workspace**. This replaces all saved projects; the confirmation offers a backup of the current workspace first.

If stored data is corrupt, choose **Recover Workspace → Download recovery copy**. The original bytes remain protected until you explicitly restore a valid backup or choose **Start fresh → Start empty workspace**. If storage is unavailable/full, use **Download current backup** to keep current in-memory work, then restore it when browser storage is available again.

Limits: 20 projects; five competitors per project; 30 active audience labels/features; 100 active or retained audience records and 50 sources per competitor; CSV input under 2 MB; JSON restore input under 10 MB; up to 10,000 opportunity snapshots and 100 research runs per project; 1,000 accepted automated findings per competitor. Collection retains up to 20,000 characters per page, at most six automatically discovered pages per website (12 total with manual additions/retries), and 150 review proposals per competitor/run. Network responses and manual content files are limited to 2 MB. Limit errors reject a save/import atomically. Browser storage quota can be lower. Export backups regularly, especially during long research sessions. No records are silently trimmed to satisfy these limits.

## Demo isolation

**Explore Demo** opens four fictional coffee competitors, four recorded audience segments, and twelve sample sources. All are clearly marked Demo. Its edits, CSV imports, and research runs stay temporary and do not enter the saved real workspace. Explicit full-backup restoration is different: it leaves the demo and replaces persistent saved projects after confirmation. You can explicitly export a demo backup; it remains labeled fictional. **New Project**, including the demo's create-project action, exits the demo and creates a real empty saved project. **Back to welcome → Resume Recent Project** returns to saved research.

An intentionally restored/imported demo backup remains demo content in your saved workspace. The app does not delete previously saved demo projects during an upgrade.

## Export a report

1. In Overview or Competitive Matrix, choose the competitors, then **Export report / Export this comparison**. Reports preserves that selection; you can adjust it there.
2. Set the title/commentary, choose the optional sections, and select **Generate report**.
3. Select **Export HTML**, or **Print / Save PDF → Save as PDF** in your browser.

**Success:** comparison charts/profiles identify the selected subset. Opportunity decisions and History are explicitly project-wide and may include other or deleted competitors. Provenance, analyst status, caveats, and evidence are included unless you turn those sections off. Source references link current evidence; stale snapshots retain their own historical excerpts. Automated finding traceability is included. A full report can be long when many findings and source pages are retained; turn off Full evidence appendix or reduce competitor scope for a shorter export.

Report title/commentary are temporary drafts. Export them before leaving Reports. Browser print settings affect page breaks and colors; enable background graphics for colored charts. Wide mobile tables scroll within the report.

## Development and verification

React 19, Vite 6, Lucide icons, plain CSS, and pure domain helpers power the UI. The Node service uses built-in modules only. `automatedResearch.js` owns extraction/analysis/application; `researchData.js` validates metadata; `model.js`, `history.js`, `pricing.js`, and `provenance.js` preserve data rules. `service/collector.mjs` owns bounded requests; `server.mjs` owns the loopback API. The optional external-AI workflow adds no SDK or account integration.

For developers with Node.js 20+ and Microsoft Edge installed:

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd test
npm.cmd run test:e2e
node tests/launcher-smoke.mjs
# Optional: public, read-only live acceptance against three real websites
node tests/live-research.mjs
```

`npm ci` downloads development dependencies. The build inlines all UI assets into identical `dist/index.html` and `CompetitorLens.html` files. `node scripts/examples.mjs` regenerates examples/notices without replacing the historical schema-1 demo backup. Native launcher source is `service/Launcher.cs`; its build instructions are in `service/README.md`. `npm.cmd run dev` serves source editing; manual import works there, while production collection uses the packaged service.

Browser tests use isolated Edge contexts against the built HTML on loopback, never a saved user profile. Set `CL_QA_DIR` to put screenshots in an external folder. Tests include synthetic fixtures and a separately opt-in live run against Plausible, Umami, and Fathom. Developers can set `CL_LIVE_URLS` to a newline-separated list of other public websites. The launcher smoke test refuses to disturb an occupied production port and suppresses automatic default-browser opening.

**Verification:** production build, 48 unit tests, 45 browser tests, native launcher smoke test, and a live three-competitor journey. See [verification record](docs/QA.md) and [release notes](RELEASE_NOTES.md) for results, inspected evidence, and limits. Responsive checks cover 1440, 768, 390, and 320 pixels. Earlier V1.3 verification is preserved in [QA-V1.3.md](docs/QA-V1.3.md).

The full package includes the signed OpenJS Node.js 24.16.0 Windows x64 runtime and its license; the independently compiled CompetitorLens launcher is not code-signed. Core manual workflows stay self-contained in the portable HTML. Direct file-protocol persistence, native mobile launch, Safari/Firefox, and other operating systems were not automated. Live websites may change or block future collection. Legacy dates/evidence cannot be reconstructed when older versions never saved them.

The design remains independently inspired by [Semrush Traffic & Market](https://www.semrush.com/kb/1121-semrush-traffic-and-market). CompetitorLens has no affiliation, branding reuse, account integration, or data connection with Semrush or another project.
