// Opt-in acceptance exercise. Makes read-only public requests to three real competitors.
// Uses a fresh Edge profile; never reads an existing user's browser workspace.
import { chromium } from '@playwright/test';
import { strict as assert } from 'node:assert';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { startServer } from '../service/server.mjs';
const out=resolve(process.env.CL_QA_DIR||'../competitorlens-v15-review');await mkdir(out,{recursive:true});
const server=await startServer({port:0}),browser=await chromium.launch({channel:'msedge',headless:true});
try{
  const context=await browser.newContext({reducedMotion:'reduce',viewport:{width:1440,height:900},acceptDownloads:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.getByRole('button',{name:'New Project',exact:true}).click();await page.getByLabel('Project name *').fill('Public analytics platforms · live acceptance');await page.getByLabel('Industry or market').fill('Website analytics');await page.getByRole('button',{name:'Create project',exact:true}).click();
  const go=async name=>{const menu=page.getByRole('button',{name:'Open navigation',exact:true});if(await menu.isVisible())await menu.click();await page.locator('.sidebar').getByRole('button',{name,exact:true}).click();};
  await go('Automated Research');await page.getByLabel('Competitor website URLs').fill(process.env.CL_LIVE_URLS||'https://plausible.io/\nhttps://www.simpleanalytics.com/\nhttps://usefathom.com/');await page.getByRole('button',{name:'Collect & analyze websites',exact:true}).click();
  await page.getByRole('heading',{name:'Collection ready for review',exact:true}).waitFor({timeout:480000});
  // A real website can fail transiently. Exercise the visible retry action once per competitor.
  const competitors=page.locator('.research-competitors button');
  for(let i=0;i<await competitors.count();i++){await competitors.nth(i).click();const retry=page.getByRole('button',{name:'Retry this website',exact:true});if(await retry.isVisible()){await page.locator('.research-progress details').evaluate(el=>el.open=true);console.log('Collection issue before retry: '+(await page.locator('.research-log li.failed').allTextContents()).join(' | '));await retry.click();await page.getByRole('heading',{name:'Collection ready for review',exact:true}).waitFor({timeout:240000});}}
  await competitors.first().click();
  const progress=await page.locator('.research-progress').innerText();console.log(progress.slice(0,1500));await page.screenshot({animations:'disabled',path:join(out,'live-review-desktop.png')});
  await page.getByRole('button',{name:'Audience insights',exact:true}).click();await page.screenshot({animations:'disabled',path:join(out,'live-audience-review.png')});
  await page.getByLabel('I reviewed the selected statements, inferred insights, and pricing conditions.').check();await page.getByRole('button',{name:'Save & compare',exact:true}).click();await page.getByRole('heading',{name:'Competitive matrix',exact:true}).waitFor();
  const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('competitorlens.v1'))),project=state.projects[0];assert.equal(project.competitors.length,3);assert.equal(project.researchHistory.length,1);
  assert.ok(project.competitors.every(c=>!c.audiences.some(a=>/cookie banners|an account|tracking e-commerce/i.test(a))));
  for(const c of project.competitors){assert.ok(c.sources.length>0,`${c.name} has collected pages`);assert.ok(c.researchFindings.length>0,`${c.name} has findings`);assert.ok(c.audiences.length>0,`${c.name} has audience proposals`);for(const f of c.researchFindings)assert.ok(c.sources.find(s=>s.id===f.sourceId)?.excerpt.includes(f.quote),'Exact quotation retained');}
  for(const [name,slug] of [['Competitive Matrix','matrix'],['Overview','overview'],['Competitors','competitors'],['Audience Analysis','audiences'],['Opportunities','opportunities'],['Reports','reports']]){await go(name);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,name);await page.screenshot({animations:'disabled',path:join(out,`live-${slug}-desktop.png`)});}
  const reportPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Export HTML',exact:true}).click();const report=await reportPromise;await report.saveAs(join(out,'live-report.html'));await page.pdf({path:join(out,'live-report.pdf'),format:'A4',printBackground:true});
  await go('Data Management');const backupPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Download full backup',exact:true}).click();const backup=await backupPromise;await backup.saveAs(join(out,'live-backup.json'));
  await page.getByLabel('Restore backup file').setInputFiles(join(out,'live-backup.json'));await page.getByRole('button',{name:'Replace workspace',exact:true}).click();assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('competitorlens.v1'))),state);
  await page.reload();await page.getByRole('button',{name:'Resume Recent Project',exact:true}).click();assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('competitorlens.v1'))),state);assert.deepEqual(errors,[]);
  const summary={version:'1.5',analysisEngine:'rule-based',paidProviderCalled:false,testedAt:new Date().toISOString(),competitors:project.competitors.map(c=>({name:c.name,url:c.url,pages:c.sources.length,findings:c.researchFindings.length,audiences:c.audiences,audienceInsights:c.audienceResearch.filter(a=>a.needs||a.motivations).length,sourceUrls:c.sources.map(s=>s.url)})),failures:project.researchHistory[0].events.filter(e=>e.status==='failed'),restoredAndReloaded:true,consoleErrors:errors};
  for(const width of [768,390,320]){await page.setViewportSize({width,height:width===768?1024:width===390?844:720});for(const [name,slug] of [['Overview','overview'],['Competitors','competitors'],['Audience Analysis','audiences'],['Competitive Matrix','matrix'],['Opportunities','opportunities'],['Reports','reports']]){await go(name);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,name+' '+width);await page.screenshot({path:join(out,`live-${slug}-${width}.png`),animations:'disabled'});}}
  assert.deepEqual(errors,[]);await writeFile(join(out,'live-acceptance.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2));await context.close();
}finally{await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
