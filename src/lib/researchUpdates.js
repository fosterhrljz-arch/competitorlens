const key=v=>String(v||'').replace(/\s+/g,' ').trim().toLowerCase();
export function existingResearchValue(c,f){
  if(!c)return '';
  if(['features','audiences'].includes(f.field))return c[f.field].join(' | ');
  return f.segment?c.audienceResearch?.find(a=>key(a.label)===key(f.segment))?.[f.field]||'':c[f.field]||'';
}
export function findingChange(c,f){
  const before=existingResearchValue(c,f),after=f.text;
  const existing=['features','audiences'].includes(f.field)?(c?.[f.field]||[]).some(v=>key(v)===key(after)):before.includes(after);
  const type=existing?'unchanged':!before||['features','audiences'].includes(f.field)?'new':f.field==='pricing'?'conflict':'modified';
  return {type,before,after,action:type==='unchanged'?'skip':type==='new'?'append':'pending'};
}
export function reviewResearchChanges(project,result){
  const host=url=>{try{return new URL(url).hostname.replace(/^www\./,'');}catch{return '';}};
  const c=project.competitors.find(c=>host(c.url)&&host(c.url)===host(result.url));
  return {...result,findings:result.findings.map(f=>({...f,change:f.change&&f.change.after===f.text?f.change:findingChange(c,f)}))};
}
export function approveChanges(result,action='append'){
  return {...result,findings:result.findings.map(f=>f.change?.action==='pending'?{...f,change:{...f.change,action}}:f)};
}
