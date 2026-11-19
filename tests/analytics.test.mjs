import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState } from '../src/lib/demo.js';
import { blankCompetitor } from '../src/lib/model.js';
import { audienceSeries, priceGroups, researchActivity, summaryMetrics, insightCoverage } from '../src/lib/analytics.js';
import { reportChartHTML } from '../src/lib/reportCharts.js';

test('Audience charts count records and distinguish linked from unlinked mentions', () => {
  const p = initialState().projects[0];
  const before = structuredClone(p);
  assert.deepEqual(audienceSeries(p.competitors).map(g => g.count), [3, 2, 2, 1]);
  p.competitors[0].sources = [];
  assert.equal(audienceSeries(p.competitors, true).find(g => g.label === 'Home enthusiasts').count, 2);
  assert.equal(audienceSeries(p.competitors).find(g => g.label === 'Home enthusiasts').count, 3);
  assert.deepEqual(summaryMetrics(before), { competitors: 4, audiences: 4, sources: 12, open: 3 });
  assert.deepEqual(insightCoverage(before.competitors[0]), { linked: 4, recorded: 0, missing: 0 });
});

test('Pricing charts separate currencies and units, include zero, and exclude missing numeric values', () => {
  const base = blankCompetitor();
  const records = [
    { ...base, id: 'a', priceAmount: 0, currency: 'USD', priceUnit: 'Month' },
    { ...base, id: 'b', priceAmount: 12, currency: 'usd', priceUnit: ' month ' },
    { ...base, id: 'c', priceAmount: 99, currency: 'USD', priceUnit: 'Year' },
    { ...base, id: 'd', priceAmount: 12, currency: 'EUR', priceUnit: 'month' },
    { ...base, id: 'e', priceAmount: '', currency: 'USD', priceUnit: 'Month' },
  ];
  const before = structuredClone(records), groups = priceGroups(records);
  assert.equal(groups.length, 3);
  assert.deepEqual(groups[0].records.map(c => c.id), ['a', 'b']);
  assert.equal(groups.reduce((n, g) => n + g.records.length, 0), 4);
  assert.deepEqual(records, before);
});

test('Activity uses stored dates only, excludes undated records, and filters by record type', () => {
  const c = { ...blankCompetitor(), id: 'one', updatedAt: '2026-01-01T00:00:00Z', sources: [
    { id: 'old', title: 'Earlier evidence', collectedAt: '2025-12-01' },
    { id: 'new', title: 'Latest evidence', collectedAt: '2026-02-01' },
    { id: 'unknown', title: 'Undated', collectedAt: '' },
  ] };
  assert.deepEqual(researchActivity([c]).map(i => i.id), ['source:one:new', 'record:one', 'source:one:old']);
  assert.equal(researchActivity([c], 'source').length, 2);
  assert.equal(researchActivity([c], 'profile')[0].date, c.updatedAt);
});

test('Exported charts safely render empty and hostile labels without changing research', () => {
  const p = initialState().projects[0];
  p.competitors[0].audiences = ['<img src=x onerror=alert(1)>'];
  const before = structuredClone(p), html = reportChartHTML(p);
  assert.match(html, /&lt;img/);
  assert.ok(!html.includes('<img'));
  assert.match(html, /not independent verification/);
  assert.deepEqual(p, before);
  const empty = reportChartHTML({ ...p, competitors: [] });
  assert.match(empty, /No audience labels recorded/);
  assert.ok(!/NaN|Infinity/.test(empty));
});
