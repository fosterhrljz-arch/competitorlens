export const DEFAULT_AI_CONFIG = Object.freeze({provider:'OpenAI-compatible',baseURL:'https://api.openai.com/v1',model:'',temperature:'',maxTokens:6000,tokenParameter:'max_completion_tokens',responseFormat:'json_schema',timeoutSeconds:90,retries:1,outputLanguage:'en-US',allowLocal:false});
export function validateAIConfig(input={}) {
  const c={...DEFAULT_AI_CONFIG};
  for(const k of Object.keys(c))if(Object.hasOwn(input,k))c[k]=input[k];
  if(typeof c.provider!=='string'||c.provider.length>80||typeof c.model!=='string'||c.model.length>150||/[\r\n]/.test(c.model))throw new Error('Invalid provider or model name.');
  let url;try{url=new URL(c.baseURL);}catch{throw new Error('Enter a valid API Base URL.');}
  const local=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
  if(url.username||url.password||url.search||url.hash||(!local&&url.protocol!=='https:')||(local&&(!c.allowLocal||!['http:','https:'].includes(url.protocol)))||(!local&&!url.hostname.includes('.')))throw new Error('Use a public HTTPS API URL, or explicitly enable a loopback provider. Do not put credentials or query parameters in the URL.');
  if(local&&url.port==='4184')throw new Error('The research service cannot also be the AI provider.');
  url.pathname=url.pathname.replace(/\/+$/,'');c.baseURL=url.href.replace(/\/$/,'');
  c.allowLocal=local&&c.allowLocal===true;c.model=c.model.trim();
  c.temperature=c.temperature===''?'':Number(c.temperature);
  if(c.temperature!==''&&(!Number.isFinite(c.temperature)||c.temperature<0||c.temperature>2))throw new Error('Temperature must be empty or between 0 and 2.');
  for(const [k,min,max] of [['maxTokens',128,32000],['timeoutSeconds',5,300],['retries',0,2]]){c[k]=Number(c[k]);if(!Number.isInteger(c[k])||c[k]<min||c[k]>max)throw new Error(`Invalid ${k}: use an integer from ${min} to ${max}.`);}
  if(!['max_completion_tokens','max_tokens','omit'].includes(c.tokenParameter)||!['json_schema','json_object','prompt'].includes(c.responseFormat)||!['en-US','zh-CN'].includes(c.outputLanguage))throw new Error('Unsupported AI compatibility setting.');
  return c;
}
