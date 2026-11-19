import { sourceFor, audienceRecord } from './model.js';

// Read-only coverage projections; a linked source is never independent verification.
export const CORE_FIELDS = [['positioning', 'Positioning'], ['products', 'Products'], ['pricing', 'Pricing'], ['audiences', 'Audiences'], ['needs', 'Customer needs'], ['behavior', 'Buying behavior']];
export function hasValue(c, key) {
  if (key === 'pricing') return Boolean(c.pricing.trim()) || c.priceAmount !== '';
  return Array.isArray(c[key]) ? c[key].length > 0 : Boolean(String(c[key] ?? '').trim());
}
export function fieldStatus(c, key) {
  if (!hasValue(c, key)) return 'missing';
  return sourceFor(c, key).length ? 'linked' : 'recorded';
}
export function researchStatus(competitors) {
  const fields = competitors.flatMap(c => CORE_FIELDS.map(([key, label]) => ({ competitor: c, key, label, status: fieldStatus(c, key) })));
  return { total: fields.length, linked: fields.filter(f => f.status === 'linked').length, recorded: fields.filter(f => f.status !== 'missing').length, gaps: fields.filter(f => f.status !== 'linked') };
}
export function audienceCell(c, segment) {
  const mentioned = c.audiences.some(a => a.trim().toLowerCase() === segment.trim().toLowerCase());
  return mentioned ? (sourceFor(c, 'audiences', audienceRecord(c, segment)?.id || '__unmapped').length ? 'linked' : 'recorded') : 'missing';
}
export const STATUS_LABEL = { linked: 'Linked', recorded: 'Recorded only', missing: 'Not recorded' };
export function comparable(value) { return Array.isArray(value) ? value.map(x => x.trim().toLowerCase()).sort().join('|') : String(value ?? '').trim().toLowerCase(); }
