import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeWebsite,applyResearch} from '../src/lib/automatedResearch.js';
import {findingChange,reviewResearchChanges,approveChanges} from '../src/lib/researchUpdates.js';
import {blankCompetitor,prepareProject,validateBackup,opportunities,changeOpportunity} from '../src/lib/model.js';
import {reportHTML} from '../src/lib/report.js';
import {createT,setLanguage,getLanguage} from '../src/lib/i18n.js';
import {realWorkspace} from './fixtures.mjs';
const source=(id,quote)=>({id,title:'Original source',url:'https://atlas.example.com/',excerpt:quote,kind:'Public page',method:'fetched',collectedAt:'2026-11-12',fields:[],segmentMappings:[]});
const finding=(id,text,field='products')=>({id,field,text,segment:'',kind:'statement',confidence:'high',reason:'Exact website statement.',sourceId:'s',quote:text,selected:true,price:null});
test('Update classifications preserve unknowns, distinguish new/modified/conflicting claims, and require a decision',()=>{
 const c={...blankCompetitor(),name:'Atlas',url:'https://atlas.example.com/',products:'Old description.',pricing:'USD 12 per month.',features:['Export']};
 assert.equal(findingChange(c,finding('f','New description.')).type,'modified');assert.equal(findingChange(c,finding('f','USD 19 per month.','pricing')).type,'conflict');assert.equal(findingChange(c,finding('f','Export','features')).action,'skip');assert.equal(findingChange(c,finding('f','API','features')).action,'append');
 const project=prepareProject({id:'p',name:'Updates',createdAt:'',competitors:[c]}),result=reviewResearchChanges(project,{url:c.url,name:c.name,pages:[{category:'Home',source:source('s','New description. Another new description.')}],findings:[finding('f','New description.'),finding('f2','Another new description.')]});
 const run={id:'update-1',startedAt:'2026-11-12',events:[],results:[result]};assert.throws(()=>applyResearch(project,run),/Review modified/);assert.equal(project.competitors[0].products,'Old description.');
 const next=applyResearch(project,{...run,results:[approveChanges(result,'replace')]});assert.equal(next.competitors[0].products,'New description.\n\nAnother new description.');assert.equal(next.researchHistory[0].results[0].previousRecord.products,'Old description.');assert.equal(next.competitors[0].pricing,'USD 12 per month.');assert.equal(next.competitors[0].features[0],'Export');
 const state=validateBackup({version:4,activeId:'p',projects:[next]});assert.deepEqual(validateBackup(JSON.parse(JSON.stringify(state))),state);
 const unchanged=reviewResearchChanges(project,{url:c.url,findings:[finding('edited','Old description.')]});assert.equal(unchanged.findings[0].change.action,'skip');unchanged.findings[0].text='Edited description.';
 const edited=reviewResearchChanges(project,unchanged).findings[0];assert.equal(edited.change.type,'modified');assert.equal(edited.change.action,'pending');
});
test('Chinese offline rules associate needs with the named audience and retain original quotes',()=>{
 const blocks=['面向中小企业的数据分析平台','专为中小企业提供共享报告，帮助团队快速导出数据。','我们提供隐私保护、团队协作和数据导出。'];const page={category:'Home',brand:'中文平台',headings:[blocks[0]],blocks,offers:[],source:source('zh',blocks.join('\n'))};const result=analyzeWebsite(page.source.url,[page]);assert.ok(result.findings.some(f=>f.field==='audiences'&&f.text==='中小企业'));assert.ok(result.findings.some(f=>f.field==='needs'&&f.segment==='中小企业'));for(const f of result.findings)assert.ok(page.source.excerpt.includes(f.quote));
});
test('Schema 1–3 migration preserves records, source quotes, validated notes and research metadata',()=>{
 for(const version of [1,2,3]){let p=realWorkspace().projects[0];p=changeOpportunity(p,opportunities(p)[0].id,{status:'Validated',note:'原始验证笔记 / keep every word'});const previous=JSON.stringify(p.competitors),state=validateBackup({version,activeId:p.id,projects:[p]});assert.equal(state.version,4);assert.equal(JSON.stringify(state.projects[0].competitors),previous);assert.ok(state.projects[0].opportunityHistory.some(o=>o.note==='原始验证笔记 / keep every word'));}
});
test('Report language and detail are independent; original evidence and project data are unchanged',()=>{
 const p=realWorkspace().projects[0],before=JSON.stringify(p);const quote=p.competitors[0].sources[0].excerpt,cn=reportHTML(p,{language:'zh-CN',mode:'detailed'}),en=reportHTML(p,{language:'en-US',mode:'concise'});
 for(const h of ['执行摘要','竞争对手概览','受众情报','竞争比较','市场机会','证据附录'])assert.ok(cn.includes(h),h);assert.match(cn,/lang="zh-CN"/);assert.ok(cn.includes(quote));assert.match(en,/Executive Summary/);assert.ok(reportHTML(p,{language:'en-US',mode:'detailed'}).length>en.length);assert.equal(JSON.stringify(p),before);
 setLanguage('zh-CN');assert.equal(getLanguage(),'zh-CN');assert.equal(createT('en-US')('AI Settings'),'AI Settings');assert.equal(createT('zh-CN')('AI Settings'),'AI 设置');assert.match(createT('zh-CN')('3 of 5 project records'),/5.*3/);setLanguage('en-US');
});
