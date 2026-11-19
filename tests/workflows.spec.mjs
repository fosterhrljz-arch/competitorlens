import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { validateBackup } from '../src/lib/model.js';
import { initialState } from '../src/lib/demo.js';

const KEY = 'competitorlens.v1';
async function continueWorkspace(page) { const button = page.getByRole('button', {name:/^(Resume Recent Project|Recover Workspace)$/}); if(await button.isVisible()) await button.click(); }
const nav = (page, name) => page.locator('.sidebar').getByRole('button', { name, exact: true });
async function go(page, name) {
  if (await page.getByRole('button', { name: 'Open navigation' }).isVisible()) await page.getByRole('button', { name: 'Open navigation' }).click();
  await nav(page, name).click();
}
const add = page => page.locator('.page-title').getByRole('button', { name: 'Add competitor', exact: true }).click();
const saved = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
async function seed(page, state) { Object.assign(state,validateBackup(state)); await page.evaluate(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: KEY, state }); await page.reload(); await continueWorkspace(page); }
async function downloadText(page, button) {
  const pending = page.waitForEvent('download'); await button.click(); const download = await pending;
  let text = ''; for await (const chunk of await download.createReadStream()) text += chunk.toString();
  return { text, name: download.suggestedFilename() };
}
async function openDaybreak(page) { await go(page, 'Competitors'); await page.locator('.card-name').filter({ hasText: /^Daybreak$/ }).click(); }

test.beforeEach(async ({ page }) => { await page.goto('/'); await seed(page, initialState()); });

test('Overview compares evidence, changes scope, and opens actionable research', async ({ page }) => {
  await expect(page).toHaveTitle(/CompetitorLens/);
  await expect(page.getByRole('heading', { name: 'Market overview', exact: true })).toBeVisible();
  await expect(page.locator('.research-brief')).toContainText(/office teams/i);
  await expect(page.locator('.research-status')).toContainText('24/24');
  await page.getByRole('button', { name: 'Office teams at Daybreak: Not recorded' }).click();
  await expect(page.locator('.cell-inspector')).toContainText('does not establish');
  await page.getByRole('button', { name: 'Office teams at Common Ground: Linked' }).click();
  await expect(page.locator('.cell-inspector .source')).toHaveCount(1);
  await page.getByRole('button', { name: 'Open competitor research' }).click();
  await expect(page.getByLabel('Filter sources by field')).toHaveValue('audiences');
  await go(page, 'Overview');
  await page.getByRole('button', { name: 'Include Daybreak', exact: true }).click();
  await expect(page.locator('.audience-matrix thead th')).toHaveCount(4);
  await expect(page.locator('.research-status')).toContainText('18/18'); // Coverage follows comparison scope; hypotheses stay project-wide.
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.locator('.plot-point')).toHaveCount(4);
  await page.getByLabel('Landscape axes').selectOption('evidence');
  await expect(page.locator('.y-label.top')).toHaveText('4 sources');
  await page.getByRole('button', { name: 'View Daybreak positioning' }).click();
  await expect(page.locator('.detail-heading h1')).toHaveText('Daybreak');
  await go(page, 'Overview'); await page.getByRole('button', { name: 'Review hypothesis' }).click();
  await expect(page.locator('.opportunity-detail h2')).toContainText(/office teams/i);
});

test('Competitor cards search, sort, and open dedicated detail and field evidence', async ({ page }) => {
  await go(page, 'Competitors'); await expect(page.locator('.competitor-card')).toHaveCount(4);
  await page.getByLabel('Sort competitors').selectOption('evidence');
  await expect(page.locator('.card-name').first()).toHaveText('Roam Coffee');
  await page.getByLabel('Search competitors').fill('office');
  await expect(page.locator('.competitor-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'View competitor', exact: true }).click();
  await expect(page.locator('.detail-heading h1')).toHaveText('Common Ground');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.locator('.page-tabs').getByRole('button', { name: 'Audience', exact: true }).click();
  await expect(page.locator('.detail-fields')).toContainText('Office teams');
  await page.locator('.detail-field').filter({ has: page.getByRole('heading', { name: 'Customer needs', exact: true }) }).getByRole('button').click();
  await expect(page.getByLabel('Filter sources by field')).toHaveValue('needs');
  await expect(page.locator('.source')).toHaveCount(1);
});

test('Step editor creates, attaches evidence, persists, edits, and deletes', async ({ page }) => {
  await add(page); await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByLabel('Competitor name', { exact: true }).fill('Northstar');
  await page.getByLabel('Website URL', { exact: true }).fill('https://northstar.example');
  await page.getByLabel('Positioning statement').fill('Simple coffee for independent studios.');
  await page.getByLabel('Features', { exact: true }).fill('Office packs|Trial bags');
  await page.getByRole('button', { name: 'Continue to audience' }).click();
  await page.getByLabel('Audience segments', { exact: true }).fill('Studio teams|Remote workers');
  await page.getByLabel('Customer needs', { exact: true }).fill('Low-commitment supply.');
  await page.getByRole('button', { name: 'Continue to evidence' }).click();
  await page.getByLabel('Source URL', { exact: true }).fill('');
  await page.getByLabel('Source title', { exact: true }).fill('Interview notes');
  await page.getByLabel('Supporting excerpt or research note').fill('Two studio owners asked for trial bags.');
  await page.getByLabel('Needs', { exact: true }).check(); await page.getByRole('button', { name: 'Attach source' }).click();
  await page.getByRole('button', { name: 'Save & finish' }).click();
  await expect(page.locator('.detail-heading h1')).toHaveText('Northstar');
  await go(page, 'Competitors'); await expect(page.getByRole('button', { name: 'Add competitor', exact: true })).toBeDisabled();
  await page.reload(); await continueWorkspace(page); await go(page, 'Competitors'); await page.getByLabel('Search competitors').fill('Northstar'); await page.locator('.card-name').click();
  await page.getByRole('button', { name: 'Edit competitor', exact: true }).click();
  await page.getByLabel('Competitor name', { exact: true }).fill('Northstar Studio'); await page.getByRole('button', { name: 'Save competitor', exact: true }).click();
  const c = (await saved(page)).projects[0].competitors.at(-1);
  expect(c.audiences).toEqual(['Studio teams', 'Remote workers']); expect(c.sources[0].fields).toEqual(['needs']); expect(c.sources[0].excerpt).toContain('Two studio owners');
  await page.getByRole('button', { name: 'Delete competitor', exact: true }).click(); await page.getByRole('button', { name: 'Delete permanently' }).click();
  expect((await saved(page)).projects[0].competitors).toHaveLength(4);
});

test('Unsaved edits survive step changes and require explicit discard', async ({ page }) => {
  await openDaybreak(page); await page.getByRole('button', { name: 'Edit competitor' }).click();
  await page.getByLabel('Competitor name', { exact: true }).fill('Unsaved name');
  await page.getByRole('button', { name: 'Continue to audience' }).click();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByLabel('Competitor name', { exact: true })).toHaveValue('Unsaved name');
  await nav(page, 'Overview').click(); await expect(page.getByRole('dialog')).toContainText('Leave without saving?');
  await page.getByRole('button', { name: 'Keep editing' }).click();
  await expect(page.getByLabel('Competitor name', { exact: true })).toHaveValue('Unsaved name');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click(); await page.getByRole('button', { name: 'Discard changes' }).click();
  await expect(page.locator('.detail-heading h1')).toHaveText('Daybreak');
});

test('V1 records and complete backup remain lossless across redesigned views and an edit', async ({ page }) => {
  const fixture = initialState(); const c = fixture.projects[0].competitors[0];
  c.currency = 'CHF'; c.notes = 'Preserve legacy\nnotes, punctuation, and source mappings.';
  c.motivations = 'Legacy motivation — keep exactly.';
  fixture.projects[0].opportunityState.flexibility = { status: 'Investigating', note: 'Existing validation note.' };
  await seed(page, fixture);
  for (const name of ['Competitors', 'Audience Analysis', 'Competitive Matrix', 'Opportunities', 'Reports', 'Data Management']) await go(page, name);
  expect(await saved(page)).toEqual(fixture);
  const backup = await downloadText(page, page.getByRole('button', { name: 'Download full backup', exact: true }));
  expect(JSON.parse(backup.text)).toEqual(fixture);
  await openDaybreak(page); await page.getByRole('button', { name: 'Edit competitor' }).click();
  await expect(page.getByLabel('Currency', { exact: true })).toHaveValue('CHF');
  await page.getByLabel('Positioning statement').fill('A revised positioning statement.');
  await page.getByRole('button', { name: 'Save competitor' }).click();
  const changed = await saved(page); const updated = changed.projects[0].competitors[0];
  expect(updated.updatedAt).not.toBe(c.updatedAt);
  expect({ ...updated, positioning: c.positioning, updatedAt: c.updatedAt }).toEqual(c);
  expect(changed.projects[0].competitors.slice(1)).toEqual(fixture.projects[0].competitors.slice(1));
  expect(changed.projects[0].opportunityState).toEqual(fixture.projects[0].opportunityState);
  await go(page, 'Data Management');
  await page.getByLabel('Restore backup file').setInputFiles({ name: 'legacy-v1.json', mimeType: 'application/json', buffer: Buffer.from(backup.text) });
  await page.getByRole('button', { name: 'Replace workspace' }).click(); expect(await saved(page)).toEqual(fixture);
});

test('Audience segments, filters, structured notes, and supporting evidence stay connected', async ({ page }) => {
  await go(page, 'Audience Analysis');
  await page.locator('.segment-item').filter({ hasText: 'Office teams' }).click();
  await expect(page.locator('.segment-summary h2')).toHaveText('Office teams');
  await expect(page.locator('.customer-insight')).toHaveCount(4);
  await page.locator('.customer-insight').first().getByRole('button',{name:/mapped sources/}).click();
  await expect(page.locator('.segment-evidence')).toContainText('No supporting source linked');
  await page.getByLabel('Filter audience by competitor').selectOption({ label: 'Daybreak' });
  await expect(page.locator('.segment-evidence')).toHaveCount(0);
  await expect(page.locator('.segment-summary')).toContainText('Daybreak');
  await page.getByLabel('Find audience segment').fill('not a segment');
  await expect(page.getByRole('heading', { name: 'No matching segments.' })).toBeVisible();
  await page.getByLabel('Find audience segment').fill('');
  await page.getByLabel('Filter audience by competitor').selectOption('all');
  await expect(page.locator('.segment-item')).toHaveCount(4);
});

test('Competitive matrix filters differences, keeps headers sticky, and drills into sources', async ({ page }) => {
  await go(page, 'Competitive Matrix');
  const scroll = page.getByRole('region', { name: 'Competitive comparison table' });
  const rowCount = await page.locator('table.matrix tbody tr').count();
  await page.getByLabel('Differences only', { exact: true }).check();
  expect(await page.locator('table.matrix tbody tr').count()).toBeLessThanOrEqual(rowCount);
  await page.getByLabel('Features only', { exact: true }).check();
  await expect(page.locator('table.matrix')).not.toContainText('Buying behavior');
  await expect(page.locator('table.matrix')).toContainText('Not recorded');
  await page.getByLabel('Features only', { exact: true }).uncheck();
  expect(await page.locator('table.matrix thead th').first().evaluate(el => getComputedStyle(el).position)).toBe('sticky');
  const before = await page.locator('table.matrix thead th').first().boundingBox();
  await scroll.evaluate(el => { el.scrollTop = 300; });
  const after = await page.locator('table.matrix thead th').first().boundingBox();
  expect(Math.abs(before.y - after.y)).toBeLessThan(2);
  await scroll.evaluate(el => { el.scrollTop = 0; });
  await page.locator('table.matrix tbody tr').first().getByRole('button').first().click();
  await expect(page.getByLabel('Filter sources by field')).toHaveValue('audiences');
  await go(page, 'Competitive Matrix');
  for (const name of ['Daybreak', 'Roam Coffee', 'Common Ground']) await page.getByRole('button', { name: `Include ${name}`, exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Choose at least two competitors.' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset', exact: true }).click(); await expect(scroll).toBeVisible();
});

test('Opportunity validation actions, notes, and filters persist', async ({ page }) => {
  await go(page, 'Opportunities');
  await expect(page.locator('.opportunity-choice')).toHaveCount(3);
  await expect(page.locator('.opportunity-detail')).toContainText('What remains unknown');
  await page.getByRole('button', { name: 'Start validation' }).click();
  await expect(page.getByLabel('Your validation notes')).toBeFocused();
  await page.getByLabel('Your validation notes').fill('Run three interviews before committing.');
  await page.reload(); await continueWorkspace(page); await go(page, 'Opportunities');
  await page.getByRole('button', { name: 'Investigating 1', exact: true }).click();
  await expect(page.locator('.opportunity-choice')).toHaveCount(1);
  await expect(page.getByLabel('Your validation notes')).toHaveValue('Run three interviews before committing.');
  await page.locator('.validation select').selectOption('Validated');
  await expect(page.getByRole('heading', { name: 'No hypotheses in this status.' })).toBeVisible();
  await page.getByRole('button', { name: 'Validated 1', exact: true }).click();
  await expect(page.locator('.validation select')).toHaveValue('Validated');
});

test('New project, CSV preview, and atomic invalid import work', async ({ page }) => {
  await page.getByRole('button', { name: 'Create your project' }).click();
  await page.getByLabel('Project name *').fill('Studio research'); await page.getByLabel('Industry or market').fill('Creative tools');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await expect(page.locator('.demo-banner')).toHaveCount(0); await go(page, 'Data Management');
  const csv = 'name,url,positioning,audiences,features\nAlpha,https://alpha.example,For studios,Designers|Teams,Export|Templates\nBeta,https://beta.example,For creators,Creators|Teams,Export';
  await page.getByLabel('Import CSV file').setInputFiles({ name: 'records.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
  await expect(page.getByRole('heading', { name: 'Review CSV import' })).toBeVisible();
  await page.getByRole('button', { name: 'Import 2 records' }).click();
  await go(page, 'Overview'); await page.getByRole('button', { name: 'Teams at Alpha: Recorded only' }).click();
  await expect(page.locator('.cell-inspector')).toContainText('no source is mapped to this specific audience');
  await go(page, 'Competitive Matrix'); await expect(page.locator('table.matrix')).toContainText('Alpha');
  await page.getByLabel('Differences only', { exact: true }).check(); await page.getByLabel('Features only', { exact: true }).check();
  await expect(page.locator('table.matrix tbody')).not.toContainText('export');
  await expect(page.locator('table.matrix tbody')).toContainText('templates');
  await go(page, 'Data Management');
  await page.getByLabel('Import CSV file').setInputFiles({ name: 'invalid.csv', mimeType: 'text/csv', buffer: Buffer.from('name\nAlpha\nGamma') });
  await expect(page.getByRole('alert')).toContainText('already in the project');
  expect((await saved(page)).projects.find(p => p.name === 'Studio research').competitors).toHaveLength(2);
});

test('Reports preserve commentary, complete sources, downloads, and full-width print layout', async ({ page }) => {
  await go(page, 'Reports'); await page.getByLabel('Report title').fill('Coffee opportunity review');
  await page.getByLabel('Executive commentary').fill('Test flexible purchase options before launch.');
  await page.getByRole('button', { name: 'Generate report' }).click();
  await expect(page.locator('.report-preview h1')).toHaveText('Coffee opportunity review');
  const report = await downloadText(page, page.getByRole('button', { name: 'Export HTML', exact: true }));
  expect(report.name).toBe('CompetitorLens-report.html'); expect(report.text).toContain('Evidence appendix');
  expect(report.text).toContain('DEMO CONTENT INCLUDED'); expect(report.text).toContain('Test flexible purchase options');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.sidebar')).toBeHidden(); await expect(page.locator('.print-report')).toBeVisible();
  expect(await page.locator('.main-shell').evaluate(el => getComputedStyle(el).marginLeft)).toBe('0px');
  if (process.env.CL_QA_DIR) { await mkdir(process.env.CL_QA_DIR, { recursive: true }); await page.pdf({ path: path.join(process.env.CL_QA_DIR, 'report.pdf'), preferCSSPageSize: true, printBackground: true }); }
  await page.emulateMedia({ media: 'screen' }); await go(page, 'Data Management');
  for (const [button, name] of [['Export CSV', 'CompetitorLens-competitors.csv'], ['Download full backup', 'CompetitorLens-backup.json']]) {
    expect((await downloadText(page, page.getByRole('button', { name: button, exact: true }))).name).toBe(name);
  }
});

test('Public-page collection is reviewed before attachment and manual fallback is actionable', async ({ page }) => {
  await add(page); await page.getByRole('button', { name: 'Evidence', exact: true }).click();
  await page.getByLabel('Source URL', { exact: true }).fill('https://demo.example'); await page.getByRole('button', { name: 'Fetch page' }).click();
  await expect(page.getByText(/Use a real public website/)).toBeVisible();
  await page.route('https://example.com/research', route => route.fulfill({ status: 200, contentType: 'text/html', headers: { 'access-control-allow-origin': '*' }, body: '<html><head><title>Sample pricing</title></head><body><main>Trial packs for small teams.</main></body></html>' }));
  await page.getByLabel('Source URL', { exact: true }).fill('https://example.com/research'); await page.getByRole('button', { name: 'Fetch page' }).click();
  await expect(page.getByLabel('Source title', { exact: true })).toHaveValue('Sample pricing');
  await expect(page.locator('.attached-source')).toHaveCount(0);
  await page.getByRole('button', { name: 'Save competitor' }).click();
  await expect(page.getByRole('alert')).toContainText('Attach your pending source');
  await page.getByLabel('Audiences', { exact: true }).check(); await page.getByRole('button', { name: 'Attach source' }).click();
  await expect(page.locator('.attached-source')).toHaveCount(1);
});

test('URL-only manual records use the domain as the name', async ({ page }) => {
  await add(page); await page.getByLabel('Website URL', { exact: true }).fill('https://northstar.test');
  await page.getByRole('button', { name: 'Save competitor' }).click();
  await expect(page.locator('.detail-heading h1')).toHaveText('northstar.test');
  await page.reload(); await continueWorkspace(page); await go(page, 'Competitors'); await expect(page.locator('.card-name').filter({ hasText: 'northstar.test' })).toBeVisible();
});

test('Corrupt storage stays intact until explicit recovery, including rejected writes', async ({ page }) => {
  await page.evaluate(key => localStorage.setItem(key, '{broken'), KEY); await page.reload(); await continueWorkspace(page);
  await expect(page.getByRole('alert')).toContainText('original saved data has not been overwritten');
  await page.getByLabel('Project', { exact: true }).selectOption('__new'); await page.getByLabel('Project name *').fill('Cannot overwrite recovery');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  expect(await page.evaluate(key => localStorage.getItem(key), KEY)).toBe('{broken');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: 'Start fresh', exact: true }).click(); await page.getByRole('button', { name: 'Start empty workspace' }).click();
  await expect(page.getByRole('alert')).toHaveCount(0); expect((await saved(page)).version).toBe(4); expect((await saved(page)).projects).toEqual([]);
});

test('Unavailable storage keeps recovery open, exports the pending backup, and retries without false success', async ({ page }) => {
  await page.addInitScript(() => { window.storageMethods = {getItem:Storage.prototype.getItem,setItem:Storage.prototype.setItem}; Storage.prototype.getItem = function () { throw new DOMException('Blocked', 'SecurityError'); }; Storage.prototype.setItem = function () { throw new DOMException('Blocked', 'SecurityError'); }; });
  await page.reload(); await continueWorkspace(page); await page.getByRole('button', { name: 'Start fresh', exact: true }).click(); await page.getByRole('button', { name: 'Start empty workspace' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Save failed');
  await expect(page.locator('.toast')).toHaveCount(0);
  const recovery = await downloadText(page, page.getByRole('dialog').getByRole('button', { name: 'Download unsaved backup', exact: true }));
  expect(JSON.parse(recovery.text).projects).toEqual([]);
  await page.evaluate(() => Object.assign(Storage.prototype, window.storageMethods));
  await page.getByRole('button', { name: 'Start empty workspace' }).click();
  await page.getByRole('button', { name: 'New Project', exact: true }).click(); await page.getByLabel('Project name *').fill('Memory-only research');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0); await go(page,'Data Management');
  const backup = await downloadText(page, page.getByRole('button', { name: 'Download full backup', exact: true }));
  expect(JSON.parse(backup.text).projects.some(p => p.name === 'Memory-only research')).toBe(true);
});

test('Cross-tab changes protect a dirty draft until the user chooses', async ({ page, context }) => {
  await seed(page, initialState()); await openDaybreak(page); await page.getByRole('button', { name: 'Edit competitor' }).click();
  await page.getByLabel('Research notes').fill('Do not discard my draft.');
  const other = await context.newPage(); await other.goto('/');
  await other.evaluate(key => { const state = JSON.parse(localStorage.getItem(key)); state.projects[0].name = 'Changed in other tab'; localStorage.setItem(key, JSON.stringify(state)); }, KEY);
  await expect(page.getByRole('dialog')).toContainText('This workspace changed in another tab.');
  await page.getByRole('button', { name: 'Keep draft' }).click(); await expect(page.getByLabel('Research notes')).toHaveValue('Do not discard my draft.');
  await other.evaluate(key => { const state = JSON.parse(localStorage.getItem(key)); state.projects[0].name = 'Latest shared workspace'; localStorage.setItem(key, JSON.stringify(state)); }, KEY);
  await page.getByRole('button', { name: 'Load saved workspace' }).click();
  await expect(page.locator('.breadcrumbs')).toContainText('Latest shared workspace'); await expect(page.locator('.editor-workspace')).toHaveCount(0);
  await other.close();
});

for (const viewport of [{ width: 1536, height: 1024 }, { width: 390, height: 844 }]) {
  test(`Every major page and editor step fits ${viewport.width}px, without runtime errors or background requests`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors = [], requests = []; page.on('pageerror', e => errors.push(e.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('request', req => { if (/^https?:/.test(req.url()) && !req.url().startsWith('http://127.0.0.1:4173')) requests.push(req.url()); });
    const size = viewport.width > 600 ? 'desktop' : 'mobile';
    const capture = async name => {
      await expect(page.locator('#main')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), name).toBe(true);
      await expect(page.locator('.fatal')).toHaveCount(0);
      if (process.env.CL_QA_DIR) { await mkdir(process.env.CL_QA_DIR, { recursive: true }); await page.screenshot({ path: path.join(process.env.CL_QA_DIR, `${name}-${size}.png`), fullPage: true, animations: 'disabled' }); }
    };
    await capture('overview');
    for (const [label, slug] of [['Competitors', 'competitors'], ['Audience Analysis', 'audience'], ['Competitive Matrix', 'matrix'], ['Opportunities', 'opportunities'], ['Reports', 'reports'], ['Data Management', 'data']]) {
      await go(page, label); await expect(page.locator('.page-title h1')).toBeVisible(); await capture(slug);
    }
    await openDaybreak(page); await capture('detail');
    await page.getByRole('button', { name: 'Edit competitor' }).click(); await capture('editor-profile');
    await page.getByRole('button', { name: 'Continue to audience' }).click(); await capture('editor-audience');
    await page.getByRole('button', { name: 'Continue to evidence' }).click(); await capture('editor-evidence');
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page.getByRole('button', { name: 'Documentation', exact: true }).click(); await expect(page.getByRole('dialog')).toBeVisible();
    expect(await page.getByRole('dialog').evaluate(el => el.getBoundingClientRect().right <= innerWidth)).toBe(true);
    await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(errors).toEqual([]); expect(requests).toEqual([]);
  });
}
