import { useSyncExternalStore } from 'react';
let state={status:typeof window!=='undefined'&&window.__COMPETITORLENS_SERVICE__?'checking':'manual',checkedAt:''};
const listeners=new Set();let timer=null,checking=false;
const notify=()=>listeners.forEach(fn=>fn());
export async function checkService(){
  const service=window.__COMPETITORLENS_SERVICE__;if(!service||checking)return;
  checking=true;try{const response=await fetch(service.origin+'/api/health',{signal:AbortSignal.timeout(4000),headers:{'X-CompetitorLens-Token':service.token}});const value=await response.json();state={status:response.ok&&value.app==='CompetitorLens'&&value.version==='1.5'&&value.authorized!==false?'online':'offline',checkedAt:new Date().toISOString()};}catch{state={status:'offline',checkedAt:new Date().toISOString()};}finally{checking=false;notify();}
}
function subscribe(fn){listeners.add(fn);if(listeners.size===1&&typeof window!=='undefined'&&window.__COMPETITORLENS_SERVICE__){checkService();timer=setInterval(checkService,10000);window.addEventListener('focus',checkService);}return()=>{listeners.delete(fn);if(!listeners.size){clearInterval(timer);window.removeEventListener('focus',checkService);}};}
export function useLocalService(){return useSyncExternalStore(subscribe,()=>state,()=>({status:'manual',checkedAt:''}));}
export async function serviceRequest(path,body={},signal){
  const service=window.__COMPETITORLENS_SERVICE__;if(!service)throw new Error('Open CompetitorLens.exe to use the local research and AI service. Manual analysis remains available.');
  let response;try{response=await fetch(service.origin+path,{method:'POST',signal,headers:{'Content-Type':'application/json','X-CompetitorLens-Token':service.token},body:JSON.stringify(body)});}catch(e){if(e.name==='AbortError')throw e;checkService();throw new Error('The local service is unavailable. Reopen CompetitorLens.exe, then retry. Your draft is preserved.');}
  let value;try{value=await response.json();}catch{throw new Error('The local service returned an unreadable response.');}
  if(!response.ok){const e=new Error(value.error||'The local service request failed.');e.code=value.code;e.usage=value.usage;throw e;}return value;
}
