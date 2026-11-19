import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const port = Number(process.env.PORT || 4173);
// Exposes only the built application, never arbitrary workspace paths.
createServer(async (req,res) => {
  if(req.method !== 'GET' || !['/','/index.html'].includes(req.url.split('?')[0])) {res.writeHead(404);res.end('Not found');return;}
  try {const html=await readFile(new URL('../CompetitorLens.html',import.meta.url));res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});res.end(html);}catch{res.writeHead(503);res.end('Build the app first with npm run build.');}
}).listen(port,'127.0.0.1',()=>console.log(`CompetitorLens preview: http://127.0.0.1:${port}`));
