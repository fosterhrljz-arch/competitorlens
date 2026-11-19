import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { startServer } from './server.mjs';
const url='http://127.0.0.1:4184/';
function open(){if(process.env.CL_NO_BROWSER==='1')return;const p=process.platform==='win32'?spawn('rundll32.exe',['url.dll,FileProtocolHandler',url],{detached:true,windowsHide:true,stdio:'ignore'}):spawn(process.platform==='darwin'?'open':'xdg-open',[url],{detached:true,stdio:'ignore'});p.unref();}
try{await startServer();open();}
catch(e){
  try{const res=await fetch(url+'api/health',{signal:AbortSignal.timeout(2000)}),status=await res.json();if(status.app!=='CompetitorLens'||status.version!=='1.5')throw e;open();}
  catch{await writeFile(new URL('../launch-error.txt',import.meta.url),'CompetitorLens could not start. Port 4184 may be in use or local applications may be blocked. Close the conflicting app and try again. You can still double-click CompetitorLens.html for offline/manual research.\n'+e.message);process.exitCode=1;}
}
