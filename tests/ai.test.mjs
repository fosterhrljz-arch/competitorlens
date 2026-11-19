import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import http from 'node:http';
import { createVault } from '../service/vault.mjs';
import { createAIClient, providerRequest } from '../service/ai.mjs';
import { DEFAULT_AI_CONFIG, validateAIConfig } from '../service/ai-config.mjs';
import { prepareAIInput, validateIntelligence } from '../src/lib/aiSchema.js';
import { persistVerified, storageCapacity } from '../src/lib/storage.js';
import { startServer } from '../service/server.mjs';

const quote='Agencies need shared reports and API exports.';
export const input={competitors:[{url:'https://atlas.example.com/',name:'Atlas',sources:[{id:'s1',url:'https://atlas.example.com/',title:'Home',excerpt:quote}]}],coverage:{charactersSent:quote.length,charactersAvailable:quote.length,truncated:false,sourcesSent:1}};
export const finding={competitorUrl:input.competitors[0].url,field:'needs',text:'Potential need for shared reporting',segment:'Agencies',kind:'inference',confidence:'medium',reason:'Website copy associates reports with agencies; validate customer needs.',sourceId:'s1',quote};
const envelope=(content,extra={})=>({status:200,headers:{},text:JSON.stringify({choices:[{message:{content:JSON.stringify(content)},finish_reason:'stop'}],usage:{prompt_tokens:100,completion_tokens:50,total_tokens:150},...extra})});
async function vault(config={}){const v=await createVault({sessionOnly:true});await v.save({config:{...DEFAULT_AI_CONFIG,model:'fixture-model',...config},apiKey:'fixture-secret-not-real'});return v;}

test('AI schema enforces exact submitted sources, original quotes, numerical claims and inference labels',()=>{
  const output=validateIntelligence({findings:[{...finding,kind:'statement',confidence:'high'}],opportunities:[]},input);
  assert.equal(output.findings[0].kind,'inference');assert.equal(output.findings[0].confidence,'medium');
  for(const patch of [{quote:'Unsupported source quotation'},{sourceId:'unknown'},{text:'87% of agencies buy this product'},{field:'traffic'},{extra:'unknown'},{segment:34}])assert.throws(()=>validateIntelligence({findings:[{...finding,...patch}],opportunities:[]},input));
  assert.throws(()=>validateIntelligence({findings:[],opportunities:[],extra:true},input),/schema/);
  const zh='专为中小企业提供共享报告，帮助团队快速导出数据。',i=structuredClone(input);i.competitors[0].sources[0].excerpt=zh;
  const chinese=validateIntelligence({findings:[{...finding,text:'中小企业可能需要共享报告',segment:'中小企业',quote:zh,reason:'该段明确描述中小企业的使用场景。'}],opportunities:[]},i);
  assert.equal(chinese.findings[0].quote,zh);
});
test('Comparative opportunities require exact evidence from distinct competitors',()=>{
  const second={...input.competitors[0],url:'https://beacon.example.com/'};const i={...input,competitors:[...input.competitors,second]};
  const o={title:'Test shared reporting onboarding',audience:'Agencies',comparison:'Compare the documented export workflows.',recommendation:'Prototype a guided export workflow.',validation:'Interview users of both tools.',confidence:'low',evidence:[{competitorUrl:finding.competitorUrl,sourceId:'s1',quote}]};
  assert.throws(()=>validateIntelligence({findings:[],opportunities:[o]},i),/two competitors/);
  o.evidence.push({competitorUrl:second.url,sourceId:'s1',quote});assert.equal(validateIntelligence({findings:[],opportunities:[o]},i).opportunities.length,1);
  assert.throws(()=>validateIntelligence({findings:[],opportunities:[{...o,comparison:'87% of agencies are underserved.'}]},i),/numerical claims/);
});
test('AI input limits disclose truncation and exclude unselected competitors',()=>{
  const r={url:finding.competitorUrl,name:'Atlas',pages:[{source:{id:'s',title:'Home',url:finding.competitorUrl,excerpt:'A'.repeat(7000)}}]};const p=prepareAIInput([r,{...r,include:false}]);
  assert.equal(p.competitors.length,1);assert.equal(p.coverage.charactersSent,6000);assert.equal(p.coverage.truncated,true);
});
test('Provider settings reject credentials in URLs and unsafe endpoints',()=>{
  for(const baseURL of ['http://api.example.com/v1','https://secret@api.example.com','https://api.example.com?key=secret','http://127.0.0.1:4184'])assert.throws(()=>validateAIConfig({...DEFAULT_AI_CONFIG,baseURL}));
  assert.equal(validateAIConfig({...DEFAULT_AI_CONFIG,baseURL:'http://127.0.0.1:5000/v1',allowLocal:true}).allowLocal,true);
});
test('AI compatibility settings, retries, usage and secure failures are exercised through the client',async()=>{
  const v=await vault({temperature:'',tokenParameter:'omit',responseFormat:'json_object',outputLanguage:'zh-CN'}),seen=[];
  const c=createAIClient({vault:v,pause:async()=>{},transport:async(url,request)=>{seen.push(request);return seen.length===1?{status:429,headers:{},text:'fixture-secret-not-real'}:envelope({findings:[finding],opportunities:[]});}});
  const r=await c.analyze(input);assert.equal(r.usage.attempts,2);assert.equal(r.usage.totalTokens,150);assert.equal(r.outputLanguage,'zh-CN');assert.match(seen[1].body.messages[0].content,/Simplified Chinese/);assert.equal(seen[1].body.temperature,undefined);assert.equal(seen[1].body.max_tokens,undefined);
  for(const [response,code] of [[{status:401,text:'fixture-secret-not-real'},'credentials'],[{status:302,text:''},'redirect'],[{status:429,text:''},'rate_limit'],[{status:200,text:'bad JSON'},'malformed'],[envelope({findings:[{...finding,quote:'wrong quote'}],opportunities:[]}),'validation'],[envelope({}, {choices:[{finish_reason:'length',message:{content:'{}'}}]}),'truncated']]){
    const client=createAIClient({vault:v,pause:async()=>{},transport:async()=>response});await assert.rejects(client.analyze(input),e=>e.code===code&&!e.message.includes(v.secret()));
  }
});
test('AI cancellation and timeout retain explicit error codes',async()=>{
  const v=await vault({timeoutSeconds:5,retries:0}),transport=async(_url,{signal})=>new Promise((resolve,reject)=>{signal.addEventListener('abort',()=>reject(signal.reason),{once:true});});
  const c=createAIClient({vault:v,transport}),a=new AbortController(),pending=c.analyze(input,{signal:a.signal});a.abort();await assert.rejects(pending,e=>e.code==='cancelled');
  const keepAlive=setTimeout(()=>{},6000);try{await assert.rejects(c.analyze(input),e=>e.code==='timeout');}finally{clearTimeout(keepAlive);}
});
test('Actual HTTP provider transport performs JSON connection, model listing and analysis with a session-only key',async()=>{
  const seen=[];const server=http.createServer(async(req,res)=>{let body='';for await(const chunk of req)body+=chunk;seen.push({path:req.url,auth:req.headers.authorization,body});res.setHeader('Content-Type','application/json');if(req.url.endsWith('/models'))res.end(JSON.stringify({data:[{id:'fixture-model'}]}));else res.end(envelope(body.includes('connection_test')?{ok:true}:{findings:[finding],opportunities:[]}).text);});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{const v=await vault({baseURL:`http://127.0.0.1:${server.address().port}/v1`,allowLocal:true});const c=createAIClient({vault:v});assert.equal((await c.test()).connected,true);assert.deepEqual((await c.models()).models,['fixture-model']);assert.equal((await c.analyze(input)).findings.length,1);assert.ok(seen.every(s=>s.auth==='Bearer fixture-secret-not-real'));assert.ok(!JSON.stringify(v.status()).includes(v.secret()));}
  finally{await new Promise(resolve=>server.close(resolve));}
  await assert.rejects(providerRequest('http://127.0.0.1:4000/v1',{key:'x',signal:new AbortController().signal}),/Invalid/);
});
test('DPAPI vault round trip never writes plaintext and clears credentials when endpoint changes',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'competitorlens-v15-vault-'));
  try{const v=await createVault({directory});await v.save({config:{...DEFAULT_AI_CONFIG,model:'fixture-model'},apiKey:'fixture-secret-not-real',rememberKey:true});const disk=await readFile(join(directory,'ai-settings.json'),'utf8');assert.ok(!disk.includes('fixture-secret-not-real'));
    if(process.platform==='win32'){assert.equal(v.status().remembered,true);const reopened=await createVault({directory});assert.equal(reopened.secret(),'fixture-secret-not-real');}
    await v.save({config:{...v.status().config,baseURL:'https://other.example.com/v1'}});assert.equal(v.secret(),'');assert.equal(v.status().hasKey,false);
    await v.save({config:v.status().config,apiKey:'session-secret',rememberKey:false});assert.ok(!(await readFile(join(directory,'ai-settings.json'),'utf8')).includes('session-secret'));assert.equal(v.status().remembered,false);await v.forget();assert.equal(v.secret(),'');
  }finally{await rm(directory,{recursive:true,force:true});}
});
test('Protected settings cannot forward a credential after endpoint tampering',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'competitorlens-v15-bind-'));try{const protect=async(_mode,b)=>b;const v=await createVault({directory,protect});await v.save({config:DEFAULT_AI_CONFIG,apiKey:'not-real',rememberKey:true});const file=join(directory,'ai-settings.json'),disk=JSON.parse(await readFile(file,'utf8'));disk.config.baseURL='https://other.example.com/v1';await writeFile(file,JSON.stringify(disk));const reopened=await createVault({directory,protect});assert.equal(reopened.secret(),'');assert.ok(reopened.status().warning);}finally{await rm(directory,{recursive:true,force:true});}
});
test('Storage success requires matching read-back; capacity and quota failures remain explicit',()=>{
  let value;const good={setItem:(_k,v)=>{value=v;},getItem:()=>value};assert.ok(persistVerified(good,'x',{projects:[]}).verifiedAt);
  assert.throws(()=>persistVerified({setItem:()=>{},getItem:()=>null},'x',{}));assert.throws(()=>persistVerified({setItem:()=>{throw new Error('QuotaExceeded');}},'x',{}));assert.equal(storageCapacity({text:'x'.repeat(1600000)}).warning,true);
});
test('AI service endpoints require origin/token and never return the key',async()=>{
  const v=await vault(),server=await startServer({port:0,vault:v,aiClient:createAIClient({vault:v,transport:async()=>envelope({ok:true})})});
  try{const origin=`http://127.0.0.1:${server.address().port}`,html=await(await fetch(origin)).text(),token=html.match(/"token":"([a-f0-9]+)"/)[1],headers={Origin:origin,'X-CompetitorLens-Token':token};assert.equal((await fetch(origin+'/api/ai/status',{method:'POST',body:'{}'})).status,403);
    const status=await(await fetch(origin+'/api/ai/status',{method:'POST',headers,body:'{}'})).text();assert.ok(!status.includes(v.secret()));assert.equal(JSON.parse(status).hasKey,true);assert.equal((await(await fetch(origin+'/api/health')).json()).version,'1.5');assert.equal((await(await fetch(origin+'/api/health',{headers})).json()).authorized,true);assert.equal((await(await fetch(origin+'/api/health',{headers:{...headers,'X-CompetitorLens-Token':'expired'}})).json()).authorized,false);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
