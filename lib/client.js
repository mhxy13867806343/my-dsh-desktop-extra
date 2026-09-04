window.__ModuleLoader__.load({ id: '@mhxy13867806343/dsh-desktop-extra', factory: (require) => {
  const React = require("react");

  const name = 'desktop-extra';
  const inject = ['slots'];
  const base = '/dsh-extra';
  const get = (path, body) => fetch(base + path, { method: body ? 'POST' : 'GET', headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }).then((r) => r.json());

  function insertCss(css) {
    const el = document.createElement('style');
    el.setAttribute('data-desktop-extra', '');
    el.textContent = css;
    document.head.appendChild(el);
    return () => { try { el.remove(); } catch {} };
  }

  function apply(ctx) {
    const slots = ctx.get('slots');
    if (!slots) { console.error('desktop-extra: slots unavailable'); return; }
    const disposeStyles = insertCss('.dshRow{flex:none;align-items:center;width:100%;height:42px;margin:4px 0 0;display:flex;gap:8px}.dshText{flex:1;min-width:0;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-module-float);border:1px solid var(--dsw-alias-border-l2);border-radius:12px;align-items:center;gap:8px;padding:0 12px;font-size:13px;display:flex;min-height:42px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:inherit}.dshText strong{color:var(--dsw-alias-label-primary);font-weight:600}.dshMono{font-family:var(--dsh-font-mono,monospace)}.dshBtn{flex:none;color:#22c55e;background:transparent;border:none;border-radius:8px;padding:4px 8px;font-size:13px;font-family:inherit;cursor:pointer;white-space:nowrap}.dshBtn:hover{background:rgba(34,197,94,.12)}.dshUpd{flex:none;align-items:center;color:var(--dsw-alias-label-secondary);cursor:pointer;background:transparent;border:none;border-radius:12px;height:38px;width:100%;margin:6px 0 0;padding:0 12px;display:flex;font-size:14px;font-family:inherit;text-align:left}.dshUpd .g{color:#22c55e}.dshUpd .y{color:#f59e0b}.dshUpd .r{color:#ef4444}.dshUpd .sub{margin-left:6px;font-size:11px;opacity:.8}.dshUpdMore{flex:none;border:none;background:transparent;color:var(--dsw-alias-label-secondary);font-size:14px;cursor:pointer;padding:0 10px}.dshBackdrop{position:fixed;inset:0;z-index:2990;background:transparent}.dshMenu{position:fixed;min-width:140px;background:var(--dsw-specific-menu);border:1px solid var(--dsw-alias-border-inverted);border-radius:12px;box-shadow:var(--dsw-shadow-lv3);padding:4px;display:flex;flex-direction:column;z-index:2999}.dshMenuBtn{display:flex;align-items:center;gap:8px;width:100%;padding:8px 10px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary);font-size:13px;line-height:18px;cursor:pointer;text-align:left}.dshMenuBtn:hover{background:var(--dsw-alias-interactive-bg-hover)}.dshMenuBtn small{color:var(--dsw-alias-label-tertiary);margin-left:auto;font-size:11px;flex:none}.dshBack{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:4000;display:flex;align-items:center;justify-content:center;padding:24px}.dshModal{background:#17181c;border:1px solid rgba(255,255,255,.16);border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.5);width:760px;max-width:100%;max-height:86vh;display:flex;flex-direction:column;overflow:hidden}.dshModalHead{display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.1)}.dshModalTitle{font-size:15px;font-weight:500;color:var(--dsw-alias-label-primary)}.dshClose{flex:none;width:30px;height:30px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-tertiary);font-size:16px;cursor:pointer;margin-left:auto}.dshImportBtn{flex:none;height:30px;padding:0 14px;border:0;border-radius:8px;background:#2f6bff;color:#fff;font-size:13px;font-family:inherit;cursor:pointer}.dshImportBtn:hover{background:#2459e6}.dshGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.dshTool{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-module-float);border-radius:12px;padding:14px;display:flex;align-items:center;gap:10px}.dshToolName{font-size:14px;font-weight:500;color:var(--dsw-alias-label-primary);line-height:22px}.dshToolCnt{font-size:11px;color:var(--dsw-alias-label-tertiary);margin-top:2px}.dshView{flex:none;height:30px;padding:0 14px;border:0;border-radius:8px;background:#2f6bff;color:#fff;font-size:13px;font-family:inherit;cursor:pointer;flex:1;text-align:center}.dshRec{border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:11px 13px;margin-bottom:8px;cursor:pointer;background:rgba(255,255,255,.03)}.dshRec:hover{background:rgba(255,255,255,.07)}.dshRecTitle{font-size:13px;color:var(--dsw-alias-label-primary);line-height:20px}.dshRecMeta{font-size:11px;color:var(--dsw-alias-label-tertiary);margin-top:2px}.dshMsgRow{display:flex;gap:8px;margin-bottom:10px}.dshMsgRole{flex:none;width:48px;color:var(--dsw-alias-label-tertiary);font-size:11px;text-align:right}.dshMsgText{flex:1;min-width:0;font-size:13px;color:var(--dsw-alias-label-secondary);line-height:20px;white-space:pre-wrap;word-break:break-word}.dshState{padding:50px 0;text-align:center;color:var(--dsw-alias-label-tertiary);font-size:13px}.dshToast{margin:8px 16px;padding:8px 12px;border-radius:8px;background:rgba(34,197,94,.15);color:#22c55e;font-size:12px}');

    const dispose1 = slots.inject('sidebar.footer.action', () => slots.register({ name: 'sidebar.footer.action', id: 'desktop-extra-update', order: 60 }, () => {
      const [st, setSt] = React.useState({ checking: false, current: null, latest: null, up: false, err: null });
      const [menu, setMenu] = React.useState(null);
      React.useEffect(() => { get('/update/status').then((r) => setSt((s) => ({ ...s, current: r.currentVersion, latest: r.latestVersion, up: r.updateAvailable === true, err: r.error }))).catch((e) => setSt((s) => ({ ...s, err: String((e && e.message) || e) }))); }, []);
      const check = () => { setSt((s) => ({ ...s, checking: true })); get('/update/check').then((r) => setSt((s) => ({ ...s, checking: false, err: (r && r.error) || null }))).catch((e) => setSt((s) => ({ ...s, checking: false, err: String((e && e.message) || e) }))); };
      const openMenu = (e) => { const r = e.currentTarget.getBoundingClientRect(); setMenu({ x: Math.max(8, r.right - 160), y: Math.max(8, r.top - 130) }); };
      const open = (url) => { setMenu(null); get('/update/open', { url }).catch(() => {}); };
      const cls = st.up ? (parseInt((st.current || '0').split('.')[0]) < parseInt((st.latest || '0').split('.')[0]) ? 'r' : 'y') : 'g';
      const label = st.checking ? '正在检查…' : (st.current ? ('v' + st.current) : '检查更新');
      const links = [{ label: 'GitHub', caption: '源码', url: 'https://github.com/anywhere-labs/deepseek-harness-desktop' }, { label: '安装包', caption: '下载', url: 'https://github.com/anywhere-labs/deepseek-harness-desktop/releases' }, { label: '官网', caption: 'dshdesktop.cn', url: 'https://dshdesktop.cn' }];
      return React.createElement(React.Fragment, null, React.createElement('div', { style: { display: 'flex', alignItems: 'center', width: '100%', gap: 6 } }, React.createElement('button', { type: 'button', className: 'dshUpd', onClick: check, disabled: st.checking, title: st.err || '检查更新' }, React.createElement('span', { className: cls }, label), React.createElement('span', { className: 'sub' }, st.checking ? '…' : (st.up ? '有新版 v' + st.latest : '最新'))), React.createElement('button', { type: 'button', className: 'dshUpdMore', onClick: openMenu }, '⋯')), menu ? React.createElement(React.Fragment, null, React.createElement('div', { className: 'dshBackdrop', onClick: () => setMenu(null) }), React.createElement('div', { className: 'dshMenu', style: { left: menu.x, top: menu.y } }, links.map((l) => React.createElement('button', { key: l.url, type: 'button', className: 'dshMenuBtn', onClick: () => open(l.url) }, React.createElement('span', null, l.label), React.createElement('small', null, l.caption))))) : null);
    }));

    const dispose2 = slots.inject('sidebar.footer.action', () => slots.register({ name: 'sidebar.footer.action', id: 'desktop-extra-balance', order: 65 }, () => {
      const [st, setSt] = React.useState({ loading: true, key: null, account: null, err: null, shown: false, full: null });
      const [copied, setCopied] = React.useState(false);
      const [menu, setMenu] = React.useState(null);
      const load = () => { get('/kb/status').then((r) => setSt((s) => ({ ...s, loading: false, key: r.key || null, account: r.account || null, err: r.error || null }))).catch((e) => setSt((s) => ({ ...s, loading: false, err: String((e && e.message) || e) }))); };
      React.useEffect(() => { let alive = true; get('/kb/status').then((r) => { if (alive) setSt((s) => ({ ...s, loading: false, key: r.key || null, account: r.account || null, err: r.error || null })); }).catch((e) => { if (alive) setSt((s) => ({ ...s, loading: false, err: String((e && e.message) || e) })); }); return () => { alive = false; }; }, []);
      const toggleReveal = () => { if (st.shown) { setSt((s) => ({ ...s, shown: false, full: null })); return; } get('/kb/reveal').then((r) => { if (r && r.ok) setSt((s) => ({ ...s, shown: true, full: r.value })); }).catch(() => {}); };
      const copy = () => { get('/kb/copy').then((r) => { if (r && r.ok) { setCopied(true); ctx.get('timer').timeout(() => setCopied(false), 1600); } }).catch(() => {}); };
      const go = (page) => { setMenu(null); get('/kb/openPage', { page }).catch(() => {}); };
      const openMore = (e) => { const r = e.currentTarget.getBoundingClientRect(); setMenu({ x: Math.max(8, r.right - 110), y: Math.max(8, r.top - 95) }); };
      const b = st.account && st.account.balances && st.account.balances[0];
      return React.createElement(React.Fragment, null, React.createElement('div', { className: 'dshRow' }, React.createElement('span', { className: 'dshText' }, React.createElement('strong', null, 'DeepSeek'), ' ', b ? ('¥' + b.total) : (st.err || '余额')), React.createElement('button', { type: 'button', className: 'dshBtn', onClick: load, title: '刷新余额' }, '刷新'), React.createElement('button', { type: 'button', className: 'dshBtn', onClick: openMore }, '更多')), st.key ? React.createElement('div', { className: 'dshRow' }, React.createElement('span', { className: 'dshText dshMono' }, st.shown && st.full ? st.full : st.key.masked), React.createElement('button', { type: 'button', className: 'dshBtn', onClick: toggleReveal }, st.shown ? '隐藏' : '查看'), React.createElement('button', { type: 'button', className: 'dshBtn', onClick: copy }, copied ? '✓已复制' : '复制')) : null, menu ? React.createElement(React.Fragment, null, React.createElement('div', { className: 'dshBackdrop', onClick: () => setMenu(null) }), React.createElement('div', { className: 'dshMenu', style: { left: menu.x, top: menu.y } }, React.createElement('button', { type: 'button', className: 'dshMenuBtn', onClick: () => go('topup') }, '充值'), React.createElement('button', { type: 'button', className: 'dshMenuBtn', onClick: () => go('billing') }, '账单'))) : null);
    }));

    const dispose3 = slots.inject('sidebar.footer.action', () => slots.register({ name: 'sidebar.footer.action', id: 'desktop-extra-import-ai', order: 62 }, () => {
      const [open, setOpen] = React.useState(false);
      const [loading, setLoading] = React.useState(false);
      const [tools, setTools] = React.useState([]);
      const [err, setErr] = React.useState(null);
      const [tool, setTool] = React.useState(null);
      const [recs, setRecs] = React.useState([]);
      const [file, setFile] = React.useState(null);
      const [content, setContent] = React.useState(null);
      const [msg, setMsg] = React.useState(null);
      const onOpen = () => { setOpen(true); setTool(null); setFile(null); setContent(null); setMsg(null); setLoading(true); setErr(null); get('/ai/list').then((r) => { setTools(r.tools || []); if (r.error) setErr(r.error); }).catch((e) => setErr(String((e && e.message) || e))).finally(() => setLoading(false)); };
      const openTool = (t) => { setTool(t); setFile(null); setContent(null); setRecs([]); setMsg(null); get('/ai/records', { tool: t.key }).then((r) => setRecs((r && r.records) || [])).catch(() => setRecs([])); };
      const openFile = (rec) => { setFile(rec.file); setContent(null); get('/ai/recordContent', { file: rec.file }).then((r) => setContent((r && r.messages) || [])).catch(() => setContent([])); };
      const doImport = (all) => { if (!tool) return; setMsg(null); get('/ai/import', { tool: tool.key, all, file }).then((r) => setMsg(r && r.count != null ? ('已导入 ' + r.count + ' 条 → 新建会话（重启后左栏可见）') : ((r && r.error) || '导入失败'))).catch((e) => setMsg(String((e && e.message) || e))); };
      const ICON = { codex: '⌨️', cursor: '◉', claude: '✳', trae: '🅣', windsurf: '🏄', gemini: '✦', opencode: '⌥' };
      let body;
      if (file) body = content === null ? React.createElement('div', { className: 'dshState' }, '加载中…') : (content.length === 0 ? React.createElement('div', { className: 'dshState' }, '无消息内容') : content.map((m, i) => React.createElement('div', { key: i, className: 'dshMsgRow' }, React.createElement('div', { className: 'dshMsgRole' }, m.role), React.createElement('div', { className: 'dshMsgText' }, m.text))));
      else if (tool) body = recs.length === 0 ? React.createElement('div', { className: 'dshState' }, '该工具暂无记录') : recs.map((rec) => React.createElement('div', { key: rec.file, className: 'dshRec', onClick: () => openFile(rec) }, React.createElement('div', { className: 'dshRecTitle' }, rec.title || '（无标题）'), React.createElement('div', { className: 'dshRecMeta' }, (rec.count != null ? rec.count + ' 条消息 · ' : '') + (rec.date || ''))));
      else if (loading) body = React.createElement('div', { className: 'dshState' }, '检测中…');
      else if (err) body = React.createElement('div', { className: 'dshState' }, err);
      else if (tools.length === 0) body = React.createElement('div', { className: 'dshState' }, '未检测到其它 AI 工具');
      else body = React.createElement('div', { className: 'dshGrid' }, tools.map((t) => React.createElement('div', { key: t.key, className: 'dshTool' }, React.createElement('div', { style: { flex: 1, minWidth: 0 } }, React.createElement('div', { className: 'dshToolName' }, ICON[t.key] || 'AI', ' ', t.name), React.createElement('div', { className: 'dshToolCnt' }, t.count != null ? t.count + ' 条记录' : '')), React.createElement('button', { type: 'button', className: 'dshView', onClick: () => openTool(t) }, '查看'))));
      const title = file ? '记录内容' : (tool ? tool.name + ' 记录' : '导入其他 AI');
      const toolbar = tool ? React.createElement('div', { className: 'dshRow', style: { borderBottom: '1px solid rgba(255,255,255,.08)', paddingBottom: 10 } }, React.createElement('button', { type: 'button', className: 'dshImportBtn', onClick: () => doImport(true) }, '全部导入'), React.createElement('button', { type: 'button', className: 'dshImportBtn', onClick: () => doImport(false) }, '一键导入')) : null;
      const head = React.createElement('div', { className: 'dshModalHead' }, tool ? React.createElement('button', { type: 'button', className: 'dshBtn', onClick: () => { if (file) { setFile(null); setContent(null); } else { setTool(null); setRecs([]); } } }, '‹ 返回') : null, React.createElement('span', { className: 'dshModalTitle' }, title), React.createElement('button', { type: 'button', className: 'dshClose', onClick: () => setOpen(false) }, '✕'));
      return React.createElement(React.Fragment, null, React.createElement('button', { type: 'button', className: 'dshUpd', style: { margin: '4px 0 0' }, onClick: onOpen }, React.createElement('span', { className: 'g' }, '导入其他 AI')), open ? React.createElement('div', { className: 'dshBack', onClick: () => setOpen(false) }, React.createElement('div', { className: 'dshModal', onClick: (e) => e.stopPropagation() }, head, toolbar, msg ? React.createElement('div', { className: 'dshToast' }, msg) : null, React.createElement('div', { style: { flex: 1, minHeight: 0, overflowY: 'auto', padding: 16 } }, body))) : null);
    }));

    return () => { dispose1(); dispose2(); dispose3(); disposeStyles(); };
  }

  return { name, apply, inject };
}});
