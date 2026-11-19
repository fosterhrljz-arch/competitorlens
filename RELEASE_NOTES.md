# CompetitorLens V1.5 — AI Intelligence Upgrade

Released November 12, 2026. The existing standalone application and colorful design are preserved.

- Added actual OpenAI-compatible Chat Completions analysis, configurable providers/models, model listing, connection test, JSON compatibility controls, timeout/cancel/retry, and provider-reported usage. AI remains optional.
- Added a dedicated settings workspace and Windows DPAPI credential helper. Credentials never enter project storage, reports, exports, or backups; provider changes clear the old credential.
- Added English / Simplified Chinese UI with instant persistent switching, independent AI output language, and bilingual report labels. Original research and evidence remain unchanged.
- Added strict response validation, exact source citations, classification/confidence, editable review, and explicit acceptance of evidence-linked opportunity hypotheses. Invalid responses preserve collected research drafts.
- Fixed false save success: a matching write/read-back is required. Failed-save recovery remains accessible in editor, new-project, import, restore, and recovery dialogs; silent discarded writes and quota errors are tested.
- Added before/after research updates with append/replace/skip decisions and prior-record snapshots. Existing opportunity validation notes and evidence remain in history. Demo-mode restoration remains persistent.
- Expanded audience-specific rule analysis for English/Chinese and evidence-based opportunities. No traffic, audience shares, demographics, or market statistics are generated.
- Reports now provide six sections and concise/detailed modes, preserving traceable evidence and historical decisions. Full JSON backups remain the complete transfer format.
- Added live service health (including stale launch tokens), individual failed-page retry, actionable network/TLS errors, and the existing manual/CSV fallbacks.

Storage key remains `competitorlens.v1`; schema 4 reads older schemas 1–3 without dropping research. Back up before upgrading; file:// and localhost browser storage are separate. The native launcher and credential helper were rebuilt; the complete Windows package includes its runtime. See [README](README.md), [QA](docs/QA.md), and `SHA256SUMS.txt`.

Verification: 64 unit tests, 53 browser workflows, final AI/bilingual regression rerun, real three-site acceptance, standalone file launch, and packaged native-launch smoke. Exact evidence and limitations are recorded in QA. API tests use a local mock provider with fake credentials; no real commercial model or billing was tested. Website extraction can still fail because of robots, TLS/network policies, blocking, or script-only content; manual import remains necessary in those cases. Confidence is qualitative and all AI interpretations require human review.

---

# CompetitorLens V1.4 (historical)

November 12, 2026. Automated public competitor research, built on the existing independent V1.3 codebase. The colorful dashboard, manual editing, imports/exports, local storage, and opportunity history are preserved.

## Delivered

- **Automated Research:** collect one to five public competitor websites; discover relevant Home, Pricing, Features, Products/Services, About, and audience pages; show progress, individual errors, cancel, retry, and reviewed results.
- **Evidence-led analysis without a key:** products, pricing wording, positioning, features, potential audiences, scoped needs, motivations, use cases, and purchasing considerations. Direct statements, inferences, and analyst edits retain exact quotations, source URL/date, and qualitative confidence explanations. Biographies, navigation-only labels, generic adjacent prose, revenue, and ambiguous currency are handled conservatively.
- **Review before save:** edit names/text, filter classifications, select/deselect proposals, inspect full retained pages, and explicitly confirm numeric-price conditions. Existing numeric prices and manual notes are preserved. Saving is atomic; exceeding limits leaves the original project intact.
- **Integrated comparison:** accepted records feed the existing profiles, audience heatmap, matrix, price groups, opportunity hypotheses, and reports. A feature × audience plot uses recorded counts when qualitative scores are absent.
- **Durable research:** repeated collections append history, keep rejected proposals and failure logs, and retain old sources and opportunity decisions. CSV includes accepted-finding metadata; full JSON includes complete project and research history.
- **Fallback and optional AI:** paste/import inaccessible website text or HTML. The no-key rules remain useful offline. An optional evidence-brief/JSON-suggestion exchange supports external AI tools without automatically uploading anything or requiring an integrated model/API account.
- **Double-click Windows package:** native launcher, bundled signed Node.js runtime, and a bounded loopback research service. The portable HTML remains self-contained for manual/offline use.
- **Demo restore fixed:** confirmed backup restoration exits the temporary demo, writes the real saved workspace, and persists after reload. The pre-restore backup action exports the previous real workspace rather than temporary demo data.

## Compatibility and upgrade

Storage key `competitorlens.v1` is unchanged. Schema 3 reads schemas 1 and 2, preserving old notes, sources, audience mappings, and opportunity decisions. Reading alone does not rewrite storage. Keep a backup before upgrading.

Old file-based storage is a different browser origin from `http://127.0.0.1:4184/`. Export a full JSON backup from the old app and restore it in the launched V1.4 workspace. The launcher does not claim to migrate another origin's browser storage automatically. See the README for exact steps.

## Verification

Production build, **48 unit tests and 45 browser tests**, isolated native-launcher smoke test, and a complete real-site acceptance journey. Responsive workflows cover 1440, 768, 390, and 320 pixel widths. Source quotations, failed extraction/manual recovery, optional suggestion validation, existing-data preservation, price review, CSV/JSON round trips, demo restore, and update history are covered. The dated live results and report/visual evidence are recorded in [docs/QA.md](docs/QA.md).

## Remaining limits

- Website claims are not independent verification. English-language rules can miss or misinterpret content; review proposals. Confidence is qualitative, not statistical.
- Static public HTML/text only. Some robots rules, blocking, JavaScript-only pages, compression, authentication, oversized pages, or timeouts require manual content import. No access restrictions are bypassed.
- Optional AI is a manual evidence exchange, not an in-app API integration. No AI service is configured or contacted.
- Existing numeric prices are not automatically replaced; ambiguous symbols and plan conditions require analyst confirmation. No currency/unit conversions occur.
- Growing source/history collections face documented limits and browser quotas. Drafts survive ordinary review navigation but not browser crashes. Export full backups regularly.
- The native package is Windows x64. Edge/Windows on loopback was tested; direct file-protocol persistence, Safari/Firefox, native mobile launch, and other operating systems were not automated. Default-browser opening was suppressed during launcher QA to avoid touching a saved user profile.
- Full evidence reports can be long; pagination depends on browser print settings. The standalone HTML provides manual analysis, while automated collection requires the packaged service.
