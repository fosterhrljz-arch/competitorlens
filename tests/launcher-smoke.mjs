import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';
import { strict as assert } from 'node:assert';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
const root=process.env.CL_LAUNCH_ROOT||fileURLToPath(new URL('../',import.meta.url)),origin='http://127.0.0.1:4184';
let occupied=false;try{await fetch(origin+'/api/health',{signal:AbortSignal.timeout(1000)});occupied=true;}catch{}
if(occupied)throw new Error('Port 4184 is already occupied. This smoke test will not stop another service.');
const vaultDirectory=await mkdtemp(resolve(tmpdir(),'cl-launcher-v15-'));
const launcher=spawn(resolve(root,'CompetitorLens.exe'),[],{cwd:root,windowsHide:true,env:{...process.env,CL_NO_BROWSER:'1',CL_TEST_DATA_DIR:vaultDirectory},stdio:'ignore'});
let browser;
try{
  let status;for(let i=0;i<30;i++){try{status=await(await fetch(origin+'/api/health',{signal:AbortSignal.timeout(1000)})).json();break;}catch{await new Promise(r=>setTimeout(r,200));}}
  assert.equal(status?.version,'1.5');browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage();await page.goto(origin);
  assert.equal(await page.getByRole('button',{name:'New Project',exact:true}).isVisible(),true);assert.equal(await page.getByRole('button',{name:'Resume Recent Project',exact:true}).isDisabled(),true);
  await page.getByRole('button',{name:'New Project',exact:true}).click();await page.getByLabel('Project name *').fill('Launcher smoke');await page.getByRole('button',{name:'Create project',exact:true}).click();await page.locator('.sidebar').getByRole('button',{name:'Automated Research',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Collect & analyze websites',exact:true}).isEnabled(),true);
  await page.locator('.sidebar').getByRole('button',{name:'AI Settings',exact:true}).click();await page.getByText('No credential configured.',{exact:true}).waitFor();assert.equal(await page.getByText('Windows DPAPI',{exact:true}).isVisible(),true);
  const stopped=await page.evaluate(async()=>{const s=window.__COMPETITORLENS_SERVICE__;return(await fetch(s.origin+'/api/stop',{method:'POST',headers:{'X-CompetitorLens-Token':s.token}})).ok;});assert.equal(stopped,true);console.log('Native CompetitorLens.exe -> bundled Node -> local app -> new project -> collection ready -> isolated AI vault -> clean shutdown: PASS. Default browser launch was suppressed for isolated QA.');
}finally{if(browser)await browser.close();launcher.unref();}
