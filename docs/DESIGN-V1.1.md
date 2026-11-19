# CompetitorLens V1.1 design specification

## Product direction

An independent competitor research dashboard, with Semrush-inspired task organization and an Apple-inspired monochrome interface. Actionable research questions and evidence coverage lead the overview. No traffic estimates, demographics, market share, or synthetic audience sizes are introduced.

The four official Semrush references listed in the README were reviewed, including their dashboard images. Domain comparison controls, audience drilldowns, structured navigation, and market-positioning workflows informed the information architecture. The visual treatment and all implementation are local to CompetitorLens.

## Concept references

Two image-generated concepts were created before implementation:

- `redesign-overview-concept.png`: research brief, research status, audience-by-competitor coverage, positioning, and next actions.
- `redesign-editor-concept.png`: a full-page three-step editing workspace, contextual guidance, and research coverage.

The earlier V1 concept is retained as `design-concept.png`. These images are design documentation; no screenshot is used as functional UI or as an application background.

## Shared design system

- System sans-serif font stack; no remote font dependency. Main headings 30 px on desktop and 28 px on mobile; panel headings approximately 19 px; restrained metadata hierarchy.
- 224 px sidebar and 58 px desktop top bar. Mobile navigation becomes a drawer below 800 px.
- Primary ink `#1c1c1f`; white canvas; pale gray surfaces; `#e1e1e6` borders; secondary text token `#686870`.
- Approximately 20–30 px panel padding, 18–24 px major gaps, 10 px panel corners, smaller control corners.
- Charcoal primary buttons, quiet secondary controls, outline Lucide icons, visible keyboard focus, native input controls, and reduced-motion support.
- Source, inference, unknown, and demo labels are consistent throughout. Status symbols have accompanying text; meaning is not communicated by color alone.

## Page structure and interactions

| View | Structure and workflow |
| --- | --- |
| Overview | Project research brief and research status; scoped audience matrix; editable-assessment positioning map; next research actions |
| Audience × Competitor | Scrollable table, sticky audience column, linked/recorded/unknown cells, inline evidence inspector, field-specific profile links |
| Competitors | Search and sort controls; two-column summary cards; products, prices, audiences, research coverage; dedicated profile views |
| Competitor details | Overview, Audience, and Sources tabs; filtered source library; persistent research-coverage context; edit and delete actions |
| Editor | Profile & positioning → Audience → Evidence; unrestricted step navigation; retained draft; explicit save; discard protection |
| Audience Analysis | Searchable segment navigation, competitor filter, structured needs/motivations/interests/behavior panels, evidence drilldowns |
| Competitive Matrix | Competitor scope, differences-only and features-only filters, sticky column headers and comparison labels, direct field evidence links |
| Opportunities | Hypothesis navigation, evidence basis, unknowns, experiment, status, and saved validation notes |
| Reports / Data | Existing report, CSV, full backup, restore, and recovery workflows retained within the shared shell |

## Evidence and compatibility decisions

The audience schema is unchanged. Segment and comparison views project the existing competitor fields without rewriting or deleting them. The storage key and backup version remain `competitorlens.v1` and `1`.

Research status checks six core fields for each competitor: positioning, products, pricing, audiences, needs, and buying behavior. A field counts as linked only when it has a recorded value and a mapped source. A source link is not verification. Audience sources are mapped at field level; the inspector explicitly asks the analyst to confirm relevance to the selected segment.

Overview brief/status apply to the whole project. Comparison chips sit immediately before the matrix and affect the matrix and chart. This placement avoids suggesting that project-wide hypotheses are recalculated for a temporary comparison scope. Reviewed hypotheses are not proposed again as the leading pending action.

Positioning coordinates remain the original analyst assessments. Shared coordinates use one marker with individually reachable names; coordinates are never shifted to fabricate separation. Unknown feature and audience cells remain unknown.

## Concept-to-implementation review

The generated concepts and rendered overview/editor were inspected using the image viewer at a 1536 × 1024 viewport. Review covered layout order, spacing, typography, monochrome palette, borders, icon treatment, density, and the first-screen copy. Every major view was also checked at 390 × 844.

Intentional refinements from the concepts:

- Comparison chips moved below the project-wide brief/status to make scope explicit.
- The research brief says “Project research brief”; supporting text describes recorded mentions and asks the analyst to test demand.
- Correct data-driven chart axes replace the concept’s illustrative coordinates. Shared points retain accurate positions.
- Editor coverage lists the actual six core research fields rather than the concept’s decorative checklist. Existing research notes, price-unit text, currencies, and all evidence mappings remain available.
- More space is reserved for working controls, full record content, helper text, and evidence disclosure. The editor therefore extends beyond one desktop viewport.
- Secondary text was darkened for legibility. Mobile panels stack; tables and filter tabs scroll within their own regions.

The result retains the concept’s layout hierarchy, calm palette, fine borders, and three-column editor while making each control functional and preserving V1 information.
