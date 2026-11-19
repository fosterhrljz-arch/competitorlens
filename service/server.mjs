import http from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createCollector, collectionErrorMessage } from './collector.mjs';
import { createVault } from './vault.mjs';
import { createAIClient } from './ai.mjs';

export async function startServer({port=4184,htmlPath=new URL('../CompetitorLens.html',import.meta.url),collector=createCollector(),idleMs=1800000,vault=null,aiClient=null,vaultOptions={}}={}) {
  const token=randomBytes(32).toString('hex');let active=0,lastUse=Date.now();
  let ready;const ai=()=>ready??=(async()=>{const store=vault||await createVault(vaultOptions);return {store,client:aiClient||createAIClient({vault:store})};})();
  const server=http.createServer(async(req,res)=>{
    const address=server.address(),origin=`http://127.0.0.1:${address.port}`;
    const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
    if(req.headers.host!==`127.0.0.1:${address.port}`){send(403,{error:'Invalid local service host.'});return;}
    if(req.method==='GET'&&req.url==='/api/health'){const supplied=Buffer.from(String(req.headers['x-competitorlens-token']||''));send(200,{app:'CompetitorLens',version:'1.5',mode:'local',...(req.headers['x-competitorlens-token']?{authorized:supplied.length===token.length&&timingSafeEqual(supplied,Buffer.from(token))}:{})});return;}
    if(req.method==='GET'&&(req.url==='/'||req.url==='/CompetitorLens.html')){
      lastUse=Date.now();
      try {const html=await readFile(htmlPath,'utf8');res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Content-Security-Policy':"frame-ancestors 'none'; object-src 'none'; base-uri 'none'"});res.end(html.replace('<div id="root"',`<script>window.__COMPETITORLENS_SERVICE__=${JSON.stringify({origin,token})};</script><div id="root"`));}catch{send(500,{error:'CompetitorLens.html is missing. Extract the complete release package.'});}return;
    }
    const supplied=Buffer.from(String(req.headers['x-competitorlens-token']||''));
    if(req.method!=='POST'||req.headers.origin!==origin||supplied.length!==token.length||!timingSafeEqual(supplied,Buffer.from(token))){send(403,{error:'Open CompetitorLens using the packaged launcher to connect to its local research service.'});return;}
    lastUse=Date.now();
    if(req.url==='/api/stop'){send(200,{stopped:true});setTimeout(()=>server.close(),50);return;}
    if(!['/api/page','/api/ai/status','/api/ai/settings','/api/ai/forget','/api/ai/test','/api/ai/models','/api/ai/analyze'].includes(req.url)){send(404,{error:'Unknown research action.'});return;}
    if(active>=2){send(429,{error:'Two page requests are already running. Wait for them to finish.'});return;}
    active++;const controller=new AbortController();res.on('close',()=>{if(!res.writableEnded)controller.abort();});
    try{
      let body='';for await(const part of req){body+=part;if(body.length>(req.url==='/api/page'?16000:400000))throw new Error('Research request is too large.');}
      const input=JSON.parse(body||'{}');
      if(req.url.startsWith('/api/ai/')){
        const {store,client}=await ai();let result;
        if(req.url==='/api/ai/status')result=store.status();
        else if(req.url==='/api/ai/settings')result=await store.save(input);
        else if(req.url==='/api/ai/forget')result=await store.forget();
        else if(req.url==='/api/ai/test')result=await client.test({signal:controller.signal});
        else if(req.url==='/api/ai/models')result=await client.models({signal:controller.signal});
        else {
          if(!Array.isArray(input.competitors)||input.competitors.length<1||input.competitors.length>5||input.competitors.some(c=>typeof c.url!=='string'||typeof c.name!=='string'||!Array.isArray(c.sources)||c.sources.length>12||c.sources.some(s=>typeof s.id!=='string'||typeof s.excerpt!=='string'||s.excerpt.length>6000)))throw new Error('Invalid AI research input.');
          if(input.competitors.reduce((n,c)=>n+c.sources.reduce((m,s)=>m+s.excerpt.length,0),0)>120000)throw new Error('AI research input exceeds 120,000 characters.');
          result=await client.analyze(input,{signal:controller.signal});
        }
        if(!res.destroyed)send(200,result);return;
      }
      const {url}=input;if(typeof url!=='string'||url.length>8000)throw new Error('Provide one public URL.');
      const result=await collector(url,{signal:controller.signal});if(!res.destroyed)send(200,result);
    }catch(e){if(!res.destroyed)send(400,{error:req.url==='/api/page'?collectionErrorMessage(e):e.name==='AbortError'?'Request cancelled.':e.message||'The local service request failed.',...(e.code?{code:e.code}:{}),...(e.usage?{usage:e.usage}:{})});}
    finally{active--;lastUse=Date.now();}
  });
  server.requestTimeout=30000;server.headersTimeout=10000;
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
  const timer=setInterval(()=>{if(!active&&Date.now()-lastUse>idleMs)server.close();},30000);timer.unref();server.on('close',()=>clearInterval(timer));
  return server;
}
if(process.argv[1]===fileURLToPath(import.meta.url))startServer({port:Number(process.env.CL_PORT)||4184}).then(s=>console.log(`CompetitorLens local service: http://127.0.0.1:${s.address().port}`)).catch(e=>{console.error(e.message);process.exitCode=1;});
