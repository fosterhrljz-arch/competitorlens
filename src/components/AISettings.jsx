import { t } from "../lib/i18n.js";
import { useEffect, useRef, useState } from 'react';
import { KeyRound, PlugZap, RefreshCw, Square, Trash2 } from 'lucide-react';
import { PageTitle, Field, Button, Notice, Badge } from './UI.jsx';
import { serviceRequest, useLocalService, checkService } from '../lib/localService.js';
import { DEFAULT_AI_CONFIG } from '../../service/ai-config.mjs';
export function UsageInfo({
  usage
}) {
  if (!usage) return null;
  return <div className="ai-usage"><strong>{t("Latest request usage")}</strong><span>{t("Input tokens:")} {usage.promptTokens ?? t('Not reported')}</span><span>{t("Output tokens:")} {usage.completionTokens ?? t('Not reported')}</span><span>{t("Total tokens:")} {usage.totalTokens ?? t('Not reported')}</span><span>{t("Attempts:")} {usage.attempts} · {(usage.elapsedMs / 1000).toFixed(1)} {t("seconds")}</span><small>{t("Provider-reported usage. Cost is not estimated; check your provider account for billing.")}</small></div>;
}
export default function AISettings() {
  const health = useLocalService(),
    [config, setConfig] = useState({
      ...DEFAULT_AI_CONFIG
    }),
    [key, setKey] = useState(''),
    [remember, setRemember] = useState(true),
    [status, setStatus] = useState(null),
    [models, setModels] = useState([]),
    [busy, setBusy] = useState(''),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [usage, setUsage] = useState(null);
  const abort = useRef(),
    loaded = useRef(false);
  useEffect(() => {
    if (health.status === 'online' && !loaded.current) {
      loaded.current = true;
      serviceRequest('/api/ai/status').then(s => {
        setStatus(s);
        setConfig(s.config);
        setRemember(s.remembered || !s.hasKey);
      }).catch(e => {
        loaded.current = false;
        setError(e.message);
      });
    }
  }, [health.status]);
  useEffect(() => () => abort.current?.abort(), []);
  const update = (k, v) => {
    setConfig(c => ({
      ...c,
      [k]: v
    }));
    setMessage('');
  };
  async function execute(action) {
    setError('');
    setMessage('');
    setBusy(action);
    abort.current = new AbortController();
    try {
      if (action === 'forget') {
        setStatus(await serviceRequest('/api/ai/forget', {}, abort.current.signal));
        setKey('');
        setMessage('Stored and session credentials removed.');
        return;
      }
      const saved = await serviceRequest('/api/ai/settings', {
        config,
        ...(key ? {
          apiKey: key
        } : {}),
        rememberKey: remember
      }, abort.current.signal);
      setStatus(saved);
      setKey('');
      if (action === 'save') {
        setMessage('AI preferences saved. The API key is not included in workspace backups.');
        return;
      }
      const result = await serviceRequest('/api/ai/' + action, {}, abort.current.signal);
      if (result.usage) setUsage(result.usage);
      if (action === 'models') {
        setModels(result.models);
        setMessage(result.models.length ? 'Model list received. Choose a model or enter its exact name.' : 'The provider did not return a model list. Enter its exact model name.');
      } else setMessage('Connection successful. The model passed the structured JSON test.');
    } catch (e) {
      if (e.usage) setUsage(e.usage);
      setError(e.name === 'AbortError' ? 'Request cancelled. Provider billing may still apply to an in-flight request.' : e.message);
    } finally {
      setBusy('');
    }
  }
  return <><PageTitle title={t("AI Settings")} subtitle={t("Choose a compatible model. Keep credentials on this device.")}><Badge tone={health.status === 'online' ? 'green' : 'orange'}>{health.status === 'online' ? t('Local service online') : health.status === 'checking' ? t('Checking local service…') : health.status === 'manual' ? t('Standalone manual mode') : t('Local service offline')}</Badge><Button onClick={checkService} icon={RefreshCw}>{t("Check service")}</Button></PageTitle>
    {health.status !== 'online' && <Notice>{t("Open the Windows launcher for AI API connections and secure credential storage. Manual research and rule-based analysis work without it.")}</Notice>}
    {error && <div className="error" role="alert">{t(error)}</div>}{message && <Notice>{t(message)}</Notice>}
    <div className="ai-settings-grid"><section className="panel section-pad"><h2>{t("Provider connection")}</h2><div className="form-grid">
      <Field label={t("Provider preset")}><select value={config.provider} onChange={e => {
              update('provider', e.target.value);
              if (e.target.value === 'OpenAI') update('baseURL', 'https://api.openai.com/v1');
            }}><option value="OpenAI-compatible">{t("OpenAI-compatible")}</option><option value="OpenAI">{t("OpenAI")}</option><option value="Custom">{t("Custom provider")}</option></select></Field>
      <Field label={t("API Base URL")}><input value={config.baseURL} onChange={e => update('baseURL', e.target.value)} placeholder={t("https://api.example.com/v1")} /></Field>
      <Field label={t("API key")} hint={t("Leave blank to keep the current key. Changing the Base URL clears the old credential.")}><input type="password" value={key} autoComplete="off" maxLength={12000} spellCheck={false} onChange={e => setKey(e.target.value)} placeholder={status?.hasKey ? t('A key is configured') : t('Enter a key for this provider')} /></Field>
      <Field label={t("Credential storage")}><div><Badge>{t(status?.credentialStorage) || t('Local service required')}</Badge><p>{status?.hasKey ? t('A credential is configured. Its value is never returned to the browser.') : t('No credential configured.')}</p></div></Field>
      <Field label={t("Available models")}><select value={models.includes(config.model) ? config.model : ''} onChange={e => e.target.value && update('model', e.target.value)}><option value="">{t("Enter a name below or load models")}</option>{models.map(m => <option value={m} key={m}>{m}</option>)}</select></Field>
      <Field label={t("Model name")}><input value={config.model} maxLength={150} onChange={e => update('model', e.target.value)} placeholder={t("Exact model ID from your provider")} /></Field>
      <Field label={t("AI output language")}><select value={config.outputLanguage} onChange={e => update('outputLanguage', e.target.value)}><option value="en-US">{t("English")}</option><option value="zh-CN">简体中文</option></select></Field>
      <Field label={t("Temperature")} hint={t("Leave empty when the model does not support this parameter.")}><input type="number" step="0.1" min="0" max="2" value={config.temperature} onChange={e => update('temperature', e.target.value)} /></Field>
      <Field label={t("Output token limit")}><input type="number" min="128" max="32000" value={config.maxTokens} onChange={e => update('maxTokens', e.target.value)} /></Field>
      <Field label={t("Token parameter")}><select value={config.tokenParameter} onChange={e => update('tokenParameter', e.target.value)}><option value="max_completion_tokens">{t("max_completion_tokens")}</option><option value="max_tokens">{t("max_tokens")}</option><option value="omit">{t("Do not send a token parameter")}</option></select></Field>
      <Field label={t("JSON response format")}><select value={config.responseFormat} onChange={e => update('responseFormat', e.target.value)}><option value="json_schema">{t("Strict JSON schema")}</option><option value="json_object">{t("JSON object")}</option><option value="prompt">{t("Prompt-only JSON")}</option></select></Field>
      <Field label={t("Request timeout (seconds)")}><input type="number" min="5" max="300" value={config.timeoutSeconds} onChange={e => update('timeoutSeconds', e.target.value)} /></Field>
      <Field label={t("Retries for rate limits / server errors")}><select value={config.retries} onChange={e => update('retries', Number(e.target.value))}><option value="0">0</option><option value="1">1</option><option value="2">2</option></select></Field>
    </div><label className="check-line"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />{t("Remember the key with Windows DPAPI when available")}</label><label className="check-line"><input type="checkbox" checked={config.allowLocal} onChange={e => update('allowLocal', e.target.checked)} />{t("Allow a loopback provider on this computer")}</label>
    {status?.warning && <Notice>{t(status.warning)}</Notice>}
    <div className="actions"><Button variant="primary" disabled={health.status !== 'online' || !!busy} icon={KeyRound} onClick={() => execute('save')}>{t("Save AI settings")}</Button><Button disabled={health.status !== 'online' || !!busy} icon={PlugZap} onClick={() => execute('test')}>{t("Test connection")}</Button><Button disabled={health.status !== 'online' || !!busy} onClick={() => execute('models')}>{t("Load models")}</Button><Button disabled={health.status !== 'online' || !!busy || !status?.hasKey} icon={Trash2} onClick={() => execute('forget')}>{t("Remove API key")}</Button>{busy && <Button icon={Square} onClick={() => abort.current?.abort()}>{t("Cancel request")}</Button>}</div>{busy && <p role="status">{busy === 'test' ? t('Testing model connection…') : busy === 'models' ? t('Loading available models…') : t('Saving local settings…')}</p>}
    </section><aside className="panel section-pad"><h2>{t("What is sent to the provider?")}</h2><p>{t("Only selected collected website text and analysis instructions are sent when you start AI analysis. Connection testing sends a short JSON test prompt and may incur a small charge.")}</p><p>{t("Credentials never enter localStorage, project data, reports, backups, or application logs. Windows DPAPI binds remembered keys to your Windows account. Without secure storage, keys remain in service memory.")}</p><Notice>{t("AI output language is separate from the interface language. Source excerpts always retain their original language.")}</Notice><p>{t("Provider compatibility varies. If a model rejects temperature, token limits, or strict schemas, adjust those settings and test again. Every response is validated locally even in prompt-only mode.")}</p><UsageInfo usage={usage} /></aside></div></>;
}
