import { pricingStatus } from './pricing.js';
import { audienceGroups, opportunities, sourceFor } from './model.js';
import { fieldStatus, audienceCell } from './research.js';

export const SERIES_COLORS = ['#2563eb', '#8055d9', '#12a77b', '#ed8a32', '#0891b2'];
export function seriesColor(c) {
  return SERIES_COLORS[Number.isInteger(c.seriesIndex) && c.seriesIndex >= 0 ? c.seriesIndex : 0];
}
export function summaryMetrics(project, competitors = project.competitors) {
  // Hypotheses remain project-wide; temporary chart scope cannot rewrite validation history.
  return {
    competitors: competitors.length,
    audiences: audienceGroups(competitors).length,
    sources: competitors.reduce((n, c) => n + c.sources.length, 0),
    open: opportunities(project).filter(o => !['Validated', 'Dismissed'].includes(o.status)).length,
  };
}
export function audienceSeries(competitors, linkedOnly = false) {
  return audienceGroups(competitors).map(g => ({ ...g, count: g.competitors.filter(c => !linkedOnly || audienceCell(c, g.key) === 'linked').length }));
}
export function priceGroups(competitors) {
  const map = new Map();
  for (const c of competitors) {
    if (!pricingStatus(c).valid) continue;
    const currency = c.currency.trim().toUpperCase(), unit = c.priceUnit.trim();
    const key = JSON.stringify([currency, unit.toLowerCase()]);
    if (!map.has(key)) map.set(key, { key, currency, unit, records: [] });
    map.get(key).records.push(c);
  }
  return [...map.values()].sort((a, b) => b.records.length - a.records.length || a.key.localeCompare(b.key));
}
export function researchActivity(competitors, type = 'all') {
  const items = competitors.flatMap(c => [
    { id: `record:${c.id}`, type: 'profile', c, title: 'Profile last edited', date: c.updatedAt },
    ...c.sources.map(s => ({ id: `source:${c.id}:${s.id}`, type: 'source', c, title: s.title, date: s.collectedAt })),
  ]);
  return items.filter(x => Number.isFinite(Date.parse(x.date)) && (type === 'all' || x.type === type))
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date) || a.id.localeCompare(b.id));
}
export const INSIGHT_FIELDS = ['needs', 'motivations', 'interests', 'behavior'];
export function insightCoverage(c, segment) {
  const states = INSIGHT_FIELDS.map(key => segment ? (segment[key]?.trim() ? (sourceFor(c,key,segment.id).length ? 'linked' : 'recorded') : 'missing') : fieldStatus(c,key));
  return { linked: states.filter(s => s === 'linked').length, recorded: states.filter(s => s === 'recorded').length, missing: states.filter(s => s === 'missing').length };
}
