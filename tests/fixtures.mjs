import { blankCompetitor, ensureAudienceResearch, prepareProject } from '../src/lib/model.js';
export function realWorkspace() {
  const labels=[['Small studios','Solo creators'],['Small studios','Agencies'],['Agencies','Office teams']];
  const names=['Northstar Studio','Canvas Works','Team Harbor'];
  const competitors=names.map((name,i)=>{
    const c=ensureAudienceResearch({...blankCompetitor(),id:`record-${i}`,name,url:`https://research-${i}.example/`,positioning:`Tools for ${labels[i][0].toLowerCase()}.`,products:i<2?'Monthly subscription workspace':'One-time team toolkit',priceAmount:i*12,currency:'USD',priceUnit:'month',pricing:`USD ${i*12} per month`,features:['Shared workspace',i<2?'Subscription':'One-time purchase'],audiences:labels[i],needs:`General note for ${name}; not audience-specific.`,motivations:'Preserved competitor-wide motivation.',breadth:i+2,tier:i+1,updatedAt:'2026-11-12T12:00:00Z'});
    c.audienceResearch=c.audienceResearch.map((a,j)=>({...a,needs:j?'Personal setup and clear limits.':`Coordinate work for ${a.label.toLowerCase()}.`,motivations:j?'Maintain individual control.':'Reduce team administration.',interests:j?'Personal templates':'Collaboration',behavior:'Analyst hypothesis; observed purchases are not available.'}));
    c.sources=[{id:`source-${i}`,title:`${name} research`,url:i===2?'':`https://research-${i}.example/pricing`,excerpt:i<2?'A monthly subscription workspace is offered. No customer purchase rates are provided.':'A participant requested simpler team administration.',kind:i===0?'User-supplied excerpt':i===1?'Fetched page text':'Manual note',method:['pasted','fetched','manual'][i],collectedAt:'2026-11-12T12:00:00Z',fields:['products','pricing','features'],segmentMappings:c.audienceResearch.map(a=>({segmentId:a.id,fields:['audiences','needs']}))}];
    return c;
  });
  const p=prepareProject({id:'real-research',name:'Creative tools research',industry:'Small business software',demo:false,createdAt:'2026-11-12T12:00:00Z',updatedAt:'2026-11-12T12:00:00Z',competitors,opportunityState:{}});
  return {version:2,activeId:p.id,projects:[p]};
}
