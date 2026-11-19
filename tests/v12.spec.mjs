import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { initialState } from '../src/lib/demo.js';
const KEY='competitorlens.v1';
async function go(page,name) {
  const toggle=page.getByRole('button',{name:'Open navigation',exact:true});
  if(await toggle.isVisible()) await toggle.click();
  await page.locator('.sidebar').getByRole('button',{name,exact:true}).click();
}
async function seed(page,state) {
  await page.goto('/'); await page.evaluate(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key:KEY,state}); await page.reload();
}
async function capture(page,name) {
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(process.env.CL_QA_DIR) { await mkdir(process.env.CL_QA_DIR,{recursive:true}); await page.screenshot({path:join(process.env.CL_QA_DIR,name+'.png'),fullPage:true,animations:'disabled'}); }
}

test('Welcome starts the app and creates a persistent project without replacing existing research',async({page})=>{
  const state=initialState(); state.projects[0].name='Existing research';
  await seed(page,state);
  await expect(page.getByRole('heading',{name:'A clearer view of your competition.'})).toBeVisible();
  await expect(page.locator('.preview-product')).toHaveAttribute('inert','');
  await expect(page.locator('.preview-dashboard .summary-metric')).toHaveCount(4);
  await page.getByRole('button',{name:'New Project',exact:true}).click();
  await page.getByLabel('Project name *').fill('Welcome-created project');
  await page.getByRole('button',{name:'Create project',exact:true}).click();
  await expect(page.locator('.breadcrumbs')).toContainText('Welcome-created project');
  const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
  expect(saved.projects[0]).toEqual(state.projects[0]); expect(saved.projects).toHaveLength(2);
  await page.reload(); await page.getByRole('button',{name:'Resume Recent Project',exact:true}).click();
  await expect(page.locator('.breadcrumbs')).toContainText('Welcome-created project');
});

test('Explore Demo edits and exports a separate in-memory workspace while Continue preserves saved data exactly',async({page})=>{
  const state=initialState();state.projects[0].name='My saved research';state.projects[0].competitors[0].notes='Keep this original research.';
  await seed(page,state); const original=await page.evaluate(key=>localStorage.getItem(key),KEY);
  await page.getByRole('button',{name:'Explore Demo',exact:true}).click();
  await expect(page.locator('.demo-session-banner')).toBeVisible();
  await go(page,'Competitors'); await page.locator('.card-name').filter({hasText:/^Daybreak$/}).click();
  await page.getByRole('button',{name:'Edit competitor',exact:true}).click();
  await page.getByLabel('Research notes').fill('Only in the temporary demo.');
  await page.getByRole('button',{name:'Save competitor',exact:true}).click();
  await expect(page.locator('.detail-main')).toContainText('Only in the temporary demo.');
  expect(await page.evaluate(key=>localStorage.getItem(key),KEY)).toBe(original);
  await go(page,'Data Management');
  const downloadEvent=page.waitForEvent('download');await page.getByRole('button',{name:'Download full backup',exact:true}).click();
  const download=await downloadEvent;let text='';for await(const chunk of await download.createReadStream())text+=chunk.toString();
  expect(JSON.parse(text).projects[0].competitors[0].notes).toBe('Only in the temporary demo.');
  await go(page,'Back to welcome');await page.getByRole('button',{name:'Resume Recent Project',exact:true}).click();
  await expect(page.locator('.breadcrumbs')).toContainText('My saved research');
  expect(await page.evaluate(key=>localStorage.getItem(key),KEY)).toBe(original);
  await expect(page.locator('.demo-session-banner')).toHaveCount(0);
});

test('Audience filters, evidence drilldowns, activity filters, and chart links reflect underlying records',async({page})=>{
  const state=initialState();state.projects[0].competitors[0].sources=[];
  await seed(page,state);await page.getByRole('button',{name:'Resume Recent Project',exact:true}).click();
  await page.getByLabel('Audience chart measure').selectOption('linked');
  const bar=page.getByRole('button',{name:'Home enthusiasts: 2 of 4 records',exact:true});
  await expect(bar).toBeVisible(); await bar.focus(); await expect(bar.locator('.chart-tooltip')).toBeVisible();
  await page.locator('.donut-legend').getByRole('button',{name:'Recorded only 6',exact:true}).click();
  await expect(page.locator('.coverage-drilldown')).toContainText('Daybreak');
  await page.getByLabel('Research activity type').selectOption('profile');
  await expect(page.locator('.activity-list button')).toHaveCount(4);
  await expect(page.locator('.activity-list')).toContainText('Profile last edited');
  await bar.click(); await expect(page.locator('.segment-summary')).toContainText('Home enthusiasts');
});

test('Pricing groups, matrix shading, pipeline filters, and exported report charts work',async({page})=>{
  await seed(page,initialState());await page.getByRole('button',{name:'Resume Recent Project',exact:true}).click();
  await go(page,'Competitors'); await page.getByRole('button',{name:'Pricing & positioning',exact:true}).click();
  await expect(page.locator('.price-bar')).toHaveCount(4);
  await page.getByRole('button',{name:'Daybreak: 18 USD per 250 g bag',exact:true}).click();
  await expect(page.getByLabel('Filter sources by field')).toHaveValue('pricing');
  await go(page,'Competitive Matrix');await expect(page.locator('table.matrix')).toHaveClass(/evidence-heatmap/);
  await page.getByLabel('Evidence shading').uncheck();await expect(page.locator('table.matrix')).not.toHaveClass(/evidence-heatmap/);
  await go(page,'Opportunities');await page.getByRole('button',{name:'Filter pipeline: Validated',exact:true}).click();
  await expect(page.getByRole('heading',{name:'No hypotheses in this status.'})).toBeVisible();
  await go(page,'Reports');await expect(page.locator('.report-preview .report-analytics')).toBeVisible();
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Export HTML',exact:true}).click();
  const download=await pending;let html='';for await(const chunk of await download.createReadStream())html+=chunk.toString();
  expect(html).toContain('report-analytics');expect(html).toContain('Scale: 0–4 competitor records');expect(html).toContain('24/24');
});

for(const width of [1536,390]) test(`Welcome and pricing analytics fit ${width}px with no console errors or external requests`,async({page})=>{
  const errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:4173'))external.push(r.url());});
  await page.setViewportSize({width,height:width===390?844:1024});await page.goto('/');
  await expect(page).toHaveTitle(/CompetitorLens/);await expect(page.locator('.welcome-features')).toBeVisible();
  await capture(page,`welcome-${width}`);
  await page.getByRole('button',{name:'Explore Demo',exact:true}).click();
  await go(page,'Competitors');await page.getByRole('button',{name:'Pricing & positioning',exact:true}).click();
  await capture(page,`pricing-${width}`);
  await page.getByLabel('Landscape axes').selectOption('evidence');await expect(page.locator('.plot-point')).toHaveCount(4);
  expect(errors).toEqual([]);expect(external).toEqual([]);
});
