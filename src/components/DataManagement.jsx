import { t } from "../lib/i18n.js";
import { useRef, useState } from 'react';
import { Upload, Download, Database, FileSpreadsheet, ShieldCheck, Trash2 } from 'lucide-react';
import { Button, PageTitle, Notice, Modal } from './UI.jsx';
import { parseCSV, importRows, exportCSV, CSV_COLUMNS, csvCell, download } from '../lib/io.js';
import { validateBackup } from '../lib/model.js';
export default function DataManagement({
  state,
  recovery,
  project,
  update,
  restore,
  deleteProject,
  notify,
  demoMode = false,
  savedStateForRestore = state
}) {
  const csvInput = useRef(),
    backupInput = useRef();
  const [error, setError] = useState(''),
    [pending, setPending] = useState(null),
    [backup, setBackup] = useState(null);
  async function readCSV(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    try {
      if (file.size > 2_000_000) throw new Error('Choose a CSV file smaller than 2 MB.');
      const rows = parseCSV(await file.text());
      const records = importRows(rows, project.competitors);
      setPending(records);
    } catch (e) {
      setError(e.message);
    }
  }
  async function readBackup(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    try {
      if (file.size > 10_000_000) throw new Error('Choose a backup smaller than 10 MB.');
      setBackup(validateBackup(JSON.parse(await file.text())));
    } catch (e) {
      setError(e instanceof SyntaxError ? 'This file is not valid JSON.' : e.message);
    }
  }
  function template() {
    const row = CSV_COLUMNS.map(k => ({
      name: 'Example Competitor',
      url: 'https://example.com',
      positioning: 'Replace this sample with your research',
      features: 'Feature one|Feature two',
      audiences: 'Audience one|Audience two',
      currency: 'USD',
      price_unit: 'month',
      demo: 'false'
    })[k] || '');
    download('CompetitorLens-import-template.csv', '\uFEFF' + [CSV_COLUMNS, row].map(r => r.map(csvCell).join(',')).join('\r\n'), 'text/csv;charset=utf-8');
  }
  return <><PageTitle title={t("Data management")} subtitle={t("Bring information in, keep a backup, and take it with you.")} />{error && <div className="error" role="alert">{t(error)}</div>}<div className="data-summary"><ShieldCheck size={24} /><div><strong>{t("Stored locally in this browser")}</strong><p>{t("No account or usage tracking. Research collection can use the optional local service. Export a backup before moving the app, switching browsers, or clearing browser data.")}</p></div><span>{state.projects.length} {t("project")}{state.projects.length === 1 ? '' : t('s')}</span></div><div className="data-grid"><section className="panel data-card"><FileSpreadsheet size={26} /><h2>{t("Import competitor records")}</h2><p>{t("Bring a CSV into")} <strong>{project.name}</strong>{t(". Preview records before adding them. Up to")} {5 - project.competitors.length} {t("more competitors fit in this project.")}</p><div className="actions"><Button variant="primary" icon={Upload} onClick={() => csvInput.current.click()}>{t("Choose CSV")}</Button><Button onClick={template}>{t("Download template")}</Button></div><input ref={csvInput} type="file" accept=".csv,text/csv" onChange={readCSV} hidden aria-label={t("Import CSV file")} /><details><summary>{t("CSV format & supported columns")}</summary><p>{t("Use UTF-8 and a header row. A name or URL is required. Separate features and audiences with |. Quote values containing commas or line breaks. Import is atomic: invalid rows are not silently skipped.")}</p><code>{CSV_COLUMNS.join(', ')}</code><p>{t("Source fields use keys such as audiences|pricing|features. Demo rows must set demo to true.")}</p></details></section><section className="panel data-card"><Download size={26} /><h2>{t("Export this comparison")}</h2><p>{t("Download all")} {project.competitors.length} {t("competitor records in the current project for spreadsheet analysis.")}</p><Button icon={Download} disabled={!project.competitors.length} onClick={() => {
          download('CompetitorLens-competitors.csv', exportCSV(project.competitors), 'text/csv;charset=utf-8');
          notify('Competitor CSV exported.');
        }}>{t("Export CSV")}</Button><p className="small muted">{t("CSV includes full source and audience-research JSON columns. Full workspace backups also preserve projects and opportunity history. Spreadsheet formulas are neutralized on export.")}</p></section><section className="panel data-card"><Database size={26} /><h2>{t("Back up your workspace")}</h2><p>{t("Save all projects, full evidence, and opportunity decisions in one portable JSON file.")}</p><Button icon={Download} variant="primary" onClick={() => {
          download('CompetitorLens-backup.json', JSON.stringify(state, null, 2), 'application/json');
          notify('Full workspace backup exported.');
        }}>{t("Download full backup")}</Button><p className="small muted">{t("Backups contain your research as readable text. Store them somewhere you trust.")}</p></section><section className="panel data-card"><Upload size={26} /><h2>{t("Restore a backup")}</h2><p>{t("Validate a CompetitorLens V1–V1.5 backup, review its project count, then restore it.")}</p><Button icon={Upload} onClick={() => backupInput.current.click()}>{t("Choose backup")}</Button><input ref={backupInput} type="file" accept=".json,application/json" onChange={readBackup} hidden aria-label={t("Restore backup file")} /><p className="small muted">{t("Restoring replaces this browser\u2019s entire CompetitorLens workspace. Download a backup first.")}</p></section></div><div className="danger-zone"><div><h3>{t("Delete current project")}</h3><p>{t("Remove")} {project.name} {t("and its records from this browser.")}</p></div><Button icon={Trash2} variant="danger-quiet" onClick={deleteProject}>{t("Delete project")}</Button></div>
  {pending && <Modal title={t("Review CSV import")} subtitle={t("{0} new records for {1}", {
      0: pending.length,
      1: project.name
    })} onClose={() => setPending(null)}><div className="modal-body">{recovery}<Notice>{t("These records will be added to the current project. Existing records will be kept.")}</Notice><ul className="import-preview">{pending.map(c => <li key={c.id}><strong>{c.name}</strong><span>{c.url || t('Manual input')} · {c.audiences.length} {t("audiences \xB7")} {c.sources.length} {t("sources")}{c.demo ? t(' · Demo') : ''}</span></li>)}</ul></div><footer className="modal-footer"><Button onClick={() => setPending(null)}>{t("Cancel")}</Button><Button variant="primary" onClick={() => {
          if (update({
            ...project,
            competitors: [...project.competitors, ...pending],
            demo: project.demo || pending.some(c => c.demo)
          })) {
            setPending(null);
            notify('Competitors imported.');
          }
        }}>{t("Import")} {pending.length} {t("records")}</Button></footer></Modal>}
  {backup && <Modal title={t("Restore this workspace?")} subtitle={t("{0} projects \xB7 {1} competitor records", {
      0: backup.projects.length,
      1: backup.projects.reduce((n, p) => n + p.competitors.length, 0)
    })} onClose={() => setBackup(null)}><div className="modal-body">{recovery}{error && <div className="error" role="alert">{t(error)}</div>}<p>{demoMode ? t('This leaves the temporary demo and replaces your saved browser workspace. Your restored projects will persist after reload. Back up the saved workspace first if you need to keep it.') : t('This replaces all current CompetitorLens projects in this browser. You can download the current workspace before continuing.')}</p><Button icon={Download} onClick={() => download('CompetitorLens-before-restore.json', JSON.stringify(savedStateForRestore, null, 2), 'application/json')}>{t("Back up current workspace")}</Button></div><footer className="modal-footer"><Button onClick={() => setBackup(null)}>{t("Cancel")}</Button><Button variant="primary" onClick={() => {
          if (restore(backup)) {
            setBackup(null);
            notify('Workspace restored.');
          } else setError('Restore could not be saved. Your backup is still ready to retry. Download the unsaved recovery copy if browser storage remains unavailable.');
        }}>{t("Replace workspace")}</Button></footer></Modal>}
  </>;
}
