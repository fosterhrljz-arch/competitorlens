import test from 'node:test';
import assert from 'node:assert/strict';
import { publicURL, publicAddress, resolvePublic, robotsPolicy, createCollector, decodePage, requestPage, collectionErrorMessage } from '../service/collector.mjs';
import { startServer } from '../service/server.mjs';

test('Collection failures give actionable network, TLS, timeout and cancellation messages',()=>{
  for(const code of ['ECONNRESET','ERR_TLS_CERT_ALTNAME_INVALID','ENETUNREACH'])assert.match(collectionErrorMessage({code,message:'raw socket details'}),/Retry this page or import/);
  assert.match(collectionErrorMessage({code:'ENOTFOUND'}),/Check the URL/);
  assert.match(collectionErrorMessage({name:'TimeoutError'}),/timed out/);
  assert.equal(collectionErrorMessage({name:'AbortError'}),'Collection cancelled.');
  assert.match(collectionErrorMessage({message:'Collection is disallowed by robots.txt.'}),/disallowed/);
});

test('Collector rejects credentials, non-web protocols, IP literals, private DNS and nonstandard ports',async()=>{
  for(const url of ['file:///secret','http://127.0.0.1','https://[::1]','http://localhost','http://router.local','https://u:p@site.com','https://site.com:8443'])assert.throws(()=>publicURL(url));
  for(const ip of ['127.0.0.1','10.2.3.4','169.254.169.254','172.16.1.1','192.168.0.1','100.64.0.1','198.18.0.1','::ffff:127.0.0.1','fc00::1','2001:db8::1'])assert.equal(publicAddress(ip),false,ip);
  assert.equal(publicAddress('1.1.1.1'),true);assert.equal(publicAddress('2606:4700:4700::1111'),true);
  await assert.rejects(resolvePublic('https://site.com',async()=>[{address:'127.0.0.1',family:4}]),/private/);
  await assert.rejects(resolvePublic('https://site.com',async()=>[{address:'1.1.1.1',family:4},{address:'10.0.0.1',family:4}]),/private/);
});

test('Robots matching respects agent groups, longest allow rules, wildcard/end patterns and crawl delays',()=>{
  const rules='User-agent: *\nDisallow: /private\nAllow: /private/public\nDisallow: /*.pdf$\nCrawl-delay: 3';
  assert.equal(robotsPolicy(rules,'/private/x').allowed,false);assert.equal(robotsPolicy(rules,'/private/public/x').allowed,true);assert.equal(robotsPolicy(rules,'/document.pdf').allowed,false);assert.equal(robotsPolicy(rules,'/document.pdf?q=1').allowed,true);assert.equal(robotsPolicy(rules,'/').delay,3);
  assert.equal(robotsPolicy(rules+'\nUser-agent: CompetitorLens\nAllow: /','/private/x').allowed,true);
});

test('Page decoding preserves declared character encodings and DNS lookup can be cancelled',async()=>{
  assert.equal(decodePage(Buffer.from([0x63,0x61,0x66,0xe9]),'text/html; charset=windows-1252'),'café');
  assert.equal(decodePage(Buffer.from('Public page · £12','utf8'),'text/html'),'Public page · £12');
  assert.throws(()=>decodePage(Buffer.from('text'),'text/html;charset=unknown-encoding'),/Unsupported/);
  const controller=new AbortController();const pending=requestPage('https://site.com',{signal:controller.signal,resolver:()=>new Promise(()=>{})});controller.abort();await assert.rejects(pending);
});

test('Collection rechecks redirects, rejects robots denial and oversized/non-text/failing responses',async()=>{
  const seen=[];const request=async url=>{seen.push(url);if(url.endsWith('/robots.txt'))return {status:200,headers:{},html:'User-agent: *\nDisallow: /blocked'};if(url.endsWith('/redirect'))return {status:302,headers:{location:'http://127.0.0.1/secret'}};if(url.endsWith('/binary'))return {status:200,headers:{'content-type':'application/pdf'},html:'bytes'};if(url.endsWith('/error'))return {status:503,headers:{},html:''};return {url,status:200,headers:{'content-type':'text/html'},html:'<p>Public content.</p>'};};
  const collect=createCollector({request,pause:async()=>{}});await assert.rejects(collect('https://site.com/blocked'),/disallowed/);assert.ok(!seen.includes('https://site.com/blocked'));
  await assert.rejects(collect('https://site.com/redirect'),/public website/);await assert.rejects(collect('https://site.com/binary'),/readable/);await assert.rejects(collect('https://site.com/error'),/503/);
  const result=await collect('https://site.com/');assert.equal(result.method,'fetched');assert.equal(result.requestedUrl,'https://site.com/');assert.ok(result.collectedAt);
});

test('Local service requires same-origin token, exposes no wildcard CORS, and only serves the portable app',async()=>{
  const server=await startServer({port:0,collector:async url=>({url,html:'<p>Controlled page</p>',collectedAt:'2026-11-12',method:'fetched'})});
  try{
    const origin=`http://127.0.0.1:${server.address().port}`,home=await fetch(origin),html=await home.text(),token=html.match(/"token":"([a-f0-9]+)"/)[1];
    assert.equal(home.headers.get('access-control-allow-origin'),null);assert.equal(home.headers.get('x-frame-options'),'DENY');
    assert.equal((await fetch(origin+'/api/page',{method:'POST',body:'{}'})).status,403);
    assert.equal((await fetch(origin+'/api/page',{method:'POST',headers:{Origin:'https://evil.example','X-CompetitorLens-Token':token},body:'{}'})).status,403);
    const response=await fetch(origin+'/api/page',{method:'POST',headers:{Origin:origin,'X-CompetitorLens-Token':token},body:JSON.stringify({url:'https://site.com'})});assert.equal(response.status,200);assert.equal((await response.json()).url,'https://site.com');
    assert.equal((await fetch(origin+'/../package.json')).status,403);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
