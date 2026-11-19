import { blankCompetitor, safeURL, splitList, assertCompetitor, uid, FIELD_LABELS, validateBackup } from './model.js';
export const CSV_COLUMNS = ['name','url','positioning','products','pricing','price_amount','currency','price_unit','features','audiences','needs','motivations','interests','behavior','notes','breadth','tier','source_title','source_url','source_excerpt','source_fields','demo','audience_research','sources_json','price_note_review','research_findings','advantages'];
export function parseCSV(text) {
  if(text.length > 2_000_000) throw new Error('CSV files must be smaller than 2 MB.');
  text=text.replace(/^\uFEFF/,'');
  let rows=[],row=[],cell='',quoted=false,afterQuote=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(quoted){ if(ch==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;afterQuote=true;}}else cell+=ch; continue; }
    if(afterQuote && ch!==',' && ch!=='\r' && ch!=='\n') throw new Error('Unexpected text after a quoted CSV value.');
    if(ch==='"'){if(cell)throw new Error('Quotes inside CSV values must be doubled.');quoted=true;}
    else if(ch===','){row.push(cell);cell='';afterQuote=false;}
    else if(ch==='\r'||ch==='\n'){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell='';afterQuote=false;}
    else cell+=ch;
  }
  if(quoted)throw new Error('A quoted CSV value is missing its closing quote.');
  row.push(cell); if(row.some(x=>x.trim()))rows.push(row);
  if(rows.length<2)throw new Error('Add a header row and at least one competitor row.');
  const headers=rows.shift().map(h=>h.trim().toLowerCase());
  if(new Set(headers).size!==headers.length)throw new Error('CSV headers must be unique.');
  if(!headers.includes('name')&&!headers.includes('url'))throw new Error('The CSV needs a name or url column.');
  return rows.map((r,i)=>{if(r.length!==headers.length)throw new Error(`Row ${i+2} has ${r.length} values; expected ${headers.length}.`);return Object.fromEntries(headers.map((h,j)=>[h,r[j]]));});
}
export function importRows(rows,existing=[]) {
  if(existing.length+rows.length>5)throw new Error(`A project supports up to 5 competitors. There are ${5-existing.length} slots available.`);
  const result=[];
  rows.forEach((r,i)=>{
    try{
      const c=blankCompetitor();
      for(const k of ['name','positioning','products','pricing','currency','needs','motivations','interests','behavior','notes','advantages'])if(r[k])c[k]=r[k].trim();
      c.url=safeURL(r.url); if(!c.name&&c.url)c.name=new URL(c.url).hostname.replace(/^www\./,'');
      c.priceAmount=r.price_amount?.trim()||''; c.priceUnit=r.price_unit?.trim()||'unit'; c.breadth=r.breadth?.trim()||'';c.tier=r.tier?.trim()||'';
      c.features=splitList(r.features);c.audiences=splitList(r.audiences); c.demo=/^(true|yes|1)$/i.test(r.demo||'');
      if(c.features.length>30||c.audiences.length>30)throw new Error('Use no more than 30 features or audiences.');
      if(splitList(r.source_fields).some(f=>!Object.hasOwn(FIELD_LABELS,f)))throw new Error('Source fields contain an unsupported field key. Use the documented field names.');
      if(r.source_excerpt?.trim())c.sources=[{id:uid(),title:r.source_title?.trim()||'Imported research note',url:safeURL(r.source_url),excerpt:r.source_excerpt.trim(),kind:c.demo?'Demo':r.source_url?'User-supplied excerpt':'Manual note',method:c.demo?'demo':r.source_url?'pasted':'manual',segmentMappings:[],collectedAt:new Date().toISOString(),fields:splitList(r.source_fields).filter(f=>Object.hasOwn(FIELD_LABELS,f))}];
      if (!r.sources_json && !r.source_excerpt?.trim() && [r.source_title,r.source_url,r.source_fields].some(v=>v?.trim())) throw new Error('Source metadata needs an excerpt. Complete or clear all source columns.');
      if(r.audience_research?.trim()) c.audienceResearch=JSON.parse(r.audience_research);
      if(r.sources_json?.trim()) c.sources=JSON.parse(r.sources_json);
      if(r.price_note_review?.trim()) c.priceNoteReview=JSON.parse(r.price_note_review);
      if(r.research_findings?.trim()) c.researchFindings=JSON.parse(r.research_findings);
      assertCompetitor(c,[...existing,...result],true);
      const validated=validateBackup({version:2,activeId:'csv',projects:[{id:'csv',name:'CSV review',createdAt:'',competitors:[c],opportunityState:{}}]}).projects[0].competitors[0];
      result.push(validated);
    }catch(e){throw new Error(`Row ${i+2}: ${e.message}`);}
  });return result;
}
// Neutralize spreadsheet formulas on export, including formulas hidden by whitespace.
export function csvCell(value){let s=String(value??'');if(/^[\s]*[=+@-]/.test(s)||/^[\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
export function exportCSV(cs){return '\uFEFF'+[CSV_COLUMNS,...cs.map(c=>{
  const s=c.sources[0];return [c.name,c.url,c.positioning,c.products,c.pricing,c.priceAmount,c.currency,c.priceUnit,c.features.join('|'),c.audiences.join('|'),c.needs,c.motivations,c.interests,c.behavior,c.notes,c.breadth,c.tier,s?.title||'',s?.url||'',s?.excerpt||'',s?.fields.join('|')||'',c.demo,JSON.stringify(c.audienceResearch||[]),JSON.stringify(c.sources),JSON.stringify(c.priceNoteReview||null),JSON.stringify(c.researchFindings||[]),c.advantages||''];
})].map(row=>row.map(csvCell).join(',')).join('\r\n');}
export function download(name,content,type='text/plain;charset=utf-8') {const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export const escapeHTML = text => String(text??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
export function extractPage(html,url){
  const doc=new DOMParser().parseFromString(html,'text/html');
  doc.querySelectorAll('script,style,iframe,object,embed,svg,link,img,video,audio,source').forEach(x=>x.remove());
  const title=(doc.querySelector('title')?.textContent||new URL(url).hostname).trim();
  const description=doc.querySelector('meta[name="description"],meta[property="og:description"]')?.getAttribute('content')||'';
  const text=(doc.body?.textContent||'').replace(/\s+/g,' ').trim().slice(0,12000);
  return {title:title.slice(0,300),excerpt:[description,text].filter(Boolean).join('\n\n').slice(0,16000)};
}
export async function fetchPublicPage(url){
  const safe=safeURL(url),u=new URL(safe);
  if(/(^|\.)(localhost|local|internal)$|\.example$/.test(u.hostname)||/^\d+\.\d+\.\d+\.\d+$/.test(u.hostname)||u.hostname.includes(':'))throw new Error('Use a real public website. Demo domains and local network addresses are not fetched.');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  try{
    const res=await fetch(safe,{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer',redirect:'error',mode:'cors'});
    if(!res.ok)throw new Error(`The website returned HTTP ${res.status}.`);
    if(!/text\/html|text\/plain/i.test(res.headers.get('content-type')||''))throw new Error('This URL does not return a readable web page.');
    if(Number(res.headers.get('content-length'))>2_000_000)throw new Error('This page is too large. Paste a relevant excerpt instead.');
    const reader=res.body.getReader();let size=0,parts=[];
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2_000_000){await reader.cancel();throw new Error('This page is too large. Paste a relevant excerpt instead.');}parts.push(value);}
    const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}
    return extractPage(new TextDecoder().decode(bytes),safe);
  }finally{clearTimeout(timer);}
}
