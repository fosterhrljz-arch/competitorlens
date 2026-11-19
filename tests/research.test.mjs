import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState } from '../src/lib/demo.js';
import { blankCompetitor, ensureAudienceResearch, validateBackup } from '../src/lib/model.js';
import { fieldStatus, researchStatus, audienceCell, comparable } from '../src/lib/research.js';

test('Research coverage counts recorded fields with mapped evidence, never presumed verification', () => {
  const c = { ...blankCompetitor(), name: 'Example', needs: 'Simple setup', sources: [{ fields: ['pricing', 'needs'] }] };
  assert.equal(fieldStatus(c, 'pricing'), 'missing'); // An attached source alone cannot create a claim.
  assert.equal(fieldStatus(c, 'needs'), 'linked');
  c.priceAmount = '0'; assert.equal(fieldStatus(c, 'pricing'), 'linked');
  c.products = 'Starter kit'; assert.equal(fieldStatus(c, 'products'), 'recorded');
  const status = researchStatus([c]); assert.equal(status.total, 6); assert.equal(status.linked, 2); assert.equal(status.recorded, 3);
  assert.equal(status.gaps.length, 4);
});

test('Audience cells distinguish unknown labels, unsupported records, and linked fields', () => {
  const c = ensureAudienceResearch({ ...blankCompetitor(), audiences: ['Office teams'] });
  assert.equal(audienceCell(c, 'Students'), 'missing'); assert.equal(audienceCell(c, ' OFFICE TEAMS '), 'recorded');
  c.sources = [{ fields: ['audiences'],segmentMappings:[] }]; assert.equal(audienceCell(c, 'office teams'), 'recorded');
  c.sources[0].segmentMappings=[{segmentId:c.audienceResearch[0].id,fields:['audiences']}]; assert.equal(audienceCell(c, 'office teams'), 'linked');
  assert.equal(audienceCell(c, 'Students'), 'missing');
});

test('Dashboard projections leave complete V1 records and opportunity notes unchanged', () => {
  const state = initialState(); const original = structuredClone(state); const cs = state.projects[0].competitors;
  assert.equal(researchStatus(cs).linked, 24); assert.equal(researchStatus(cs).total, 24);
  cs.forEach(c => audienceCell(c, 'Office teams'));
  assert.deepEqual(state, original); assert.deepEqual(validateBackup(JSON.parse(JSON.stringify(state))), original);
  assert.equal(comparable(['Teams', 'Owners']), comparable([' owners ', 'teams']));
});
