import { mkdir, writeFile, readFile, copyFile } from 'node:fs/promises';
import { initialState } from '../src/lib/demo.js';
import { CSV_COLUMNS, csvCell, exportCSV } from '../src/lib/io.js';
import { reportHTML } from '../src/lib/report.js';
await mkdir('examples',{recursive:true});
const state=initialState();
await writeFile('examples/demo-project-v1.5.json',JSON.stringify(state,null,2));
await writeFile('examples/demo-competitors.csv',exportCSV(state.projects[0].competitors));
await writeFile('examples/demo-report.html',reportHTML(state.projects[0],{title:'Brew & Co. — Demo competitor review',includeSources:true,includeOpportunities:true,note:'Fictional demonstration only. Validate all hypotheses with real research before making a business decision.'}));
const row=CSV_COLUMNS.map(k=>({name:'Your competitor',url:'https://example.com',currency:'USD',price_unit:'month',features:'Feature one|Feature two',audiences:'Audience one|Audience two',demo:'false'}[k]||''));
await writeFile('examples/competitors-template.csv','\uFEFF'+[CSV_COLUMNS,row].map(r=>r.map(csvCell).join(',')).join('\r\n'));
const packages=['react','react-dom','scheduler','lucide-react'];
let notices='CompetitorLens V1.5 — Third-party runtime notices\n\n';
for(const name of packages){const pkg=JSON.parse(await readFile(`node_modules/${name}/package.json`,'utf8'));notices+=`\n${name} ${pkg.version}\n${'='.repeat(60)}\n`+await readFile(`node_modules/${name}/LICENSE`,'utf8')+'\n';}
notices+='\nBundled Windows research runtime: Node.js 24.16.0 (OpenJS Foundation).\nSee runtime/LICENSE.txt for its complete license and dependency notices.\nThe native launcher source is service/Launcher.cs and uses the Windows .NET Framework.\n';
await writeFile('THIRD-PARTY-NOTICES.txt',notices);
console.log('Example files and runtime license notices generated.');
