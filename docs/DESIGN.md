# CompetitorLens V1.2 design and implementation

**V1.3 compatibility note:** This historical design direction is retained. V1.3 adds readable type and mobile controls, a native phone welcome preview, empty-project onboarding, audience-specific research scopes, evidence provenance, and durable opportunity History. These are targeted usability/data corrections; the palette, navigation, and dashboard composition remain. See `QA.md` for current verification.

V1.2 replaces the V1.1 monochrome presentation with a colorful, evidence-led analytics workspace. It retains the existing application, research model, data controls, and independent local operation. The earlier design record is preserved in `DESIGN-V1.1.md`.

## Reference study

The primary reference was the official [Semrush Traffic & Market Toolkit guide](https://www.semrush.com/kb/1121-semrush-traffic-and-market), with the [Traffic Analytics](https://www.semrush.com/kb/1506-traffic-and-market-traffic-overview) and [Market Overview](https://www.semrush.com/kb/1512-traffic-and-market-market-overview) dashboard images inspected before implementation.

The useful patterns were persistent research navigation, domain comparison chips, compact summary cards, paired chart panels, visible axes, contextual filters, and table drilldowns. CompetitorLens uses its own brand and native charts. No Semrush data, branding, authentication, or integration was added.

## Selected concepts

- `v12-dashboard-concept.png`: generated dashboard direction, native size 1536 × 1024.
- `v12-welcome-concept.png`: generated welcome-page direction, native size 1448 × 1086.

These are design references, not application assets or screenshots of measured research. The implemented welcome preview renders the actual Overview and chart components using the existing fictional project. It is inert and has one accessible description; the three real entry buttons remain keyboard reachable.

## Design system

| Element | Treatment |
| --- | --- |
| Main action and navigation | Blue `#2563eb`, pale blue selection |
| Audience research and hypotheses | Purple `#8055d9` |
| Linked evidence | Green `#12a77b`, accompanied by a text label |
| Demo, recorded-only evidence, validation | Orange `#ed8a32`, with explicit semantics |
| Unknown information | Neutral gray, never interpreted as absence |
| Canvas and panels | Light gray-blue background, white surfaces, fine borders, 6–8 px corners |
| Typography | Local system sans-serif; no network font dependency |
| Rhythm | 220 px desktop sidebar, 14–16 px panel gaps, clear page/title/filter hierarchy |
| Interaction | Native buttons/selects, focus indicators, hover/focus chart details, a short entrance transition respecting reduced motion |

Competitor colors stay consistent across scope chips, profiles, charts, and column headers. Labels always supplement color. Chart geometry is derived from records; no confidence or market-potential score is invented.

## Information architecture and behavior

The welcome page separates three intentions: start real research, explore a temporary demo, and resume saved work. Temporary demo changes never commit to `localStorage`; returning to the welcome page and choosing Continue Workspace restores the saved project state. New Project on the welcome page adds a persistent project without replacing existing projects.

Overview places scope controls and four metrics before positioning and audience charts. A full-width Audience × Competitor heatmap connects cells to supporting evidence. The final row contains pending hypotheses, a six-field coverage donut, and activity derived from existing timestamps. Hypotheses remain project-wide; the other overview projections follow the selected comparison scope.

Competitors has Profiles and Pricing & positioning views. Audience Analysis retains segment navigation and four structured note panels, with mention and insight-coverage charts. Competitive Matrix adds evidence shading to the existing sticky table and filters. Opportunities adds a clickable validation pipeline while retaining transparent hypothesis rules, supporting records, limitations, and experiment notes. Reports share audience/coverage chart markup between the live preview, print, and HTML export.

## Data credibility and compatibility

The storage key remains `competitorlens.v1`; the backup schema remains version `1`. The data model, source mappings, legacy audience strings, custom currencies, opportunity identifiers, and validation notes are preserved. New analytics are pure projections. No migration or destructive rewrite is needed.

Audience bars count competitor records, not people. Pricing comparisons require matching recorded currency/unit labels. Positioning uses the existing qualitative assessments. Coverage counts populated fields and mapped sources. Recent activity uses stored profile/source dates, not an invented history. There is no time-series dataset, so no trend line is displayed. A source-linked label never asserts independent verification.

## Concept-to-render fidelity review

The selected concept images and current Playwright screenshots were inspected with `view_image`. Native viewport captures were reviewed at 1536 × 1024 for the dashboard and 1448 × 1086 for welcome. Responsive page captures also cover 390 × 844.

| Comparison point | Rendered result and deliberate refinement |
| --- | --- |
| Layout hierarchy | Sidebar, page title/actions, demo notice, scope chips, four metrics, paired charts, heatmap, and supporting panels follow the dashboard concept. |
| Palette | Blue/purple/green/orange and pale neutral surfaces replace monochrome. Evidence meanings are consistent and labeled. |
| Typography | System sans-serif retains strong headings and compact analytical labels. No external fonts are required. |
| Spacing and density | Thin borders and small panel gaps are retained. The working dashboard extends below the concept's single screen to accommodate complete labels, tooltips, disclosures, and five activity entries. |
| Charts | Numeric axes and real demo-record coordinates are retained. Hover/focus details and source navigation replace static illustrative annotations. |
| Heatmap | The actual four demo audiences and their mapped evidence are shown. The welcome concept's invented segment labels and unsupported “fit strength” scale were deliberately rejected. |
| Welcome | The headline, supporting sentence, three CTA labels, product preview, and three feature introductions match the direction. The preview is taller so its complete real heatmap remains visible when scrolling. |
| Brand and icons | An original blue/purple lens mark and consistent Lucide navigation icons replace illustrative concept variations. |
| Mobile | Navigation becomes a drawer; metrics use two columns; charts stack; comparison tables scroll within bounded panels. |

### Above-the-fold copy check

The welcome headline “A clearer view of your competition.”, introduction, New Project / Explore Demo / Continue Workspace labels, and local-device reassurance match the selected direction. One additional line names the saved workspace and explains temporary demo isolation. Overview retains “Market overview” and “Turn competitor research into your next move.” The open-hypothesis caption explicitly says project-wide. Demo notices explicitly say fictional.

The welcome concept incorrectly associated 3/2/2/1 bars with competitors. The implementation correctly associates them with Home enthusiasts / Busy professionals / Conscious consumers / Office teams. Concept activity times were not copied; only stored dates appear. Heatmap legends describe linked, recorded-only, and unknown evidence states instead of speculative audience fit.

The implementation was verified against the selected design for hierarchy, palette, typography, spacing, chart treatment, iconography, and copy. The longer scroll, explicit caveats, and corrected conceptual data are intentional deviations. No unresolved material layout mismatch was found in the checked views.


## V1.4 automated research

The existing palette, typography, responsive sidebar, cards, comparison workflows, and evidence colors remain. One new navigation destination follows the existing layout: URL input → collection log → competitor review tabs → compare → report. Selected proposals use blue edges; website statements use green labels; interpretations use purple labels; low confidence and failures remain explicit text, never color alone.

At smaller widths the review tabs wrap, findings and import panels become one column, and matrix/report tables keep local horizontal scrolling. Numeric-price confirmation stays a compact disclosure inside profile review. Original website content is separate from editable finding text. Every inference keeps a scoped source quotation and qualitative explanation.

Positioning can now plot recorded features against recorded audiences, making newly collected research visible without inventing 1–5 market scores. Axes explicitly describe record coverage. No traffic, demographics, market-share, conversion, trend, or audience-size series was added. Differences from the earlier concept are functional disclosures and a research workflow, not a new visual theme.
