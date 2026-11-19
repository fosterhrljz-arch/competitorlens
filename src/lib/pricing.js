const currencies = new Set(Intl.supportedValuesOf ? Intl.supportedValuesOf('currency') : ['USD','EUR','GBP','CAD','AUD','JPY','CNY','INR','CHF']);
export const pricingSignature = c => JSON.stringify([c.priceAmount, c.currency, c.priceUnit, c.pricing]);
export function pricingStatus(c) {
  if (c.priceAmount === '') return { valid: false, missing: true, issues: [], conflicts: [] };
  const issues = [], conflicts = [];
  if (!Number.isFinite(Number(c.priceAmount)) || Number(c.priceAmount) < 0 || !String(c.priceAmount).trim()) issues.push('Enter a finite starting amount of zero or more.');
  if (!currencies.has(c.currency.trim().toUpperCase())) issues.push('Use a recognized three-letter currency code, such as USD or EUR.');
  const unit = c.priceUnit.trim();
  if (unit.length < (/\p{Script=Han}/u.test(unit)?1:2) || unit.length > 100 || !/[a-z\p{Script=Han}]/iu.test(unit) || /^(unit|units|n\/a|unknown|tbd)$/i.test(unit)) issues.push('Describe the pricing unit, such as month, seat per month, or 250 g bag.');
  // Flag explicit monetary amounts; quantities and billing dates are not prices.
  const amounts = [...String(c.pricing).matchAll(/(?:[$€£¥]|\b[A-Z]{3}\s+)(\d+(?:,\d{3})*(?:\.\d+)?)/g)].map(m => Number(m[1].replaceAll(',', '')));
  if (amounts.length && !amounts.some(n => n === Number(c.priceAmount))) conflicts.push('Pricing notes contain a monetary amount that differs from the numeric starting amount.');
  const codes = [...String(c.pricing).matchAll(/\b([A-Z]{3})\s+\d/g)].map(m => m[1]).filter(code => currencies.has(code));
  if (/€\s*\d/.test(c.pricing)) codes.push('EUR');
  if (/£\s*\d/.test(c.pricing)) codes.push('GBP');
  if (codes.length && !codes.includes(c.currency.trim().toUpperCase())) conflicts.push('The currency in pricing notes differs from the numeric price currency.');
  const units = [...String(c.pricing).matchAll(/(?:\/|\bper)\s*(\d+\s*(?:kg|g|ml|l)(?:\s+(?:bag|pack))?|month|year|week|day)\b/gi)].map(m=>m[1].trim().toLowerCase().replace(/\s+/g,' '));
  if(units.length && !units.includes(unit.toLowerCase().replace(/\s+/g,' '))) conflicts.push('The billing or package unit in pricing notes differs from the numeric price unit.');
  const reviewed = c.priceNoteReview?.signature === pricingSignature(c) && Boolean(c.priceNoteReview?.reason?.trim());
  return { valid: !issues.length && (!conflicts.length || reviewed), missing: false, issues, conflicts, reviewed };
}
export function numericPriceLabel(c) {
  const status = pricingStatus(c);
  if (status.missing) return 'Not recorded';
  if (!status.valid) return 'Needs pricing review';
  return `${c.currency.trim().toUpperCase()} ${Number(c.priceAmount).toLocaleString('en-US')} / ${c.priceUnit.trim()}`;
}
