// DSH Desktop 增强插件 —— 宿主端（只含：检查更新 / 余额+Key / 导入其他AI）
// 用 webServer 注册 sameOrign 的 HTTP 路由，客户端通过 fetch 调用。
export { name, apply, inject };

const name = 'desktop-extra';
const inject = ['webServer'];

const VERSION_ENDPOINT = 'https://www.dshdesktop.cn/api/desktop/version';
const GITHUB_LATEST = 'https://api.github.com/repos/anywhere-labs/deepseek-harness-desktop/releases/latest';
const RETRY = '--connect-timeout 10 --retry 4 --retry-delay 2 --retry-all-errors ';
const PAGES = { topup: 'https://platform.deepseek.com/top_up', billing: 'https://platform.deepseek.com/transactions' };
const TOOLS = [
  { key: 'claude', name: 'Claude', dir: '$HOME/.claude', countCmd: 'find "$HOME/.claude/projects" -name "*.jsonl" 2>/dev/null | wc -l' },
  { key: 'codex', name: 'Codex', dir: '$HOME/.codex', countCmd: 'find "$HOME/.codex" -name "*.jsonl" 2>/dev/null | wc -l' },
  { key: 'cursor', name: 'Cursor', dir: '$HOME/.cursor', countCmd: 'find "$HOME/Library/Application Support/Cursor/Session Storage" -type f 2>/dev/null | wc -l' },
  { key: 'trae', name: 'Trae', dir: '$HOME/.trae', countCmd: 'find "$HOME/.trae" -maxdepth 2 -name "*.json" 2>/dev/null | wc -l' },
  { key: 'windsurf', name: 'Windsurf', dir: '$HOME/.windsurf', countCmd: 'find "$HOME/.windsurf" -maxdepth 2 \\( -name "*.json" -o -name "*.jsonl" \\) 2>/dev/null | wc -l' },
  { key: 'gemini', name: 'Gemini CLI', dir: '$HOME/.gemini', countCmd: 'find "$HOME/.gemini" -maxdepth 2 -name "*.json" 2>/dev/null | wc -l' },
  { key: 'opencode', name: 'OpenCode', dir: '$HOME/.config/opencode', countCmd: 'find "$HOME/.config/opencode" \\( -name "*.json" -o -name "*.jsonl" \\) 2>/dev/null | wc -l' },
];

function sendJson(response, status, payload) {
  response.writeHead(status, { 'cache-control': 'no-store', 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function apply(ctx) {
  const disposers = [];
  const shell = () => ctx.get('shell');
  const shellRun = async (command, timeout, out) => {
    const s = shell();
    if (!s) return { exitCode: 1, stderr: { text: 'shell 服务不可用' }, stdout: { text: '' } };
    return s.run(s.resolve({ command, timeoutMs: timeout || 25000, stdoutMaxBytes: out || 65536 }));
  };
  const curlText = async (command, timeout, out) => {
    const r = await shellRun(command, timeout, out);
    if (r.exitCode !== 0) throw new Error(String((r.stderr && r.stderr.text ? r.stderr.text : '') + (r.stdout && r.stdout.text ? r.stdout.text : '')).slice(0, 300));
    return r.stdout && r.stdout.text ? r.stdout.text : '';
  };
  const sameOrigin = (request) => {
    const origin = request.headers.origin;
    const host = request.headers.host;
    if (!origin || !host) return false;
    try { return new URL(origin).host === host; } catch { return false; }
  };
  const route = (path, fn) => {
    const handler = (request, response) => {
      if (!sameOrigin(request)) return sendJson(response, 403, { error: 'cross-origin' });
      Promise.resolve()
        .then(() => fn(request))
        .then((payload) => sendJson(response, 200, payload))
        .catch((e) => sendJson(response, 500, { error: String((e && e.message) || e) }));
    };
    disposers.push(ctx.get('webServer').register({ kind: 'exact', path, handler }));
  };
  const readBody = (request) => new Promise((resolve) => {
    let body = '';
    request.on('data', (c) => { body += c; });
    request.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch { resolve({}); } });
    request.on('error', () => resolve({}));
  });

  // ---------- 检查更新 ----------
  const parseVersion = (text) => { const m = /(?:v)?(\d+)\.(\d+)\.(\d+)/.exec(String(text || '').trim()); return m ? m[1] + '.' + m[2] + '.' + m[3] : null; };
  const compareVersions = (a, b) => { const pa = String(a).split('.').map((n) => parseInt(n, 10) || 0); const pb = String(b).split('.').map((n) => parseInt(n, 10) || 0); for (let i = 0; i < 3; i++) { const d = (pa[i] || 0) - (pb[i] || 0); if (d !== 0) return d; } return 0; };
  const runtimeUpdates = () => { const runtime = ctx.get('desktopRuntime'); return runtime && runtime.updates ? runtime.updates : undefined; };
  const currentVersion = () => { const u = runtimeUpdates(); return u && typeof u.currentVersion === 'string' ? u.currentVersion : null; };
  const fetchText = async (url) => { const web = ctx.get('web'); if (!web) throw new Error('web 服务不可用'); const res = await web.fetch({ url }); if (!res || res.statusCode < 200 || res.statusCode >= 300 || !res.body) throw new Error('HTTP ' + (res ? String(res.statusCode) : '?')); return res.body.content; };
  const latestVersion = async () => {
    try { const parsed = JSON.parse(await fetchText(VERSION_ENDPOINT)); if (parsed && typeof parsed.version === 'string') { const v = parseVersion(parsed.version); if (v) return v; } } catch {}
    try { const parsed = JSON.parse(await fetchText(GITHUB_LATEST)); if (parsed && typeof parsed.tag_name === 'string') { const v = parseVersion(parsed.tag_name); if (v) return v; } } catch {}
    return null;
  };
  const rendererToken = () => { const access = ctx.get('desktopBrowserAccess'); return access && access.rendererHeader && typeof access.rendererHeader.value === 'string' ? access.rendererHeader.value : undefined; };
  const origin = () => { const ws = ctx.get('webServer'); const port = ws && typeof ws.port === 'number' ? ws.port : 43120; return 'http://127.0.0.1:' + String(port); };

  route('/dsh-extra/update/status', async () => {
    const current = currentVersion();
    const latest = await latestVersion();
    return { currentVersion: current, latestVersion: latest, upToDate: !!(current && latest && compareVersions(current, latest) >= 0), updateAvailable: !!(current && latest && compareVersions(current, latest) < 0), error: null };
  });
  route('/dsh-extra/update/check', async () => {
    const token = rendererToken();
    if (token !== undefined) {
      const o = origin();
      const out = await curlText("curl -sS -m 20 -X POST -H 'Origin: " + o + "' -H 'Content-Type: application/json' -H 'x-dsh-desktop-renderer: " + token + "' -d '{}' " + o + '/api/desktop/updates/check');
      let parsed = null; try { parsed = JSON.parse(out); } catch {}
      if (parsed && parsed.accepted === true) return { ok: true, message: 'accepted' };
      if (parsed && parsed.error) return { ok: false, error: String(parsed.error) };
      return { ok: false, error: (out || '空响应').slice(0, 300) };
    }
    const updates = runtimeUpdates();
    if (!updates || typeof updates.confirmDownload !== 'function' || typeof updates.downloadAndOpen !== 'function') return { ok: false, error: '当前环境不是 DSH Desktop，无法触发更新' };
    const current = currentVersion();
    const latest = await latestVersion();
    if (!current || !latest || compareVersions(current, latest) >= 0) return { ok: true, message: 'up-to-date', currentVersion: current, latestVersion: latest };
    const confirmed = await updates.confirmDownload(latest);
    if (!confirmed) return { ok: false, error: 'download-cancelled' };
    await updates.downloadAndOpen(latest, undefined);
    return { ok: true, message: 'download-started', currentVersion: current, latestVersion: latest };
  });
  route('/dsh-extra/update/open', async (request) => {
    const body = await readBody(request);
    const url = body && typeof body.url === 'string' ? body.url : '';
    if (!/^https:\/\/[A-Za-z0-9.-]+/.test(url)) return { ok: false };
    const res = await shellRun('open "' + url + '"', 10000, 8192);
    return { ok: res.exitCode === 0 };
  });

  // ---------- 余额 + Key ----------
  const maskKey = (v) => { const s = String(v || ''); return s.length <= 8 ? '••••' : s.slice(0, 4) + '…' + s.slice(-4); };
  const getDeepKey = async () => {
    const credentials = ctx.get('credentials');
    if (!credentials) return null;
    try { const info = await credentials.describe('DEEPSEEK_API_KEY'); if (info && info.configured) { const resolved = await credentials.resolve('DEEPSEEK_API_KEY'); return resolved && resolved.value ? resolved.value : null; } } catch {}
    return null;
  };
  const deepseekAccount = async (key) => {
    const out = await curlText('curl -sS -m 15 https://api.deepseek.com/user/balance -H "Authorization: Bearer ' + key + '"');
    const parsed = JSON.parse(out);
    if (parsed && parsed.error) throw new Error(String(parsed.error.message || parsed.error));
    const infos = Array.isArray(parsed.balance_infos) ? parsed.balance_infos : [];
    return { isAvailable: parsed.is_available === true, balances: infos.map((b) => ({ total: String(b.total_balance ?? ''), granted: String(b.granted_balance ?? ''), toppedUp: String(b.topped_up_balance ?? '') })) };
  };
  route('/dsh-extra/kb/status', async () => {
    const key = await getDeepKey();
    let account = null; let err = null;
    if (key) { try { account = await deepseekAccount(key); } catch (e) { err = String((e && e.message) || e); } }
    return { key: key ? { masked: maskKey(key), ref: 'DEEPSEEK_API_KEY' } : null, account, error: err };
  });
  route('/dsh-extra/kb/reveal', async () => { const key = await getDeepKey(); return key ? { ok: true, value: key } : { ok: false, error: '未找到 DeepSeek Key' }; });
  route('/dsh-extra/kb/copy', async () => {
    const key = await getDeepKey();
    if (!key) return { ok: false, error: '未找到 DeepSeek Key' };
    const esc = key.replace(/'/g, "'\\''");
    const res = await shellRun("printf %s '" + esc + "' | pbcopy", 10000, 8192);
    return { ok: res.exitCode === 0 };
  });
  route('/dsh-extra/kb/openPage', async (request) => {
    const body = await readBody(request);
    const page = body && typeof body.page === 'string' ? body.page : 'topup';
    const url = PAGES[page] || PAGES.topup;
    const res = await shellRun('open "' + url + '"', 10000, 8192);
    return { ok: res.exitCode === 0 };
  });

  // ---------- 导入其他 AI ----------
  const extractText = (content) => { if (typeof content === 'string') return content; if (Array.isArray(content)) return content.map((x) => (x && (x.text || x.content)) || '').join(' '); if (content && content.text) return content.text; return ''; };
  const listRecords = async (tool) => {
    let files = [];
    if (tool.key === 'claude') {
      const r = await shellRun('find "$HOME/.claude/projects" -name "*.jsonl" 2>/dev/null | head -60');
      if (r.exitCode === 0 && r.stdout && r.stdout.text) files = r.stdout.text.split('\n').filter(Boolean);
      const recs = [];
      for (const f of files) {
        const c = await shellRun('head -c 30000 "' + f + '"');
        let title = ''; let date = ''; let count = null;
        if (c.exitCode === 0 && c.stdout && c.stdout.text) {
          const lines = c.stdout.text.split('\n').filter(Boolean); count = lines.length;
          for (const line of lines) { try { const rec = JSON.parse(line); const msg = rec.message || rec; if ((msg.role || rec.role) === 'user') { const t = extractText(msg.content); if (t && !title) title = t.slice(0, 90); } if ((rec.timestamp || rec.date) && !date) date = String(rec.timestamp || rec.date).slice(0, 10); } catch {} }
        }
        recs.push({ file: f, title: title || '(无标题)', count, date });
      }
      return recs;
    }
    if (tool.key === 'codex') {
      const r = await shellRun('find "$HOME/.codex/sessions" -name "*.jsonl" 2>/dev/null | head -60');
      if (r.exitCode === 0 && r.stdout && r.stdout.text) files = r.stdout.text.split('\n').filter(Boolean);
      const recs = [];
      for (const f of files) {
        const c = await shellRun('head -c 30000 "' + f + '"');
        let title = ''; let date = ''; let count = null;
        if (c.exitCode === 0 && c.stdout && c.stdout.text) {
          const lines = c.stdout.text.split('\n').filter(Boolean); count = lines.length;
          for (const line of lines) { try { const rec = JSON.parse(line); const p = rec.payload || {}; if (rec.type === 'session_meta' && p.timestamp && !date) date = String(p.timestamp).slice(0, 10); if (rec.type === 'response_item' && p.role === 'user') { const t = extractText(p.content); if (t && !title) title = t.slice(0, 90); } } catch {} }
        }
        recs.push({ file: f, title: title || '(无标题)', count, date });
      }
      return recs;
    }
    return [];
  };
  const readMessages = async (file) => {
    const r = await shellRun('cat "' + file + '" 2>/dev/null | head -c 200000', 20000, 262144);
    const messages = [];
    if (r.exitCode === 0 && r.stdout && r.stdout.text) {
      for (const line of r.stdout.text.split('\n')) {
        if (!line.trim()) continue;
        try {
          const rec = JSON.parse(line);
          let m = rec.message || rec; let role = m.role; let content = m.content;
          if (rec.payload) { m = rec.payload; role = m.role; content = m.content; }
          if (!role) continue;
          const text = extractText(content);
          if (text) messages.push({ role, text: text.slice(0, 4000) });
        } catch {}
      }
    }
    return messages;
  };
  const currentCwd = async () => {
    const r = await shellRun('pwd', 8000, 4096);
    if (r.exitCode === 0 && r.stdout && r.stdout.text) return r.stdout.text.trim();
    return process.cwd();
  };

  route('/dsh-extra/ai/list', async () => {
    const tools = [];
    for (const t of TOOLS) {
      const exists = await shellRun('test -d ' + t.dir + ' && echo yes || echo no', 8000, 4096);
      const present = exists.exitCode === 0 && exists.stdout && exists.stdout.text && exists.stdout.text.trim() === 'yes';
      if (!present) continue;
      let count = null;
      const c = await shellRun(t.countCmd, 12000, 8192);
      if (c.exitCode === 0 && c.stdout && c.stdout.text) count = parseInt(c.stdout.text.trim(), 10) || 0;
      tools.push({ key: t.key, name: t.name, dir: t.dir.replace('$HOME', '~'), count });
    }
    return { tools, error: null };
  });
  route('/dsh-extra/ai/records', async (request) => {
    const body = await readBody(request);
    const key = body && typeof body.tool === 'string' ? body.tool : '';
    const tool = TOOLS.find((t) => t.key === key);
    if (!tool) return { records: [] };
    try { return { records: await listRecords(tool) }; } catch (e) { return { records: [], error: String((e && e.message) || e) }; }
  });
  route('/dsh-extra/ai/recordContent', async (request) => {
    const body = await readBody(request);
    const f = body && typeof body.file === 'string' ? body.file : '';
    if (!f) return { messages: [] };
    return { messages: await readMessages(f) };
  });
  route('/dsh-extra/ai/import', async (request) => {
    const body = await readBody(request);
    const key = body && typeof body.tool === 'string' ? body.tool : '';
    const all = body && body.all === true;
    const file = body && typeof body.file === 'string' ? body.file : '';
    try {
      const tool = TOOLS.find((t) => t.key === key);
      if (!tool) return { ok: false, error: '未知工具' };
      let messages = [];
      if (file) messages = await readMessages(file);
      else { const recs = await listRecords(tool); const files = recs.slice(0, all ? 200 : 20).map((r) => r.file); for (const f of files) messages = messages.concat(await readMessages(f)); }
      if (!messages.length) return { ok: true, count: 0 };
      const sp = ctx.get('sessionPersistence');
      if (sp) {
        const cwd = await currentCwd();
        const id = 'session-' + (crypto && crypto.randomUUID ? crypto.randomUUID() : (String(Date.now()) + Math.random().toString(16).slice(2)));
        const header = { version: 1, id, createdAt: Date.now(), cwd, isSeeded: false };
        await sp.create(header);
        await sp.append(id, buildEvents(messages));
        await registerSession(cwd, id);
        return { ok: true, count: messages.length, sessionId: id };
      }
      return { ok: true, count: messages.length };
    } catch (e) { return { ok: false, error: String((e && e.message) || e) }; }
  });

  // 会话构建/登记
  const buildEvents = (messages) => {
    const evts = []; let step = 0;
    for (const m of messages) {
      if (m.role !== 'user' && m.role !== 'assistant') continue;
      step++;
      evts.push({ type: 'step/start', data: { turn: 1, step } });
      const mid = 'm' + step;
      if (m.role === 'user') evts.push({ type: 'user/message', data: { id: mid, role: 'user', content: [{ type: 'text', text: String(m.text) }], source: { kind: 'user' } } });
      else evts.push({ type: 'assistant/message', data: { turn: 1, step, message: { id: mid, role: 'assistant', content: [{ type: 'text', text: String(m.text) }], source: { kind: 'model', provider: 'imported', model: 'imported' } } } });
      evts.push({ type: 'step/end', data: { turn: 1, step } });
    }
    if (!evts.length) return [];
    const out = [{ type: 'turn/start', data: { turn: 1 } }, ...evts, { type: 'turn/end', data: { turn: 1, reason: { kind: 'completed' } } }];
    return out.map((e, i) => ({ type: e.type, seq: i + 1, time: Date.now() + i, data: e.data }));
  };
  const registerSession = async (cwd, id) => {
    let py = "import json,os,time\np=os.path.expanduser('~/.dsh/storages/workspace.json')\nd=json.load(open(p))\ncwd=" + JSON.stringify(cwd) + "\nsid=" + JSON.stringify(id) + "\nws=d.get('tables',{}).get('workspaces',{})\nfor wid,w in ws.items():\n    if str(w.get('path'))==cwd:\n        if sid not in w.get('sessionIds',[]): w.setdefault('sessionIds',[]).append(sid)\n        w['updatedAt']=int(time.time()*1000)\n        break\njson.dump(d,open(p,'w'))";
    const code = "cat > /tmp/dsh_wsreg.py <<'PYEOF'\n" + py + "\nPYEOF\npython3 /tmp/dsh_wsreg.py";
    await shellRun(code, 20000, 8192);
  };

  return () => { for (const d of disposers) { if (typeof d === 'function') { try { d() } catch {} } } };
}
