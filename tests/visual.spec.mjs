import { initialState } from '../src/lib/demo.js';
import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
test('Desktop and mobile visual audit, console health, and no automatic external requests',async({page})=>{
  const errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});page.on('request',req=>{if(!req.url().startsWith('http://127.0.0.1:4173'))external.push(req.url());});
  const out=process.env.CL_QA_DIR;if(out)await mkdir(out,{recursive:true});
  await page.goto('/');await page.evaluate(s=>localStorage.setItem('competitorlens.v1',JSON.stringify(s)),initialState());await page.reload();await page.getByRole('button',{name:'Resume Recent Project',exact:true}).click();await expect(page.locator('.plot-point')).toHaveCount(4);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(out)await page.screenshot({path:join(out,'overview-desktop.png'),fullPage:true,animations:'disabled'});
  await page.locator('aside').getByRole('button',{name:'Competitive Matrix',exact:true}).click();
  if(out)await page.screenshot({path:join(out,'matrix-desktop.png'),fullPage:true,animations:'disabled'});
  await page.locator('aside').getByRole('button',{name:'Reports',exact:true}).click();
  if(out){await page.screenshot({path:join(out,'reports-desktop.png'),fullPage:false,animations:'disabled'});await page.pdf({path:join(out,'demo-report-qa.pdf'),format:'A4',printBackground:true});}
  await page.locator('aside').getByRole('button',{name:'Overview',exact:true}).click();
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(out)await page.screenshot({path:join(out,'overview-mobile.png'),fullPage:true,animations:'disabled'});
  expect(errors).toEqual([]);expect(external).toEqual([]);
});
test('Public-page success path reviews extracted evidence with a local test fixture',async({page})=>{
  await page.route('https://fixture.test/pricing',route=>route.fulfill({status:200,contentType:'text/html',headers:{'Access-Control-Allow-Origin':'*'},body:'<!doctype html><title>Fixture pricing</title><meta name="description" content="A test-only product page."><body><h1>Starter offer</h1><p>USD 12 per month.</p><script>throw new Error("must not execute")</script></body>'}));
  await page.goto('/');await page.evaluate(s=>localStorage.setItem('competitorlens.v1',JSON.stringify(s)),initialState());await page.reload();await page.getByRole('button',{name:'Resume Recent Project',exact:true}).click();await page.getByRole('button',{name:'Add competitor',exact:true}).click();await page.getByRole('button',{name:/^Evidence/}).click();await page.getByLabel('Source URL',{exact:true}).fill('https://fixture.test/pricing');await page.getByRole('button',{name:'Fetch page'}).click();
  await expect(page.getByLabel('Source title',{exact:true})).toHaveValue('Fixture pricing');
  const value=await page.getByLabel('Supporting excerpt or research note').inputValue();expect(value).toContain('USD 12 per month.');expect(value).not.toContain('must not execute');await page.getByLabel('Pricing',{exact:true}).check();await page.getByRole('button',{name:'Attach source'}).click();await expect(page.locator('.attached-source')).toHaveCount(1);
});
