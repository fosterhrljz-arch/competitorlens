export const AI_FIELDS=['positioning','products','pricing','features','advantages','audiences','needs','motivations','interests','behavior','notes'];
const text={type:'string'}, enumOf=values=>({type:'string',enum:values});
const object=(properties)=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
export const INTELLIGENCE_SCHEMA=object({
  findings:{type:'array',items:object({competitorUrl:text,field:enumOf(AI_FIELDS),text,segment:text,kind:enumOf(['statement','inference']),confidence:enumOf(['high','medium','low']),reason:text,sourceId:text,quote:text})},
  opportunities:{type:'array',items:object({title:text,audience:text,comparison:text,recommendation:text,validation:text,confidence:enumOf(['medium','low']),evidence:{type:'array',items:object({competitorUrl:text,sourceId:text,quote:text})}})}
});
const plain=v=>v&&typeof v==='object'&&!Array.isArray(v);
const str=(v,max,label)=>{if(typeof v!=='string'||!v.trim()||v.length>max)throw new Error(`AI response has invalid ${label}.`);return v.trim();};
const exactKeys=(value,keys)=>{if(!plain(value)||Object.keys(value).some(k=>!keys.includes(k))||keys.some(k=>!Object.hasOwn(value,k)))throw new Error('AI response does not match the required JSON schema.');};
export function prepareAIInput(results) {
  if(!Array.isArray(results)||!results.length||results.length>5)throw new Error('AI analysis supports one to five competitors.');
  let remaining=120000,total=0,retained=0;
  const competitors=results.filter(r=>r.include!==false).map(r=>({url:r.url,name:r.name,sources:r.pages.map(p=>{const s=p.source;total+=s.excerpt.length;const excerpt=s.excerpt.slice(0,Math.min(6000,remaining));remaining-=excerpt.length;retained+=excerpt.length;return {id:s.id,url:s.url,title:s.title,excerpt};}).filter(s=>s.excerpt.length>=12)})).filter(c=>c.sources.length);
  if(!competitors.length)throw new Error('Collect or import source content before AI analysis.');
  return {competitors,coverage:{charactersSent:retained,charactersAvailable:total,truncated:retained<total,sourcesSent:competitors.reduce((n,c)=>n+c.sources.length,0)}};
}
export function validateIntelligence(value,input) {
  exactKeys(value,['findings','opportunities']);
  if(!Array.isArray(value.findings)||value.findings.length>150||!Array.isArray(value.opportunities)||value.opportunities.length>8)throw new Error('AI response exceeds the finding or opportunity limit.');
  const sourceFor=e=>{const c=input.competitors.find(c=>c.url===e.competitorUrl),s=c?.sources.find(s=>s.id===e.sourceId);if(!s||typeof e.quote!=='string'||e.quote.length<8||e.quote.length>1600||!s.excerpt.includes(e.quote))throw new Error('AI evidence must reference a submitted source and an exact quotation.');return s;};
  const findings=value.findings.map(f=>{
    exactKeys(f,['competitorUrl','field','text','segment','kind','confidence','reason','sourceId','quote']);sourceFor(f);
    if(!AI_FIELDS.includes(f.field)||!['statement','inference'].includes(f.kind)||!['high','medium','low'].includes(f.confidence))throw new Error('AI finding classification is unsupported.');
    const value=str(f.text,['features','audiences'].includes(f.field)?200:1600,'finding text');
    if(typeof f.segment!=='string'||f.segment.length>200||(f.segment&&!['needs','motivations','interests','behavior'].includes(f.field)))throw new Error('AI audience scope is invalid.');
    const numbers=value.match(/\d+(?:[.,]\d+)*%?/g)||[];if(numbers.some(n=>!f.quote.includes(n)))throw new Error('AI numerical claims must appear in their exact supporting quotation.');
    const direct=f.kind==='statement'&&value===f.quote.trim();
    return {...f,text:value,reason:str(f.reason,1000,'confidence explanation'),kind:direct?'statement':'inference',confidence:direct?f.confidence:f.confidence==='high'?'medium':f.confidence};
  });
  const opportunities=value.opportunities.map(o=>{
    exactKeys(o,['title','audience','comparison','recommendation','validation','confidence','evidence']);
    if(!['medium','low'].includes(o.confidence)||!Array.isArray(o.evidence)||o.evidence.length>10||!o.evidence.length)throw new Error('AI opportunity needs supporting evidence.');
    const evidence=o.evidence.map(e=>{exactKeys(e,['competitorUrl','sourceId','quote']);sourceFor(e);return {...e};});
    if(input.competitors.length>1&&new Set(evidence.map(e=>e.competitorUrl)).size<2)throw new Error('A comparative AI opportunity needs evidence from at least two competitors.');
    const comparisonNumbers=(String(o.title)+' '+String(o.comparison)).match(/\d+(?:[.,]\d+)*%?/g)||[];
    if(comparisonNumbers.some(n=>!evidence.some(e=>e.quote.includes(n))))throw new Error('AI numerical claims must appear in their exact supporting quotation.');
    return {title:str(o.title,200,'opportunity title'),audience:str(o.audience,200,'target audience'),comparison:str(o.comparison,1600,'comparison'),recommendation:str(o.recommendation,1600,'recommendation'),validation:str(o.validation,1600,'validation action'),confidence:o.confidence,evidence};
  });
  return {findings,opportunities};
}
