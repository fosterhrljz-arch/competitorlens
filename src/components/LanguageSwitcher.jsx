import { useSyncExternalStore } from 'react';
import { getLanguage,setLanguage,subscribeLanguage,t } from '../lib/i18n.js';
export function useLanguage(){return useSyncExternalStore(subscribeLanguage,getLanguage,()=> 'en-US');}
export default function LanguageSwitcher(){const language=useLanguage();return <label className="language-switcher"><span className="sr-only">{t('Interface language')}</span><select aria-label={t('Interface language')} value={language} onChange={e=>setLanguage(e.target.value)}><option value="en-US">English</option><option value="zh-CN">简体中文</option></select></label>;}
