# CompetitorLens V1.5 — Session Documentation

## Project overview

CompetitorLens is an independent, local competitor audience intelligence application for small businesses. This session developed the standalone product through V1.5, preserving its colorful, Semrush-inspired dashboard, existing research, imports, exports, and history. It has no Semrush account or data integration and does not connect to other projects.

The application uses React, Vite, plain CSS, and a Node.js local service. The Windows package includes its runtime; the self-contained HTML also supports offline manual work.

## Core features

- Research one to five public competitor websites, including relevant home, product, pricing, feature, and about pages; inspect progress, retry failed pages, or import text manually.
- Review editable competitor profiles and audience-specific needs, motivations, use cases, and purchasing considerations with exact source quotations and qualitative confidence.
- Compare competitors using audience charts, evidence heatmaps, feature tables, and compatible recorded pricing.
- Review evidence-supported opportunity hypotheses; preserve validation notes and previous research when inputs change.
- Inspect before/after research changes and explicitly append, replace, or skip conflicting findings.
- Export concise or detailed reports with six sections, HTML output, and browser Print / Save PDF.
- Import/export CSV, back up/restore full JSON, and preserve older schemas through migration. Saves require a matching storage read-back; failed saves retain drafts and offer a recovery backup.

Charts describe recorded research, not invented traffic, demographics, audience percentages, or market share. Demo records remain clearly labeled fictional.

## AI API configuration

1. Launch the Windows application and open **AI Settings**.
2. Enter an OpenAI-compatible API Base URL, API key, and exact model name; optionally load the provider's model list.
3. Choose the AI output language. Adjust temperature, token parameter/limit, JSON format, timeout, and retry count as supported by the provider.
4. Click **Test connection** and verify the success message. Connection testing and analysis may incur provider charges.
5. Select AI-assisted analysis in **Automated Research**, explicitly allow transmission of selected source text, then review findings before saving.

Keys are held by the local service, with Windows DPAPI encryption when remembered; they are excluded from browser project storage, reports, logs, and backups. Changing the endpoint clears the previous credential. Rule-based analysis remains useful without an API key. Responses are schema-validated and require exact submitted citations; malformed or unsupported output is rejected without discarding collected pages.

## Bilingual support

The global switch supports **English (en-US)** and **Simplified Chinese (zh-CN)**, changes immediately, and persists without rewriting research. AI output language and report language are independent. Original source excerpts and user-authored research retain their wording. This documentation/upload task leaves the language-switching functionality unchanged; future assistant explanations use English unless requested otherwise.

## Usage and upgrade

1. Back up an existing workspace using **Data Management → Download full backup** before upgrading.
2. Extract the complete Windows ZIP, then double-click **CompetitorLens.exe**. Success: the browser opens the Welcome page at `http://127.0.0.1:4184/`.
3. Create a project, enter competitor URLs, collect information, and review evidence and hypotheses.
4. Confirm the review and select **Save & compare**. Explore audiences, the matrix, and opportunities; export a report in the chosen language.
5. Download a full JSON backup and verify saved research after reloading.

Double-clicking **CompetitorLens.html** provides portable manual mode. Automatic collection and AI API access require the local service. File-based and localhost browser storage are separate; use backup/restore to transfer data. On save failure, keep the editor open, download the unsaved backup, restore storage availability, and retry.

## Verified testing results

Testing used isolated Microsoft Edge profiles and temporary credential directories, without reading existing user projects or real API credentials.

| Verification | Result |
|---|---|
| Unit regressions | 64/64 passed |
| Complete browser workflows | 53/53 passed |
| Final AI/bilingual regression rerun | 8/8 passed; included in the workflow suite above |
| Real public collection | Plausible, Simple Analytics, and Fathom: 14 pages and 95 review proposals |
| Complete real-site journey | Comparison, reports, save, backup, restore, and reload passed |
| Desktop/mobile rendering | Major pages checked at desktop, tablet, and 390/320-pixel widths; bilingual checks passed |
| Distribution | File hashes, rebuilt Windows launcher, local service, and actual standalone file launch passed |

AI integration tests exercised real HTTP transport against a synthetic local provider, including configuration, model listing, bilingual findings, invalid credentials, malformed responses, unsupported citations, retries, timeout, cancellation, and usage. Real website acceptance used rule-based analysis. Migration, storage failures, demo restoration, opportunity history, and source traceability were covered. See `docs/QA.md` for details.

## Known limitations

- No real paid AI key was supplied. Commercial model quality, provider-specific compatibility, quotas, and billing remain untested.
- Exact citations establish traceability, not semantic correctness or proven customer demand; analyst review is required.
- Website blocking, robots restrictions, TLS/network failures, script-only content, and unsupported formats can require manual import.
- AI input is limited to 6,000 characters per page and 120,000 per request; omitted content is disclosed.
- Unsaved collection/review drafts are not crash-recoverable. Browser storage quotas and policies vary; maintain JSON backups.
- Update detection is text-based. Missing features/audiences are unknown, not automatic removals. Numeric pricing requires explicit review.
- Report localization translates application labels and methodology, preserving original research and quotations.
- Windows x64 and Edge were tested. Native mobile launch, other operating systems, Safari, and Firefox were not verified. Custom launcher/helper executables are unsigned.

## Latest progress summary, rewritten in English

The rebuilt archive passed per-file verification. Its extracted Windows launcher, local service, and credential interface worked, and the standalone HTML passed offline editing, saving, and reload tests. Final verification comprised 64 unit tests, 53 browser regressions, and eight final AI/bilingual checks, all passing.

## Latest delivery explanation, rewritten in English

CompetitorLens V1.5 is complete with optional AI integration, immediate English/Chinese switching, evidence validation, reviewed research updates, verified persistence, and bilingual report exports. The complete Windows package and standalone HTML were rebuilt and tested. Three real competitors produced 14 collected pages and 95 review proposals; report generation, restoration, and reload succeeded. Commercial AI behavior and billing remain unverified because no real API key was provided, and inaccessible websites may still require manual import.

## Publication scope

Publish only this conversation and this Markdown document using AgentGit's manual commit and push workflow. Do not enable automatic uploads, import other sessions, or upload unrelated project folders. This documentation-only follow-up does not modify application source code, existing distributions, or Chinese/English functionality. Earlier conversation messages remain historical records; the English restatements above do not rewrite that history.
