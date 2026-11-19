import { useEffect, useState } from 'react';
import { Home, Users, BarChart3, Grid2X2, CircleDot, FileText, Database, CheckCircle2, BookOpen, Menu, X, Download, ArrowLeft, Search, Sparkles } from 'lucide-react';
import { STORAGE_KEY, uid, validateBackup, emptyWorkspace, prepareProject } from './lib/model.js';
import { persistVerified, storageCapacity } from './lib/storage.js';
import { initialState } from './lib/demo.js';
import { download } from './lib/io.js';
import { Button, Modal } from './components/UI.jsx';
import Overview from './components/Overview.jsx';
import Welcome, { Brand } from './components/Welcome.jsx';
import CompetitorEditor from './components/CompetitorEditor.jsx';
import { Competitors, CompetitorDetails, Audience, Matrix, Opportunities } from './components/Research.jsx';
import AutomatedResearch from './components/AutomatedResearch.jsx';
import LanguageSwitcher, { useLanguage } from './components/LanguageSwitcher.jsx';
import { t } from './lib/i18n.js';
import AISettings from './components/AISettings.jsx';
import Reports from './components/Reports.jsx';
import DataManagement from './components/DataManagement.jsx';
import { NewProject, Documentation } from './components/ProjectDialogs.jsx';
const NAV = [['overview', 'Overview', Home], ['research', 'Automated Research', Search], ['competitors', 'Competitors', Users], ['audience', 'Audience Analysis', BarChart3], ['matrix', 'Competitive Matrix', Grid2X2], ['opportunities', 'Opportunities', CircleDot], ['reports', 'Reports', FileText], ['ai', 'AI Settings', Sparkles]];
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return {
      state: raw ? validateBackup(JSON.parse(raw)) : emptyWorkspace(),
      error: ''
    };
  } catch {
    return {
      state: emptyWorkspace(),
      error: 'Saved data could not be read; your original saved data has not been overwritten. Download a recovery copy, then restore a valid backup or explicitly start fresh.'
    };
  }
}
export default function App() {
  const language = useLanguage();
  useEffect(() => {
    document.documentElement.lang = language; document.title=language==='zh-CN'?'CompetitorLens — 竞争对手受众情报':'CompetitorLens — Competitor Audience Intelligence';
  }, [language]);
  const [loaded] = useState(load),
    [savedState, setSavedState] = useState(loaded.state);
  const [demoState, setDemoState] = useState(initialState),
    [demoMode, setDemoMode] = useState(false),
    [welcome, setWelcome] = useState(true);
  const state = demoMode ? demoState : savedState;
  const setState = demoMode ? setDemoState : setSavedState;
  const [storageError, setStorageError] = useState(loaded.error),
    [blocked, setBlocked] = useState(!!loaded.error);
  const [page, setPage] = useState('overview'),
    [mobile, setMobile] = useState(false),
    [modal, setModal] = useState(null);
  const [detail, setDetail] = useState(null),
    [editor, setEditor] = useState(null),
    [editorDirty, setEditorDirty] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState(''),
    [selectedOpportunity, setSelectedOpportunity] = useState(''),
    [toast, setToast] = useState('');
  const project = state.projects.find(p => p.id === state.activeId) || state.projects[0] || {
    id: '',
    name: 'No project',
    industry: '',
    competitors: [],
    opportunityState: {},
    opportunityHistory: [],
    demo: false
  };
  const [reportScope, setReportScope] = useState(null);
  const [pendingSave, setPendingSave] = useState(null);
  const capacity = storageCapacity(pendingSave || state);
  const currentCompetitor = project.competitors.find(c => c.id === detail?.id);
  const navPage = ['detail', 'editor'].includes(page) ? 'competitors' : page;
  const pageLabel = page === 'editor' ? editor?.c ? `Edit ${editor.c.name}` : 'Add competitor' : page === 'detail' ? currentCompetitor?.name : NAV.find(x => x[0] === page)?.[1] || 'Data Management';
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  function commit(next, {
    allowRecovery = false,
    persistent = false
  } = {}) {
    next = {
      ...next,
      version: 4,
      projects: next.projects.map(prepareProject)
    };
    if (demoMode && !persistent) {
      setDemoState(next);
      return true;
    }
    if (blocked && !allowRecovery) {
      setToast('Recovery mode: download the original data, then restore or start fresh.');
      return false;
    }
    try {
      persistVerified(localStorage, STORAGE_KEY, next);
      (persistent ? setSavedState : setState)(next);
      setBlocked(false);
      setStorageError('');
      setPendingSave(null);
      return true;
    } catch {
      setPendingSave(next);
      setToast('');
      setStorageError('Save failed: browser storage is unavailable, full, or did not confirm the write. Your draft is still open. Download the unsaved backup, then retry saving.');
      return false;
    }
  }
  useEffect(() => {
    const sync = e => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        const next = validateBackup(JSON.parse(e.newValue));
        if (demoMode) {
          setSavedState(next);
          return;
        }
        if (editorDirty || pendingSave) {
          setModal({
            type: 'external',
            next
          });
          return;
        }
        setState(next);
        setEditor(null);
        setDetail(null);
        setPage('overview');
        setModal(null);
        setToast('Workspace updated from another tab.');
        setStorageError('');
        setBlocked(false);
      } catch {
        setStorageError('Another tab wrote unreadable data. Export your current workspace before closing.');
        setBlocked(true);
      }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [editorDirty, demoMode, pendingSave]);
  function update(p) {
    if (!p.id) {
      setToast('Create a project before adding research.');
      return false;
    }
    return commit({
      ...state,
      projects: state.projects.map(x => x.id === p.id ? {
        ...p,
        updatedAt: new Date().toISOString()
      } : x)
    });
  }
  function requestNavigation(action) {
    if (editorDirty || pendingSave) setModal({
      type: 'discard',
      action
    });else action();
  }
  function finishNavigation(next) {
    setPage(next);
    setMobile(false);
    setEditor(null);
    setEditorDirty(false);
    window.scrollTo({
      top: 0,
      behavior: 'instant'
    });
  }
  function go(next) {
    requestNavigation(() => finishNavigation(next));
  }
  function showDetail(c, tab = 'Overview', field = '', segmentId = '') {
    setDetail({
      id: c.id,
      tab,
      field,
      segmentId,
      key: uid()
    });
    finishNavigation('detail');
  }
  function view(c, tab, field, segmentId) {
    requestNavigation(() => showDetail(c, tab, field, segmentId));
  }
  function edit(c, step = 'Profile', audienceId = '') {
    requestNavigation(() => {
      setEditor({
        c,
        step,
        audienceId,
        key: uid()
      });
      setEditorDirty(false);
      setPage('editor');
      setMobile(false);
      window.scrollTo({
        top: 0,
        behavior: 'instant'
      });
    });
  }
  function openReport(ids) {
    setReportScope(ids);
    go('reports');
  }
  function beginNewProject() {
    if (demoMode) {
      setDemoMode(false);
      setWelcome(true);
    }
    setModal({
      type: 'new'
    });
  }
  function add() {
    if (!project.id) {
      beginNewProject();
      return;
    }
    if (project.competitors.length >= 5) {
      setToast('This project already has 5 competitors.');
      return;
    }
    edit(null);
  }
  function save(c) {
    const has = project.competitors.some(x => x.id === c.id);
    if (!has && project.competitors.length >= 5) {
      setToast('This project already has 5 competitors.');
      return;
    }
    if (update({
      ...project,
      competitors: has ? project.competitors.map(x => x.id === c.id ? c : x) : [...project.competitors, c]
    })) {
      showDetail(c);
      setToast('Competitor saved.');
    }
  }
  function newProject(name, industry) {
    if (state.projects.length >= 20) {
      setToast('This workspace supports up to 20 projects. Export and remove a project first.');
      return;
    }
    const p = {
      id: uid(),
      name,
      industry,
      demo: false,
      competitors: [],
      opportunityState: {},
      opportunityHistory: [],
      researchHistory: [],
      createdAt: new Date().toISOString()
    };
    if (commit({
      ...state,
      activeId: p.id,
      projects: [...state.projects, p]
    })) {
      setModal(null);
      setWelcome(false);
      finishNavigation('overview');
      setToast('Project created. Add 2–5 competitors to get started.');
    }
  }
  function restoreWorkspace(next) {
    if (!commit(next, {
      allowRecovery: true,
      persistent: true
    })) return false;
    setDemoMode(false);
    setWelcome(!next.projects.length);
    finishNavigation('data');
    return true;
  }
  function switchProject(id) {
    requestNavigation(() => {
      if (id === '__new') {
        beginNewProject();
      } else if (commit({
        ...state,
        activeId: id
      })) {
        setSelectedAudience('');
        setSelectedOpportunity('');
        finishNavigation('overview');
      }
    });
  }
  function deleteConfirmed() {
    let ok;
    if (modal.type === 'fresh') ok = commit(emptyWorkspace(), {
      allowRecovery: true
    });else if (modal.type === 'delete') ok = update({
      ...project,
      competitors: project.competitors.filter(c => c.id !== modal.c.id)
    });else {
      const remaining = state.projects.filter(p => p.id !== project.id);
      if (remaining.length) ok = commit({
        ...state,
        projects: remaining,
        activeId: remaining[0].id
      });else {
        ok = commit(emptyWorkspace());
        if(ok)setWelcome(true);
      }
    }
    if (ok) {
      finishNavigation(modal.type === 'delete' ? 'competitors' : 'overview');
      setModal(null);
      if (modal.type === 'fresh') setWelcome(true);
      setToast(modal.type === 'fresh' ? 'Fresh workspace ready.' : 'Deleted from this workspace.');
    }
  }
  useEffect(() => {
    if (!pendingSave) return;
    const warn = e => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [pendingSave]);
  const persistenceNotice = pendingSave ? <div className="storage-warning" role="alert"><p>{t(storageError)}</p><Button icon={Download} onClick={() => download('CompetitorLens-unsaved-backup.json', JSON.stringify(pendingSave, null, 2), 'application/json')}>{t("Download unsaved backup")}</Button></div> : null;
  const dialogs = <>{welcome&&!modal&&persistenceNotice}    {toast && <div className="toast" role="status"><CheckCircle2 size={17} />{t(toast)}<button className="icon-btn" onClick={() => setToast('')} aria-label={t("Dismiss notification")}><X size={14} /></button></div>}
    {modal?.type === 'new' && <NewProject recovery={persistenceNotice} error={pendingSave ? storageError : ""} onSave={newProject} onClose={() => setModal(null)} />}
    {modal?.type === 'docs' && <Documentation onClose={() => setModal(null)} />}
    {modal?.type === 'discard' && <Modal title={t("Leave without saving?")} subtitle={t("Your saved project records will remain unchanged.")} onClose={() => setModal(null)}><div className="modal-body"><p>{t("This workspace has unsaved research or edits. Stay here to finish, or discard the draft and continue.")}</p></div><footer className="modal-footer"><Button onClick={() => setModal(null)}>{t("Keep editing")}</Button><Button variant="primary" onClick={() => {
          const action = modal.action;
          setModal(null);
          setEditorDirty(false);
          setPendingSave(null);
          setStorageError(blocked ? loaded.error : '');
          action();
        }}>{t("Discard changes")}</Button></footer></Modal>}
    {modal?.type === 'external' && <Modal title={t("This workspace changed in another tab.")} subtitle={t("Your current draft has not been discarded.")} onClose={() => setModal(null)}><div className="modal-body"><p>{t("Loading the other tab\u2019s saved workspace will discard this unsaved draft. Keeping the draft will keep your current workspace; saving it later can replace the other tab\u2019s changes.")}</p></div><footer className="modal-footer"><Button onClick={() => setModal(null)}>{t("Keep draft")}</Button><Button variant="primary" onClick={() => {
          setState(modal.next);
          setPendingSave(null); setStorageError(''); setBlocked(false);
          setBlocked(false);
          setStorageError('');
          setModal(null);
          finishNavigation('overview');
        }}>{t("Load saved workspace")}</Button></footer></Modal>}
    {['delete', 'deleteProject', 'fresh'].includes(modal?.type) && <Modal title={modal.type === 'delete' ? t("Delete {0}?", {
      0: modal.c.name
    }) : modal.type === 'fresh' ? t('Start with a fresh workspace?') : t("Delete {0}?", {
      0: project.name
    })} subtitle={t("This changes data stored in this browser.")} onClose={() => setModal(null)}><div className="modal-body">{persistenceNotice}<p>{modal.type === 'delete' ? t('The competitor and its sources will be removed. Audience and opportunity views will update automatically.') : modal.type === 'fresh' ? t('This replaces unreadable saved data with an empty workspace. Download a recovery copy first.') : t('This removes the project, competitors, sources, and validation notes. Export a backup first if you want to keep them.')}</p></div><footer className="modal-footer"><Button onClick={() => setModal(null)}>{t("Cancel")}</Button><Button variant="primary" onClick={deleteConfirmed}>{modal.type === 'fresh' ? t('Start empty workspace') : t('Delete permanently')}</Button></footer></Modal>}</>;
  if (welcome) return <><Welcome onAISettings={() => {
      setWelcome(false);
      finishNavigation('ai');
    }} onNew={beginNewProject} onDemo={() => {
      setDemoMode(true);
      setWelcome(false);
      finishNavigation('overview');
    }} onContinue={() => {
      setDemoMode(false);
      setWelcome(false);
      finishNavigation(blocked ? 'data' : 'overview');
    }} onDocs={() => setModal({
      type: 'docs'
    })} workspaceName={(savedState.projects.find(p => p.id === savedState.activeId) || savedState.projects[0])?.name} canResume={savedState.projects.length > 0} blocked={blocked} storageError={storageError} />{dialogs}</>;
  return <div className="app-shell"><a className="skip-link" href="#main">{t("Skip to content")}</a>{mobile && <button className="nav-scrim" aria-label={t("Close navigation")} onClick={() => setMobile(false)} />}
    <aside className={`sidebar ${mobile ? 'open' : ''}`} aria-label={t("Main navigation")}><div className="logo"><Brand /></div><button className="mobile-close icon-btn" onClick={() => setMobile(false)} aria-label={t("Close navigation")}><X size={20} /></button>
      <div className="project-switcher"><label htmlFor="project-select" className="sr-only">{t("Project")}</label><select id="project-select" value={project.id} onChange={e => switchProject(e.target.value)}>{state.projects.map(p => <option key={p.id} value={p.id}>{p.name}{p.demo ? t(' / DEMO') : ''}</option>)}<option value="__new">{t("+ Create a project")}</option></select></div>
      <nav>{NAV.map(([id, label, Icon]) => <button key={id} aria-label={t(label)} className={`nav-item ${navPage === id ? 'active' : ''}`} onClick={() => go(id)} aria-current={navPage === id ? 'page' : undefined}><Icon size={19} strokeWidth={1.6} /><span>{t(label)}</span></button>)}</nav>
      <div className="sidebar-bottom"><button className={`nav-item ${page === 'data' ? 'active' : ''}`} onClick={() => go('data')}><Database size={19} strokeWidth={1.6} /><span>{t("Data Management")}</span></button><button className="nav-item" onClick={() => requestNavigation(() => {
          setWelcome(true);
          setMobile(false);
          setEditor(null);
          setEditorDirty(false);
          setToast('');
          window.scrollTo(0, 0);
        })}><ArrowLeft size={18} /><span>{t("Back to welcome")}</span></button><div className="save-status"><CheckCircle2 size={16} /><span>{demoMode ? t('Temporary demo workspace') : storageError ? t('Backup recommended') : t('Local workspace saved')}</span></div></div>
    </aside>
    <div className="main-shell"><header className="topbar"><button className="mobile-menu icon-btn" onClick={() => setMobile(true)} aria-label={t("Open navigation")}><Menu size={21} /></button><div className="breadcrumbs"><span>{project.name}</span><i>/</i>{['detail', 'editor'].includes(page) && <><button onClick={() => go('competitors')}>{t("Competitors")}</button><i>/</i></>}<strong>{page==='detail'?pageLabel:t(pageLabel)}</strong></div><LanguageSwitcher /><button aria-label={t("Documentation")} className="documentation" onClick={() => setModal({
          type: 'docs'
        })}><BookOpen size={18} /><span>{t("Documentation")}</span></button></header>
    <main id="main" tabIndex={-1}>{persistenceNotice}{!demoMode && capacity.warning && <div className="notice capacity-notice"><span>{t("Workspace payload:")} {capacity.megabytes} {t("MB. Browser capacity varies. Export a backup before adding more research.")}</span></div>}{demoMode && <div className="demo-session-banner"><strong>{t("Temporary demo workspace")}</strong><span>{t("Changes here are not saved to your browser workspace. Export a backup to keep them. Back to welcome \u2192 Resume Recent Project returns to your saved research.")}</span></div>}{!demoMode && storageError && !pendingSave && <div className="storage-warning" role="alert"><p>{t(storageError)}</p><div className="actions"><Button icon={Download} onClick={() => {
              let raw;
              try {
                raw = localStorage.getItem(STORAGE_KEY);
              } catch {}
              download('CompetitorLens-recovery.json', blocked ? raw || '{}' : JSON.stringify(pendingSave || state, null, 2), 'application/json');
            }}>{t("Download")} {blocked ? t('recovery copy') : t('current backup')}</Button><Button onClick={() => go('data')}>{t("Restore backup")}</Button>{blocked && <Button onClick={() => setModal({
              type: 'fresh'
            })}>{t("Start fresh")}</Button>}</div></div>}
      {page === 'overview' && <Overview key={project.id} project={project} add={add} view={view} edit={edit} go={go} newProject={beginNewProject} openReport={openReport} openOpportunity={id => {
          setSelectedOpportunity(id);
          go('opportunities');
        }} openAudience={key => {
          setSelectedAudience(key);
          go('audience');
        }} />}
      {page === 'research' && <AutomatedResearch key={project.id} project={project} onSave={update} onDirty={setEditorDirty} onDone={finishNavigation} />}
      {page === 'competitors' && <Competitors key={project.id} project={project} add={add} view={view} edit={edit} go={go} />}
      {page === 'detail' && currentCompetitor && <CompetitorDetails key={detail.key} competitor={currentCompetitor} index={project.competitors.indexOf(currentCompetitor)} initialTab={detail.tab} initialField={detail.field} initialSegment={detail.segmentId} onBack={() => go('competitors')} onEdit={edit} onDelete={c => setModal({
          type: 'delete',
          c
        })} />}
      {page === 'editor' && editor && <CompetitorEditor key={editor.key} competitor={editor.c} project={project} initialStep={editor.step} initialAudience={editor.audienceId} onSave={save} onDirty={setEditorDirty} onClose={() => requestNavigation(() => editor.c ? showDetail(editor.c) : finishNavigation('competitors'))} />}
      {page === 'audience' && <Audience key={project.id} project={project} selected={selectedAudience} setSelected={setSelectedAudience} view={view} edit={edit} />}
      {page === 'matrix' && <Matrix key={project.id} project={project} view={view} openReport={openReport} />}
      {page === 'opportunities' && <Opportunities key={project.id} project={project} update={update} view={view} selected={selectedOpportunity} setSelected={setSelectedOpportunity} />}
      {page === 'reports' && <Reports key={project.id} project={project} initialScope={reportScope} />}
      {page === 'ai' && <AISettings />}
      {page === 'data' && <DataManagement recovery={persistenceNotice} key={project.id} state={state} project={project} update={update} notify={setToast} restore={restoreWorkspace} demoMode={demoMode} savedStateForRestore={savedState} deleteProject={() => setModal({
          type: 'deleteProject'
        })} />}
    </main><footer className="app-footer"><span>{t("CompetitorLens \xB7 Independent competitor research")}</span><span>{t("Local workspace \xB7 V1.5")}</span></footer></div>
    {dialogs}
  </div>;
}
