// Real file:// launch, using a fresh isolated browser profile.
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve,join} from 'node:path';
import {mkdir} from 'node:fs/promises';
const root=process.env.CL_LAUNCH_ROOT||fileURLToPath(new URL('../',import.meta.url));
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage(),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
 await page.goto(pathToFileURL(resolve(root,'CompetitorLens.html')).href);
 await page.getByRole('button',{name:'New Project',exact:true}).click();await page.getByLabel('Project name *').fill('Portable V1.5 smoke');await page.getByRole('button',{name:'Create project',exact:true}).click();
 await page.locator('.sidebar').getByRole('button',{name:'Competitors',exact:true}).click();await page.getByRole('button',{name:'Add competitor',exact:true}).click();await page.getByLabel('Competitor name',{exact:true}).fill('Manual portable record');await page.getByRole('button',{name:'Save competitor',exact:true}).click();
 await page.locator('.language-switcher select').selectOption('zh-CN');await page.reload();assert.equal(await page.locator('html').getAttribute('lang'),'zh-CN');await page.getByRole('button',{name:'继续最近项目',exact:true}).click();
 const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('competitorlens.v1')));assert.equal(state.projects[0].competitors[0].name,'Manual portable record');
 await page.locator('.sidebar').getByRole('button',{name:'AI 设置',exact:true}).click();assert.equal(await page.getByText('独立手动模式',{exact:true}).isVisible(),true);
 if(process.env.CL_QA_DIR){await mkdir(process.env.CL_QA_DIR,{recursive:true});await page.screenshot({path:join(process.env.CL_QA_DIR,'portable-file-mode-zh.png')});}
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);console.log('Portable file:// launch, manual record, verified save/reload, persistent Chinese UI, offline AI notice, and no network requests: PASS.');
}finally{await browser.close();}
