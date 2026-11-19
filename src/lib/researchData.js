// Validation is independent of the parser so legacy backups need no browser APIs.
const fields=new Set(['positioning','products','pricing','features','audiences','needs','motivations','interests','behavior','notes','advantages']);
const text=(v,max=10000)=>{if(v==null)return '';if(typeof v!=='string'||v.length>max)throw new Error('Invalid or oversized automated research text.');return v;};
const list=(v,max,label)=>{if(!Array.isArray(v)||v.length>max)throw new Error(`Invalid ${label}.`);return v;};
export function validateFindings(value=[],sources=[]) {
  const ids=new Set();return list(value,1000,'research findings').map(f=>{
    if(!f||!fields.has(f.field)||!['statement','inference','analyst'].includes(f.kind)||!['high','medium','low'].includes(f.confidence))throw new Error('Invalid research finding classification.');
    const id=text(f.id,100);if(!id||ids.has(id))throw new Error('Research finding IDs must be unique.');ids.add(id);
    const out={id,field:f.field,text:text(f.text,1600),segment:text(f.segment,200),kind:f.kind,confidence:f.confidence,reason:text(f.reason,3000),sourceId:text(f.sourceId,100),quote:text(f.quote,1600),selected:f.selected===true,price:null};
    if(!out.text.trim()||!out.quote.trim()||!out.sourceId)throw new Error('Research findings require text and an evidence quotation.');
    const source=sources.find(s=>s.id===out.sourceId);if(source&&!source.excerpt.includes(out.quote))throw new Error('Research quotation does not match its saved source.');
    if(f.price){const amount=text(String(f.price.amount),100),currency=text(f.price.currency,10),unit=text(f.price.unit,100);if(!Number.isFinite(Number(amount))||Number(amount)<0||!unit||!/^[A-Z]{3}$/.test(currency))throw new Error('Invalid extracted price.');out.price={amount,currency,unit};}
    if(f.applyPrice!=null)out.applyPrice=f.applyPrice===true;
    for(const k of ['runId','reviewedAt'])if(f[k]!=null)out[k]=text(f[k],100);
    if(f.engine!=null)out.engine=text(f.engine,100);
    if(f.change){if(!['new','unchanged','modified','conflict'].includes(f.change.type)||!['append','replace','skip','pending'].includes(f.change.action))throw new Error('Invalid research update decision.');out.change={type:f.change.type,action:f.change.action,before:text(f.change.before,10000),after:text(f.change.after,1600)};}
    return out;
  });
}
export function validateResearchHistory(value=[],safeURL,validatePrevious) {
  const ids=new Set();return list(value,100,'research history').map(run=>{
    const id=text(run.id,100);if(!id||ids.has(id))throw new Error('Research run IDs must be unique.');ids.add(id);
    const results=list(run.results,5,'research results').map(result=>{
      const pages=list(result.pages,12,'collected pages').map(p=>{
        const s=p.source;if(!s||!['fetched','pasted'].includes(s.method))throw new Error('Invalid collected source method.');
        return {category:text(p.category,100),source:{id:text(s.id,100),title:text(s.title,300),url:safeURL(s.url),excerpt:text(s.excerpt,20000),kind:text(s.kind,100),method:s.method,collectedAt:text(s.collectedAt,100),fields:[],segmentMappings:[]}};
      });
      const findings=validateFindings(result.findings,pages.map(p=>p.source));
      if(findings.some(f=>!pages.some(p=>p.source.id===f.sourceId)))throw new Error('Historical findings need their collected source.');
      const reviewedPrice=result.reviewedPrice?Object.fromEntries(['amount','currency','unit','findingId','reason'].map(k=>[k,text(result.reviewedPrice[k],k==='reason'?3000:100)])):null;
      return {url:safeURL(result.url),name:text(result.name,100),competitorId:text(result.competitorId,100),include:result.include!==false,pages,findings,...(result.previousRecord&&validatePrevious?{previousRecord:validatePrevious(result.previousRecord)}:{}),...(reviewedPrice?{reviewedPrice}:{})};
    });
    const events=list(run.events||[],100,'research progress events').map(e=>({url:safeURL(e.url),category:text(e.category,100),status:text(e.status,100),message:text(e.message,3000),at:text(e.at,100)}));
    return {id,startedAt:text(run.startedAt,100),savedAt:text(run.savedAt,100),results,events,...(run.aiUsage?{aiUsage:validateUsage(run.aiUsage)}:{}),...(run.aiCoverage?{aiCoverage:validateCoverage(run.aiCoverage)}:{}),...(run.analysisMode?{analysisMode:text(run.analysisMode,30)}:{}),...(run.aiOpportunities?{aiOpportunities:validateAIOpportunities(run.aiOpportunities,safeURL)}:{})};
  });
}

export function validateUsage(value){
  const out={model:text(value.model,150)};
  for(const k of ['promptTokens','completionTokens','totalTokens','elapsedMs','attempts']){const n=value[k];if(n!==null&&(!Number.isFinite(n)||n<0))throw new Error('Invalid AI usage information.');out[k]=n;}
  return out;
}
export function validateAIOpportunities(value=[],safeURL){
  return list(value,500,'AI opportunities').map(o=>{
    if(!o||!['medium','low'].includes(o.confidence))throw new Error('Invalid AI opportunity confidence.');
    const out=Object.fromEntries(['id','title','audience','comparison','recommendation','validation'].map(k=>[k,text(o[k],k==='id'||k==='runId'?100:3000)]));
    for(const k of ['runId','researchSignature'])if(o[k]!=null)out[k]=text(o[k],k==='runId'?100:3000);
    out.confidence=o.confidence;out.selected=o.selected===true;
    out.evidence=list(o.evidence,10,'AI opportunity evidence').map(e=>({competitorUrl:safeURL(e.competitorUrl),sourceId:text(e.sourceId,100),quote:text(e.quote,1600)}));
    return out;
  });
}

function validateCoverage(v){const out={truncated:v.truncated===true};for(const k of ['charactersSent','charactersAvailable','sourcesSent']){if(!Number.isInteger(v[k])||v[k]<0)throw new Error('Invalid AI coverage information.');out[k]=v[k];}return out;}
