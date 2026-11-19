import http from 'node:http';
import https from 'node:https';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';

export const USER_AGENT = 'CompetitorLens/1.5 (public website research; no cookies)';
export function collectionErrorMessage(error) {
  if(error.name==='AbortError')return 'Collection cancelled.';
  if(error.name==='TimeoutError'||error.code==='ETIMEDOUT')return 'Website request timed out. Retry or import its text manually.';
  if(['ENOTFOUND','EAI_AGAIN'].includes(error.code))return 'The website address could not be resolved. Check the URL, retry, or import its text manually.';
  if(error.code&&(/TLS|CERT|SSL/.test(error.code)||['ECONNRESET','ECONNREFUSED','EHOSTUNREACH','ENETUNREACH'].includes(error.code)))return 'The website connection failed or was blocked. Retry this page or import its text manually.';
  return error.message||'Unable to collect this page.';
}
export function publicAddress(address) {
  if (isIP(address) === 4) {
    const [a,b,c] = address.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 168 || b === 0 || (b === 88 && c === 99))) || (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) || (a === 203 && b === 0 && c === 113));
  }
  // Accept global IPv6 only; exclude documentation, transition and mapped addresses.
  if (isIP(address) === 6) return /^[23][0-9a-f]{3}:/i.test(address) && !/^2001:(?:0{0,4}:|0*db8:|0*10:|0*20:)|^2002:/i.test(address);
  return false;
}
export function publicURL(input) {
  let u; try { u = new URL(input); } catch { throw new Error('Enter a complete public http:// or https:// URL.'); }
  const host = u.hostname.toLowerCase().replace(/\.$/, '');
  if (!['http:','https:'].includes(u.protocol) || u.username || u.password || u.port || !host.includes('.') || isIP(host) || host.includes(':') || /(^|\.)(localhost|local|internal|test|invalid|example|onion)$/.test(host)) throw new Error('Only public website hostnames on standard HTTP/HTTPS ports are supported. Local, private, example, and authenticated URLs are not collected.');
  u.hash = ''; return u;
}

export async function resolvePublic(input, resolver = lookup) {
  const u = publicURL(input);
  const addresses = await resolver(u.hostname, { all:true, verbatim:true });
  if (!addresses.length || addresses.some(a => !publicAddress(a.address))) throw new Error('This hostname resolves to a private or unsupported network address.');
  return {url:u,address:addresses.find(a=>a.family===4)||addresses[0]};
}

// Pin each request to its checked DNS result. Recheck every redirect separately.
export function decodePage(bytes,contentType='') {
  const header=contentType.match(/charset\s*=\s*["']?([\w-]+)/i)?.[1];
  const meta=bytes.subarray(0,8192).toString('ascii').match(/<meta[^>]+charset\s*=\s*["']?([\w-]+)/i)?.[1];
  const encoding=header||meta||'utf-8';
  try{return new TextDecoder(encoding).decode(bytes);}catch{throw new Error(`Unsupported page encoding (${encoding}). Import reviewed text instead.`);}
}
export async function requestPage(input, {signal, maxBytes=2_000_000, timeout=18000, resolver=lookup} = {}) {
  signal=signal?AbortSignal.any([signal,AbortSignal.timeout(timeout)]):AbortSignal.timeout(timeout);
  signal.throwIfAborted();
  let abort;
  const aborted=new Promise((_,reject)=>{abort=()=>reject(signal.reason);signal.addEventListener('abort',abort,{once:true});});
  let resolved;try{resolved=await Promise.race([resolvePublic(input,resolver),aborted]);}finally{signal.removeEventListener('abort',abort);}
  const {url,address}=resolved;signal.throwIfAborted();
  return new Promise((resolve,reject) => {
    const transport = url.protocol === 'https:' ? https : http;
    const req = transport.get(url, {signal, headers:{'User-Agent':USER_AGENT,Accept:'text/html,text/plain;q=0.9','Accept-Encoding':'identity'}, lookup:(_host,options,cb)=>options?.all?cb(null,[address]):cb(null,address.address,address.family)}, res => {
      const status=res.statusCode, headers=res.headers;
      if ([301,302,303,307,308].includes(status)) { res.resume(); resolve({status,headers,html:'',url:url.href}); return; }
      if (Number(headers['content-length'])>maxBytes) {res.destroy();reject(new Error('Page exceeds the 2 MB collection limit. Import a relevant excerpt instead.'));return;}
      if(headers['content-encoding'] && headers['content-encoding']!=='identity'){res.destroy();reject(new Error('This website requires an unsupported compressed response. Use manual content import.'));return;}
      let size=0; const chunks=[];
      res.on('data',chunk=>{size+=chunk.length;if(size>maxBytes){res.destroy(new Error('Page exceeds the collection limit.'));}else chunks.push(chunk);});
      res.on('error',reject);res.on('end',()=>{try{resolve({status,headers,html:decodePage(Buffer.concat(chunks),headers['content-type']||''),url:url.href});}catch(e){reject(e);}});
    });
    const timer=setTimeout(()=>req.destroy(new Error('Website request timed out. Retry or import its text manually.')),timeout);
    req.on('close',()=>clearTimeout(timer));req.on('error',error=>reject(signal.aborted&&signal.reason?.name==='TimeoutError'?new Error('Website request timed out. Retry or import its text manually.'):error));
  });
}

export function robotsPolicy(text,path,agent='competitorlens') {
  const groups=[];let group=null,hasRules=false;
  for(const raw of text.split(/\r?\n/)){
    const line=raw.split('#')[0].trim(),colon=line.indexOf(':');if(colon<0)continue;
    const key=line.slice(0,colon).toLowerCase(),value=line.slice(colon+1).trim();
    if(key==='user-agent'){if(!group||hasRules){group={agents:[],rules:[],delay:1};groups.push(group);hasRules=false;}group.agents.push(value.toLowerCase());}
    else if(group&&['allow','disallow','crawl-delay'].includes(key)){hasRules=true;if(key==='crawl-delay'){const n=Number(value);if(Number.isFinite(n)&&n>=0)group.delay=Math.max(1,n);}else if(value)group.rules.push({allow:key==='allow',path:value});}
  }
  const explicit=groups.filter(g=>g.agents.some(a=>a!=='*'&&agent.includes(a)));
  const selected=explicit.length?explicit:groups.filter(g=>g.agents.includes('*'));
  const decodedPath=path.replace(/%[0-9a-f]{2}/gi,m=>{const c=String.fromCharCode(parseInt(m.slice(1),16));return /[a-z0-9\-._~]/i.test(c)?c:m.toUpperCase();});
  const matches=selected.flatMap(g=>g.rules).filter(r=>{
    const end=r.path.endsWith('$');const source=(end?r.path.slice(0,-1):r.path).split('*').map(p=>p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('.*');
    return new RegExp('^'+source+(end?'$':'')).test(decodedPath);
  }).sort((a,b)=>b.path.replace(/[*$]/g,'').length-a.path.replace(/[*$]/g,'').length || Number(b.allow)-Number(a.allow));
  return {allowed:matches[0]?.allow??true,delay:Math.max(1,...selected.map(g=>g.delay))};
}

export function createCollector({request=requestPage,clock=()=>Date.now(),pause=delay}={}) {
  const robots=new Map(),last=new Map();
  async function robotText(origin,signal) {
    const cached=robots.get(origin);if(cached&&clock()-cached.at<600000)return cached.text;
    let url=origin+'/robots.txt';
    for(let n=0;n<5;n++){
      const response=await request(url,{signal,maxBytes:512000});
      if([301,302,303,307,308].includes(response.status)&&response.headers.location){url=publicURL(new URL(response.headers.location,url).href).href;continue;}
      if(response.status===401||response.status===403||response.status>=500)throw new Error('Website robots policy is unavailable or denies access. Use manual import.');
      const text=response.status>=400?'':response.html;robots.set(origin,{text,at:clock()});return text;
    }
    throw new Error('Too many robots.txt redirects. Use manual import.');
  }
  return async function collect(input,{signal}={}) {
    let url=publicURL(input).href;const redirects=[];
    for(let n=0;n<5;n++){
      const u=publicURL(url),policy=robotsPolicy(await robotText(u.origin,signal),u.pathname+u.search);
      if(!policy.allowed)throw new Error('Collection is disallowed by this website’s robots.txt. Import text you are permitted to use.');
      if(policy.delay>10)throw new Error('This website requests a long crawl delay. Use manual import for this research.');
      const wait=Math.max(0,(last.get(u.origin)||0)+policy.delay*1000-clock());if(wait)await pause(wait,undefined,{signal});last.set(u.origin,clock());
      const response=await request(url,{signal});
      if([301,302,303,307,308].includes(response.status)&&response.headers.location){const target=publicURL(new URL(response.headers.location,url).href).href;redirects.push({from:url,to:target});url=target;continue;}
      if(response.status<200||response.status>=300)throw new Error(`Website returned HTTP ${response.status}. Retry or import its text manually.`);
      if(!/text\/html|application\/xhtml\+xml|text\/plain/i.test(response.headers['content-type']||''))throw new Error('This URL is not a readable HTML or text page.');
      return {url:response.url,requestedUrl:input,html:response.html,redirects,collectedAt:new Date(clock()).toISOString(),method:'fetched'};
    }
    throw new Error('Too many website redirects. Use the final public page URL or manual import.');
  };
}
