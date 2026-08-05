import { createServer } from 'node:http';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

const root = fileURLToPath(new URL('.', import.meta.url));

// В GitHub интерфейс хранится компактными частями, чтобы установка была автоматической.
// При первом запуске сервер восстанавливает HTML/CSS/JS рядом с собой.
function restoreBundledClient() {
  const required = ['index.html', 'app.js', 'styles.css'];
  if (required.every(name => existsSync(join(root, name)))) return;

  const bundleDir = join(root, '..', 'pixel-dnd-source');
  if (!existsSync(bundleDir)) throw new Error('Pixel DND client bundle is missing');

  const encoded = readdirSync(bundleDir)
    .filter(name => /^chunk-\d+\.b64$/.test(name))
    .sort()
    .map(name => readFileSync(join(bundleDir, name), 'utf8'))
    .join('');
  const tar = gunzipSync(Buffer.from(encoded, 'base64'));

  let offset = 0;
  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every(byte => byte === 0)) break;
    const name = header.subarray(0, 100).toString('utf8').replace(/\0.*$/, '');
    const sizeText = header.subarray(124, 136).toString('ascii').replace(/\0.*$/, '').trim();
    const size = Number.parseInt(sizeText || '0', 8);
    const dataStart = offset + 512;

    if (name.startsWith('pixel-dnd/')) {
      const relative = name.slice('pixel-dnd/'.length);
      if (required.includes(relative)) {
        writeFileSync(join(root, relative), tar.subarray(dataStart, dataStart + size));
      }
    }
    offset = dataStart + Math.ceil(size / 512) * 512;
  }

  if (!required.every(name => existsSync(join(root, name)))) {
    throw new Error('Pixel DND client bundle is incomplete');
  }
}

restoreBundledClient();

// Локально загружает переменные из .env. На Render/Railway переменные
// задаются в панели хостинга, поэтому файл .env туда загружать не нужно.
const envPath = join(root, '.env');
if (existsSync(envPath)) {
  for (const rawLine of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
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

const mime = {
  '.html':'text/html; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.js':'application/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.png':'image/png',
  '.svg':'image/svg+xml',
};

async function readBody(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 1_000_000) throw new Error('Request too large');
  }
  return JSON.parse(body || '{}');
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded) return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress || 'unknown';
}

function checkRateLimit(req) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const limit = Math.max(1, Number(process.env.DM_RATE_LIMIT || 30));
  const ip = getClientIp(req);
  const current = rateLimits.get(ip);

  if (!current || now - current.startedAt >= windowMs) {
    rateLimits.set(ip, { startedAt: now, count: 1 });
    return true;
  }

  current.count += 1;
  return current.count <= limit;
}

async function callOpenAI({ roomId, message, campaign }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');

  const previousResponseId = sessions.get(roomId);
  const response = await fetch('https://api.openai.com/v1/responses', {
    method:'POST',
    headers:{
      'Authorization':`Bearer ${apiKey}`,
      'Content-Type':'application/json',
    },
    body:JSON.stringify({
      model,
      store:true,
      previous_response_id:previousResponseId,
      max_output_tokens:maxOutputTokens,
      reasoning:{ effort:'low' },
      instructions:[
        'Ты опытный мастер настольной ролевой игры в духе D&D 5e.',
        'Веди игру на русском языке, атмосферно, но лаконично: 1–3 коротких абзаца.',
        'Не решай действия игрока за него. Когда исход неочевиден, проси конкретный бросок и называй сложность.',
        'Сохраняй непрерывность мира и учитывай состояние персонажей из переданного снимка кампании.',
        'Не заявляй, что ты официальный продукт Wizards of the Coast.',
      ].join('\n'),
      input:`СНИМОК КАМПАНИИ:\n${JSON.stringify(campaign)}\n\nДЕЙСТВИЕ ИГРОКА:\n${message}`,
    }),
  });

  if (!response.ok) throw new Error(`OpenAI error ${response.status}: ${await response.text()}`);
  const data = await response.json();
  if (data.id) sessions.set(roomId, data.id);
  return data.output_text || data.output?.flatMap(item => item.content || []).find(item => item.type === 'output_text')?.text || 'Мастер не смог сформировать ответ.';
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (req.method === 'GET' && url.pathname === '/health') {
      res.writeHead(200, {'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store'});
      return res.end(JSON.stringify({ ok:true, service:'pixel-dnd' }));
    }

    if (req.method === 'GET' && url.pathname === '/api/status') {
      res.writeHead(200, {'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store'});
      return res.end(JSON.stringify({
        ok:true,
        aiConfigured,
        mode:aiConfigured ? 'openai' : 'demo',
        model:aiConfigured ? model : null,
      }));
    }

    if (req.method === 'POST' && url.pathname === '/api/dm') {
      if (!aiConfigured) {
        res.writeHead(503, {'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store'});
        return res.end(JSON.stringify({error:'OpenAI пока не подключён. Сайт использует встроенный демо-режим.'}));
      }

      if (!checkRateLimit(req)) {
        res.writeHead(429, {'Content-Type':'application/json; charset=utf-8'});
        return res.end(JSON.stringify({error:'Слишком много запросов к мастеру. Попробуйте позже.'}));
      }

      const payload = await readBody(req);
      if (!payload.message || !payload.roomId) {
        res.writeHead(400, {'Content-Type':'application/json; charset=utf-8'});
        return res.end(JSON.stringify({error:'message and roomId are required'}));
      }
      const text = await callOpenAI(payload);
      res.writeHead(200, {'Content-Type':'application/json; charset=utf-8'});
      return res.end(JSON.stringify({text}));
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405); return res.end('Method Not Allowed');
    }

    const safePath = normalize(url.pathname).replace(/^([.][.][/\\])+/, '');
    let filePath = join(root, safePath === '/' ? 'index.html' : safePath);
    try {
      const info = await stat(filePath);
      if (info.isDirectory()) filePath = join(filePath, 'index.html');
    } catch {
      filePath = join(root, 'index.html');
    }

    const data = await readFile(filePath);
    res.writeHead(200, {'Content-Type':mime[extname(filePath)] || 'application/octet-stream'});
    if (req.method === 'HEAD') return res.end();
    res.end(data);
  } catch (error) {
    console.error(error);
    res.writeHead(500, {'Content-Type':'application/json; charset=utf-8'});
    const publicMessage = error.message?.includes('OpenAI')
      ? 'ИИ-мастер временно недоступен. Проверьте API-ключ и баланс OpenAI.'
      : 'Внутренняя ошибка сервера.';
    res.end(JSON.stringify({error:publicMessage}));
  }
});

server.listen(port, host, () => console.log(`Pixel DND: http://${host}:${port}`));
