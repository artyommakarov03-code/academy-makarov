import { createServer } from 'node:http';
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

const root = fileURLToPath(new URL('.', import.meta.url));

function extractTar(tar, accept) {
  let offset = 0;
  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every(byte => byte === 0)) break;
    const name = header.subarray(0, 100).toString('utf8').replace(/\0.*$/, '');
    const sizeText = header.subarray(124, 136).toString('ascii').replace(/\0.*$/, '').trim();
    const size = Number.parseInt(sizeText || '0', 8);
    const start = offset + 512;
    accept(name, tar.subarray(start, start + size));
    offset = start + Math.ceil(size / 512) * 512;
  }
}

function restoreBaseClient() {
  const required = ['index.html', 'app.js', 'styles.css'];
  if (required.every(name => existsSync(join(root, name)))) return;
  const dir = join(root, '..', 'pixel-dnd-source');
  const encoded = readdirSync(dir).filter(name => /^chunk-\d+\.b64$/.test(name)).sort().map(name => readFileSync(join(dir, name), 'utf8')).join('');
  const tar = gunzipSync(Buffer.from(encoded, 'base64'));
  extractTar(tar, (name, data) => {
    if (!name.startsWith('pixel-dnd/')) return;
    const relative = name.slice('pixel-dnd/'.length);
    if (required.includes(relative)) writeFileSync(join(root, relative), data);
  });
}

function restoreGeneratedBundle() {
  const dir = join(root, '..', 'pixel-dnd-assets', 'warhammer40k-ready');
  if (!existsSync(join(dir, 'READY'))) return;
  try {
    const encoded = readdirSync(dir).filter(name => /^chunk-\d+\.b64$/.test(name)).sort().map(name => readFileSync(join(dir, name), 'utf8')).join('');
    const tar = gunzipSync(Buffer.from(encoded, 'base64'));
    extractTar(tar, (name, data) => {
      if (!name.startsWith('pixel-dnd/')) return;
      const relative = name.slice('pixel-dnd/'.length);
      const allowed = ['index.html','app.js','styles.css'].includes(relative) || relative.startsWith('assets/warhammer40k/') || relative.startsWith('data/universes/warhammer40k/');
      if (!allowed || relative.includes('..')) return;
      const destination = join(root, relative);
      mkdirSync(join(destination, '..'), { recursive:true });
      writeFileSync(destination, data);
    });
  } catch (error) {
    console.error('Generated bundle was skipped:', error.message);
  }
}

function installOptionalLoaders() {
  const indexPath = join(root, 'index.html');
  if (!existsSync(indexPath)) return;
  let html = readFileSync(indexPath, 'utf8');
  if (!html.includes('warhammer-loader.js')) {
    html = html.replace('</body>', '  <script src="warhammer-loader.js" defer></script>\n</body>');
    writeFileSync(indexPath, html);
  }
}

restoreBaseClient();
restoreGeneratedBundle();
installOptionalLoaders();

const envPath = join(root, '.env');
if (existsSync(envPath)) {
  for (const rawLine of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 1) continue;
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '0.0.0.0';
const model = process.env.OPENAI_MODEL || 'gpt-5-mini';
const maxOutputTokens = Math.max(100, Math.min(1200, Number(process.env.OPENAI_MAX_OUTPUT_TOKENS || 600)));
const aiConfigured = Boolean(process.env.OPENAI_API_KEY);
const sessions = new Map();
const rateLimits = new Map();
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml'};

async function readBody(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 1_000_000) throw new Error('Request too large');
  }
  return JSON.parse(body || '{}');
}
function clientIp(req) { const f=req.headers['x-forwarded-for']; return typeof f==='string'&&f ? f.split(',')[0].trim() : req.socket.remoteAddress||'unknown'; }
function allowed(req) {
  const now=Date.now(), windowMs=600000, limit=Math.max(1,Number(process.env.DM_RATE_LIMIT||30)), ip=clientIp(req), current=rateLimits.get(ip);
  if(!current||now-current.startedAt>=windowMs){rateLimits.set(ip,{startedAt:now,count:1});return true;}
  current.count+=1; return current.count<=limit;
}

async function callOpenAI({ roomId, message, campaign }) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method:'POST',
    headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},
    body:JSON.stringify({
      model, store:true, previous_response_id:sessions.get(roomId), max_output_tokens:maxOutputTokens, reasoning:{effort:'low'},
      instructions:[
        'Ты опытный мастер настольных ролевых игр. Учитывай выбранную вселенную.',
        'Для мира «Мрачная галактика» веди суровую готическую научную фантастику: укрытия, мораль, пси-опасность и фракционные последствия.',
        'Для фэнтези используй правила в духе D&D 5e.',
        'Отвечай на русском языке, атмосферно и лаконично. Не решай действия за игрока; при неопределённости проси бросок и называй сложность.'
      ].join('\n'),
      input:`СНИМОК КАМПАНИИ:\n${JSON.stringify(campaign)}\n\nДЕЙСТВИЕ ИГРОКА:\n${message}`
    })
  });
  if (!response.ok) throw new Error(`OpenAI error ${response.status}: ${await response.text()}`);
  const data = await response.json();
  if (data.id) sessions.set(roomId, data.id);
  return data.output_text || data.output?.flatMap(item=>item.content||[]).find(item=>item.type==='output_text')?.text || 'Мастер не смог сформировать ответ.';
}

const server = createServer(async (req,res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host||'localhost'}`);
    if (req.method==='GET' && url.pathname==='/health') { res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); return res.end(JSON.stringify({ok:true,service:'pixel-dnd'})); }
    if (req.method==='GET' && url.pathname==='/api/status') { res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); return res.end(JSON.stringify({ok:true,aiConfigured,mode:aiConfigured?'openai':'demo',model:aiConfigured?model:null})); }
    if (req.method==='POST' && url.pathname==='/api/dm') {
      if (!aiConfigured) { res.writeHead(503,{'Content-Type':'application/json; charset=utf-8'}); return res.end(JSON.stringify({error:'OpenAI пока не подключён.'})); }
      if (!allowed(req)) { res.writeHead(429,{'Content-Type':'application/json; charset=utf-8'}); return res.end(JSON.stringify({error:'Слишком много запросов.'})); }
      const payload=await readBody(req);
      if(!payload.message||!payload.roomId){res.writeHead(400,{'Content-Type':'application/json; charset=utf-8'});return res.end(JSON.stringify({error:'message and roomId are required'}));}
      const text=await callOpenAI(payload); res.writeHead(200,{'Content-Type':'application/json; charset=utf-8'}); return res.end(JSON.stringify({text}));
    }
    if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);return res.end('Method Not Allowed');}
    const safePath=normalize(url.pathname).replace(/^([.][.][/\\])+/,'');
    let filePath=join(root,safePath==='/'?'index.html':safePath);
    try{const info=await stat(filePath);if(info.isDirectory())filePath=join(filePath,'index.html');}catch{filePath=join(root,'index.html');}
    const data=await readFile(filePath);res.writeHead(200,{'Content-Type':mime[extname(filePath)]||'application/octet-stream'});if(req.method==='HEAD')return res.end();res.end(data);
  } catch(error) {
    console.error(error);res.writeHead(500,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify({error:error.message?.includes('OpenAI')?'ИИ-мастер временно недоступен.':'Внутренняя ошибка сервера.'}));
  }
});
server.listen(port,host,()=>console.log(`Pixel DND: http://${host}:${port}`));
