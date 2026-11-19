import base from '../locales/zh-CN.js';
import extra from '../locales/zh-CN-extra.js';
const zh={...base,...extra};
export const LANGUAGES=['en-US','zh-CN'];
let language='en-US';
try{if(typeof localStorage!=='undefined'&&LANGUAGES.includes(localStorage.getItem('competitorlens.language')))language=localStorage.getItem('competitorlens.language');}catch{/* UI language does not affect workspace recovery. */}
const listeners=new Set();
export const getLanguage=()=>language;
export const subscribeLanguage=fn=>{listeners.add(fn);return()=>listeners.delete(fn);};
export function setLanguage(value){if(!LANGUAGES.includes(value))return;language=value;try{localStorage.setItem('competitorlens.language',value);}catch{/* Non-sensitive preference is optional. */}if(typeof document!=='undefined')document.documentElement.lang=value;listeners.forEach(fn=>fn());}
const escapeRE=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const patterns=Object.entries(zh).filter(([key])=>/\{\d+\}/.test(key)).map(([key,value])=>({re:new RegExp('^'+key.split(/\{\d+\}/).map(escapeRE).join('(.+?)')+'$','s'),value}));
const reverse=new Map(Object.entries(zh).map(([en,cn])=>[cn,en]));
export function t(message,params={},locale=language){
  if(typeof message!=='string')return message;
  let key=reverse.get(message)||message,value=locale==='zh-CN'?zh[key]:key;
  if(value===undefined&&locale==='zh-CN'){
    for(const pattern of patterns){const match=key.match(pattern.re);if(match){value=pattern.value;params=Object.fromEntries(match.slice(1).map((v,i)=>[i,v]));break;}}
  }
  return (value??key).replace(/\{(\w+)\}/g,(all,k)=>Object.hasOwn(params,k)?String(params[k]):all);
}
export const createT=locale=>(message,params)=>t(message,params,locale);
export const formatDate=(value,options={dateStyle:'medium'},locale=language)=>{const d=new Date(value);return Number.isNaN(d.getTime())?t('Date not recorded',{},locale):d.toLocaleString(locale,options);};
