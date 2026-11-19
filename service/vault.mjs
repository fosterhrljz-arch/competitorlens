import { readFile, writeFile, mkdir, rename, unlink, access } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { DEFAULT_AI_CONFIG, validateAIConfig } from './ai-config.mjs';

export function windowsProtector(helper=fileURLToPath(new URL('./CredentialHelper.exe',import.meta.url))) {
  return async (mode,value)=>new Promise((resolve,reject)=>{
    const child=spawn(helper,[mode],{windowsHide:true,stdio:['pipe','pipe','pipe']});let output='',failed=false;
    const timer=setTimeout(()=>{failed=true;child.kill();reject(new Error('Secure credential storage timed out.'));},10000);
    child.stdout.on('data',b=>{output+=b;if(output.length>40000){failed=true;child.kill();}});
    child.stderr.resume();child.on('error',()=>{clearTimeout(timer);reject(new Error('Secure credential storage is unavailable.'));});
    child.on('close',code=>{clearTimeout(timer);if(code!==0||failed)reject(new Error('Secure credential storage is unavailable.'));else resolve(Buffer.from(output.trim(),'base64'));});
    child.stdin.on('error',()=>{});child.stdin.end(Buffer.from(value).toString('base64'));
  });
}
export async function createVault({directory=process.env.CL_TEST_DATA_DIR||join(process.env.LOCALAPPDATA||homedir(),'CompetitorLens'),protect,sessionOnly=false}={}) {
  let config={...DEFAULT_AI_CONFIG},key='',keyHost='',encrypted='',issue='';
  if(protect===undefined&&!sessionOnly&&process.platform==='win32'){
    try{await access(new URL('./CredentialHelper.exe',import.meta.url));protect=windowsProtector();}catch{issue='Secure storage is unavailable. Keys will remain in memory for this service session.';}
  }
  const file=directory?join(directory,'ai-settings.json'):null;
  if(file&&!sessionOnly){try{const value=JSON.parse(await readFile(file,'utf8'));config=validateAIConfig(value.config);encrypted=typeof value.credential==='string'?value.credential:'';keyHost=value.keyHost||'';if(encrypted&&keyHost!==config.baseURL)throw new Error('Credential endpoint mismatch');if(encrypted&&protect)key=(await protect('unprotect',Buffer.from(encrypted,'base64'))).toString('utf8');else if(encrypted)issue='Stored credentials cannot be unlocked here. Re-enter a session key.';}catch(e){if(e.code!=='ENOENT')issue='AI settings could not be read. The existing settings file has not been overwritten.';}}
  const status=()=>({config:{...config},hasKey:!!key,remembered:!!encrypted,credentialStorage:protect&&!sessionOnly?'Windows DPAPI':'Session memory',warning:issue});
  async function persist(next,nextKey,nextHost,remember){
    const credential=remember&&protect&&nextKey?(await protect('protect',Buffer.from(nextKey))).toString('base64'):'';
    if(file&&!sessionOnly){await mkdir(directory,{recursive:true});const temp=file+'.'+randomBytes(6).toString('hex')+'.tmp';const value=JSON.stringify({version:1,config:next,keyHost:nextHost,credential});try{await writeFile(temp,value,{mode:0o600});if(await readFile(temp,'utf8')!==value)throw new Error();await rename(temp,file);if(await readFile(file,'utf8')!==value)throw new Error();}catch{await unlink(temp).catch(()=>{});throw new Error('AI preferences could not be saved. Existing in-memory settings are unchanged.');}}
    config=next;key=nextKey;keyHost=nextHost;encrypted=credential;issue='';return status();
  }
  return {
    status,
    secret:()=>key,
    async save({config:input,apiKey,rememberKey,clearKey=false}={}){
      const next=validateAIConfig(input);let nextKey=key,nextHost=keyHost;
      const changed=next.baseURL!==config.baseURL;
      if(changed||clearKey){nextKey='';nextHost='';}
      if(apiKey!==undefined&&apiKey!==''){if(typeof apiKey!=='string'||apiKey.length>12000||/[\r\n]/.test(apiKey))throw new Error('Enter a valid API key without line breaks.');nextKey=apiKey.trim();nextHost=next.baseURL;}
      // A credential is bound to the exact configured base URL; changing provider never forwards the old key.
      const keepEncrypted=!changed&&!clearKey&&apiKey===undefined&&rememberKey===undefined&&!!encrypted;
      return persist(next,nextKey,nextHost,rememberKey||keepEncrypted);
    },
    async forget(){return persist(config,'','',false);}
  };
}
