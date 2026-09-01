// DSH Desktop 增强插件 —— 宿主端（静态 cordis 插件）
// 用 webServer 注册 sameOrign 的 HTTP 路由，客户端通过 fetch 调用。
// 路由：
//   /dsh-extra/update/status|check|open
//   /dsh-extra/account/status|reveal
//   /dsh-extra/bg/search|set|download|open
export {
  name,
  apply,
  inject,
};

const name = 'desktop-extra';
// webServer 是硬依赖（注册 HTTP 路由用）；其它服务全部走 ctx.get()。
const inject = ['webServer'];

const VERSION_ENDPOINT = 'https://www.dshdesktop.cn/api/desktop/version';
const GITHUB_LATEST = 'https://api.github.com/repos/anywhere-labs/deepseek-harness-desktop/releases/latest';
const RETRY = '--connect-timeout 10 --retry 4 --retry-delay 2 --retry-all-errors ';

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'cache-control': 'no-store',
    'content-type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(payload));
}
function sameOrigin(request) {
  const origin = request.headers.origin;
  const host = request.headers.host;
  if (origin === undefined || host === undefined) return false;
  try { return new URL(origin).host === host; } catch { return false; }
}
async function readJsonBody(request, maxBytes = 65536) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > maxBytes) throw new Error('请求体过大');
    chunks.push(buffer);
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function parseVersion(text) {
  const m = /(?:v)?(\d+)\.(\d+)\.(\d+)/.exec(String(text || '').trim());
  return m ? m[1] + '.' + m[2] + '.' + m[3] : null;
}
function compareVersions(a, b) {
  const pa = String(a).split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d;
  }
  return 0;
}
function maskKey(value) {
  const v = String(value || '');
  return v.length <= 8 ? '••••' : v.slice(0, 4) + '…' + v.slice(-4);
}
function providerOf(ref, value) {
  const n = String(ref || '').toUpperCase();
  const v = String(value || '');
  if (n.includes('DEEPSEEK')) return 'deepseek';
  if (n.includes('ANTHROPIC') || v.startsWith('sk-ant-')) return 'anthropic';
  if (n.includes('GEMINI')) return 'gemini';
  if (n.includes('OPENAI') || n.includes('OPENROUTER')) return 'openai';
  return 'other';
}

const REF_CANDIDATES = ['DEEPSEEK_API_KEY', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY', 'MOONSHOT_API_KEY', 'QWEN_API_KEY', 'ZHIPU_API_KEY', 'DASHSCOPE_API_KEY', 'DOUBAO_API_KEY', 'GROQ_API_KEY', 'MISTRAL_API_KEY', 'XAI_API_KEY', 'OPENROUTER_API_KEY', 'SILICONFLOW_API_KEY', 'VOLC_API_KEY'];

function apply(ctx) {
  const webServer = ctx.get('webServer');
  if (webServer === undefined) return () => {};

  const disposers = [];
  function registerRoute(path, handler) {
    disposers.push(webServer.register({
      kind: 'exact',
      path,
      handler: async (request, response) => {
        if (request.method !== 'POST') {
          response.writeHead(405, { allow: 'POST' });
          response.end();
          return;
        }
        if (!sameOrigin(request)) return sendJson(response, 403, { error: 'untrusted origin' });
        try {
          const body = await readJsonBody(request);
          await handler(body, (status, payload) => sendJson(response, status, payload));
        } catch (error) {
          sendJson(response, 400, { error: error instanceof Error ? error.message : String(error) });
        }
      },
    }));
  }

  function runtimeUpdates() {
    const runtime = ctx.get('desktopRuntime');
    return runtime && runtime.updates ? runtime.updates : undefined;
  }
  function currentVersion() {
    const updates = runtimeUpdates();
    return updates && typeof updates.currentVersion === 'string' ? updates.currentVersion : null;
  }
  function rendererToken() {
    const access = ctx.get('desktopBrowserAccess');
    return access && access.rendererHeader && typeof access.rendererHeader.value === 'string' ? access.rendererHeader.value : undefined;
  }
  function origin() {
    const ws = ctx.get('webServer');
    const port = ws && typeof ws.port === 'number' ? ws.port : 43120;
    return 'http://127.0.0.1:' + String(port);
  }

  async function fetchText(url) {
    const web = ctx.get('web');
    if (web === undefined) throw new Error('web 服务不可用');
    const res = await web.fetch({ url });
    if (!res || res.statusCode < 200 || res.statusCode >= 300 || !res.body) throw new Error('HTTP ' + (res ? String(res.statusCode) : '?'));
    return res.body.content;
  }

  async function latestVersion() {
    try { const parsed = JSON.parse(await fetchText(VERSION_ENDPOINT)); if (parsed && typeof parsed.version === 'string') { const v = parseVersion(parsed.version); if (v) return v; } } catch {}
    try { const parsed = JSON.parse(await fetchText(GITHUB_LATEST)); if (parsed && typeof parsed.tag_name === 'string') { const v = parseVersion(parsed.tag_name); if (v) return v; } } catch {}
    return null;
  }

  async function curlText(command, timeoutMs, outBytes) {
    const shell = ctx.get('shell');
    if (shell === undefined) throw new Error('shell 服务不可用');
    const res = await shell.run(shell.resolve({ command, timeoutMs: timeoutMs || 30000, stdoutMaxBytes: outBytes || 262144 }));
    if (res.exitCode !== 0) throw new Error(((res.stderr && res.stderr.text ? res.stderr.text : '') + (res.stdout && res.stdout.text ? res.stdout.text : '')).slice(0, 300));
    return res.stdout && res.stdout.text ? res.stdout.text : '';
  }
  async function shellRun(command, timeoutMs, outBytes) {
    const shell = ctx.get('shell');
    if (shell === undefined) return { exitCode: 1, stderr: { text: 'shell 服务不可用' }, stdout: { text: '' } };
    return shell.run(shell.resolve({ command, timeoutMs: timeoutMs || 30000, stdoutMaxBytes: outBytes || 8192 }));
  }

  // ---------- 更新 ----------
  registerRoute('/dsh-extra/update/status', async (_body, send) => {
    try {
      const current = currentVersion();
      const latest = await latestVersion();
      send(200, { currentVersion: current, latestVersion: latest, upToDate: !!(current && latest && compareVersions(current, latest) >= 0), updateAvailable: !!(current && latest && compareVersions(current, latest) < 0), desktop: !!runtimeUpdates(), error: null });
    } catch (e) {
      send(200, { currentVersion: null, latestVersion: null, upToDate: null, updateAvailable: false, desktop: false, error: String((e && e.message) || e) });
    }
  });

  registerRoute('/dsh-extra/update/check', async (_body, send) => {
    try {
      const token = rendererToken();
      if (token !== undefined) {
        const o = origin();
        const out = await curlText("curl -sS -m 20 -X POST -H 'Origin: " + o + "' -H 'Content-Type: application/json' -H 'x-dsh-desktop-renderer: " + token + "' -d '{}' " + o + '/api/desktop/updates/check', 25000, 131072);
        let parsed = null; try { parsed = JSON.parse(out); } catch {}
        if (parsed && parsed.accepted === true) return send(200, { ok: true, message: 'accepted' });
        if (parsed && parsed.error) return send(200, { ok: false, error: String(parsed.error) });
        return send(200, { ok: false, error: (out || '空响应').slice(0, 300) });
      }
      const updates = runtimeUpdates();
      if (!updates || typeof updates.confirmDownload !== 'function' || typeof updates.downloadAndOpen !== 'function') return send(200, { ok: false, error: '当前环境不是 DSH Desktop，无法触发更新' });
      const current = currentVersion();
      const latest = await latestVersion();
      if (!current || !latest || compareVersions(current, latest) >= 0) return send(200, { ok: true, message: 'up-to-date', currentVersion: current, latestVersion: latest });
      const confirmed = await updates.confirmDownload(latest);
      if (!confirmed) return send(200, { ok: false, error: 'download-cancelled' });
      await updates.downloadAndOpen(latest, undefined);
      return send(200, { ok: true, message: 'download-started', currentVersion: current, latestVersion: latest });
    } catch (e) { return send(200, { ok: false, error: String((e && e.message) || e) }); }
  });

  registerRoute('/dsh-extra/update/open', async (body, send) => {
    const url = body && typeof body.url === 'string' ? body.url : '';
    if (!/^https:\/\/[A-Za-z0-9.-]+/.test(url)) return send(200, { ok: false, error: '不支持的链接' });
    const shell = ctx.get('shell');
    if (shell === undefined) return send(200, { ok: false, error: 'shell 服务不可用' });
    const res = await shell.run(shell.resolve({ command: 'open "' + url + '"', timeoutMs: 10000, stdoutMaxBytes: 8192 }));
    return send(200, res.exitCode === 0 ? { ok: true, error: null } : { ok: false, error: '打开失败' });
  });

  // ---------- 个人信息 ----------
  async function deepseekAccount(key) {
    const out = await curlText('curl -sS -m 15 https://api.deepseek.com/user/balance -H "Authorization: Bearer ' + key + '"', 20000, 65536);
    const parsed = JSON.parse(out);
    if (parsed && parsed.error) throw new Error(String(parsed.error.message || parsed.error));
    const infos = Array.isArray(parsed.balance_infos) ? parsed.balance_infos : [];
    return { isAvailable: parsed.is_available === true, balances: infos.map((b) => ({ currency: String(b.currency || ''), total: String(b.total_balance ?? ''), granted: String(b.granted_balance ?? ''), toppedUp: String(b.topped_up_balance ?? '') })) };
  }

  registerRoute('/dsh-extra/account/status', async (_body, send) => {
    try {
      const credentials = ctx.get('credentials');
      if (credentials === undefined) return send(200, { keys: [], account: null, accountError: null, error: '凭证服务不可用' });
      const keys = []; const seen = new Set();
      for (const ref of REF_CANDIDATES) {
        let info; try { info = await credentials.describe(ref); } catch { continue; }
        if (!info || !info.configured) continue;
        let resolved; try { resolved = await credentials.resolve(ref); } catch { continue; }
        if (!resolved || !resolved.value) continue;
        keys.push({ ref, label: ref, provider: providerOf(ref, resolved.value), masked: maskKey(resolved.value) });
        seen.add(ref);
      }
      let records = []; try { records = await credentials.listRecords(); } catch {}
      for (const entry of records || []) {
        if (entry.kind !== 'api-key' || seen.has(entry.key)) continue;
        let rec; try { rec = await credentials.readRecord(entry.key); } catch { continue; }
        const value = rec && rec.key ? rec.key : undefined;
        if (typeof value !== 'string' || !value) continue;
        seen.add(entry.key);
        keys.push({ ref: entry.key, label: entry.key, provider: providerOf(entry.key, value), masked: maskKey(value) });
      }
      const deepKey = keys.find((k) => k.provider === 'deepseek');
      let account = null; let accountError = null;
      if (deepKey) {
        try { const resolved = await credentials.resolve(deepKey.ref); if (resolved && resolved.value) account = await deepseekAccount(resolved.value); } catch (e) { accountError = String((e && e.message) || e); }
      }
      return send(200, { keys, account, accountError, error: null });
    } catch (e) { return send(200, { keys: [], account: null, accountError: null, error: String((e && e.message) || e) }); }
  });

  registerRoute('/dsh-extra/account/reveal', async (body, send) => {
    const ref = body && typeof body.ref === 'string' ? body.ref : '';
    try {
      const credentials = ctx.get('credentials');
      if (credentials === undefined) return send(200, { ok: false, error: '凭证服务不可用' });
      const resolved = await credentials.resolve(ref);
      if (!resolved || !resolved.value) return send(200, { ok: false, error: '未找到该 Key' });
      return send(200, { ok: true, value: resolved.value });
    } catch (e) { return send(200, { ok: false, error: String((e && e.message) || e) }); }
  });

  // ---------- 背景壁纸 ----------
  registerRoute('/dsh-extra/bg/search', async (body, send) => {
    const raw = body && typeof body.query === 'string' ? body.query.trim() : '';
    const page = body && typeof body.page === 'number' && body.page > 0 ? body.page : 1;
    try {
      const url = 'https://wallhaven.cc/api/v1/search?categories=010&purity=100&sorting=random&ratios=16x9&page=' + page + (raw ? '&q=' + encodeURIComponent(raw) : '');
      const out = await curlText("curl -sS " + RETRY + "-A 'Mozilla/5.0' '" + url + "'");
      const parsed = JSON.parse(out);
      const items = (parsed.data || []).map((x) => ({ id: String(x.id || ''), thumb: (x.thumbs && x.thumbs.large) || '', full: x.path || '', page: x.url || '', resolution: x.resolution || '' })).filter((i) => i.thumb && i.full);
      const meta = parsed.meta || {};
      if (items.length === 0) throw new Error('无结果');
      return send(200, { ok: true, items, lastPage: meta.last_page || page, total: meta.total || 0, source: 'wallhaven' });
    } catch (e) {
      try {
        const tags = encodeURIComponent(raw ? raw.replace(/\s+/g, '+') : 'anime');
        const url = 'https://safebooru.org/index.php?page=dapi&s=post&q=index&json=1&limit=30&pid=' + ((page - 1) * 30) + '&tags=' + tags;
        const out = await curlText("curl -sS " + RETRY + "-A 'Mozilla/5.0' '" + url + "'");
        const parsed = JSON.parse(out);
        const items = (Array.isArray(parsed) ? parsed : []).map((x) => ({ id: String(x.id || ''), thumb: x.preview_url || '', full: x.sample_url || x.file_url || '', page: x.id ? ('https://safebooru.org/index.php?page=post&s=view&id=' + x.id) : '', resolution: (x.width && x.height) ? x.width + 'x' + x.height : '' })).filter((i) => i.thumb && i.full);
        if (items.length === 0) throw new Error('无结果');
        return send(200, { ok: true, items, lastPage: page + (items.length >= 30 ? 1 : 0), total: 0, source: 'safebooru' });
      } catch (e2) { return send(200, { ok: false, error: String((e && e.message) || e) }); }
    }
  });

  registerRoute('/dsh-extra/bg/set', async (body, send) => {
    const url = body && typeof body.url === 'string' ? body.url : '';
    const name = body && typeof body.name === 'string' ? body.name : 'wallpaper';
    if (!/^https:\/\/[A-Za-z0-9.-]+/.test(url)) return send(200, { ok: false, error: '不支持的链接' });
    const shell = ctx.get('shell');
    if (shell === undefined) return send(200, { ok: false, error: 'shell 服务不可用' });
    const extMatch = /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.exec(url);
    const ext = extMatch ? extMatch[1] : 'jpg';
    const safe = String(name).replace(/[^A-Za-z0-9_-]/g, '_');
    const dir = '$HOME/Downloads/dsh-bg';
    const file = dir + '/' + safe + '.' + ext;
    const mk = await shellRun('mkdir -p ' + dir, 10000, 4096);
    if (mk && mk.exitCode !== 0) return send(200, { ok: false, error: '无法创建目录' });
    let lastErr = ''; let dlOk = false;
    for (let a = 0; a < 2; a++) {
      const dl = await shellRun("curl -sSL " + RETRY + "-m 70 -o \"" + file + "\" \"" + url + "\"", 75000, 8192);
      if (dl && dl.exitCode === 0) { dlOk = true; break; }
      lastErr = (dl && dl.stderr && dl.stderr.text ? dl.stderr.text : '') + (dl && dl.stdout && dl.stdout.text ? dl.stdout.text : '');
    }
    if (!dlOk) return send(200, { ok: false, error: (lastErr || '下载失败').slice(0, 200) });
    const b64 = await shellRun('base64 -i "' + file + '"', 30000, 16 * 1024 * 1024);
    if (b64 && b64.exitCode === 0 && b64.stdout && b64.stdout.text.length > 100) {
      const b64str = b64.stdout.text.replace(/\s+/g, '');
      const mime = (ext === 'png') ? 'image/png' : (ext === 'webp') ? 'image/webp' : (ext === 'gif') ? 'image/gif' : 'image/jpeg';
      return send(200, { ok: true, dataUrl: 'data:' + mime + ';base64,' + b64str, path: file.replace(/^\/Users\/[^/]+/, '~'), url });
    }
    return send(200, { ok: false, error: '读取图片失败' });
  });

  registerRoute('/dsh-extra/bg/download', async (body, send) => {
    const url = body && typeof body.url === 'string' ? body.url : '';
    const name = body && typeof body.name === 'string' ? body.name : 'wallpaper';
    if (!/^https:\/\/[A-Za-z0-9.-]+/.test(url)) return send(200, { ok: false, error: '不支持的链接' });
    const shell = ctx.get('shell');
    if (shell === undefined) return send(200, { ok: false, error: 'shell 服务不可用' });
    const extMatch = /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.exec(url);
    const ext = extMatch ? extMatch[1] : 'jpg';
    const safe = String(name).replace(/[^A-Za-z0-9_-]/g, '_');
    const cmd = 'mkdir -p "$HOME/Downloads/dsh-bg" && curl -sSL ' + RETRY + '-m 70 -o "$HOME/Downloads/dsh-bg/' + safe + '.' + ext + '" "' + url + '" && echo "$HOME/Downloads/dsh-bg/' + safe + '.' + ext + '"';
    const res = await shell.run(shell.resolve({ command: cmd, timeoutMs: 90000, stdoutMaxBytes: 8192 }));
    if (res.exitCode !== 0) return send(200, { ok: false, error: (((res.stderr && res.stderr.text ? res.stderr.text : '') + (res.stdout && res.stdout.text ? res.stdout.text : '')).slice(0, 200) || '下载失败') });
    const out = (res.stdout && res.stdout.text ? res.stdout.text : '').trim();
    const lines = out.split('\n').map((s) => s.trim()).filter(Boolean);
    return send(200, { ok: true, path: (lines.length ? lines[lines.length - 1] : ('~/Downloads/dsh-bg/' + safe + '.' + ext)).replace(/^\/Users\/[^/]+/, '~'), url });
  });

  registerRoute('/dsh-extra/bg/open', async (body, send) => {
    const url = body && typeof body.url === 'string' ? body.url : '';
    if (!/^https:\/\/[A-Za-z0-9.-]+/.test(url)) return send(200, { ok: false, error: '不支持的链接' });
    const shell = ctx.get('shell');
    if (shell === undefined) return send(200, { ok: false, error: 'shell 服务不可用' });
    const res = await shell.run(shell.resolve({ command: 'open "' + url + '"', timeoutMs: 10000, stdoutMaxBytes: 8192 }));
    return send(200, res.exitCode === 0 ? { ok: true, error: null } : { ok: false, error: '打开失败' });
  });

  return () => {
    for (const d of disposers) { if (typeof d === 'function') { try { d() } catch {} } }
  };
}
