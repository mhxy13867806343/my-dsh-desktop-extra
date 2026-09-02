window.__ModuleLoader__.load({ id: 'desktop-extra', factory: (require) => {
  const React = require("react");
// DSH Desktop 增强插件 —— 客户端
// 注册：sidebar.footer.action 的更新/主题/链接行、settings.general.item 的个人信息行、sidebar.footer.action 的背景行 + 居中弹窗
// 静态 ESM 客户端插件需要自行 import React（动态闭包才会注入 React）。

const name = 'desktop-extra';
const inject = ['slots'];

function apply(ctx) {
  const slots = ctx.get('slots');
  if (slots === undefined) { console.error('dsh-extra: slots service unavailable in this client ctx'); return; }
  const theme = ctx.get('theme');
  const timer = ctx.get('timer');

  // ---------- 背景持久化（localStorage 跨重启保留选择） ----------
  let currentBg = null;
  let bgStyleEl = null;
  function storeGet() { try { return JSON.parse(window.localStorage.getItem('dsh-bg-config') || 'null'); } catch { return null; } }
  function storeSet(cfg) { try { window.localStorage.setItem('dsh-bg-config', JSON.stringify(cfg)); } catch {} }
  function storeClear() { try { window.localStorage.removeItem('dsh-bg-config'); } catch {} }
  function historyGet() { try { return JSON.parse(window.localStorage.getItem('dsh-bg-history') || '[]'); } catch { return []; } }
  function historySet(h) { try { window.localStorage.setItem('dsh-bg-history', JSON.stringify(h.slice(0, 12))); } catch {} }
  function dlGet() { try { return JSON.parse(window.localStorage.getItem('dsh-bg-downloaded') || '[]'); } catch { return []; } }
  function dlSet(d) { try { window.localStorage.setItem('dsh-bg-downloaded', JSON.stringify(d.slice(0, 120))); } catch {} }
  function catsGet() { try { return JSON.parse(window.localStorage.getItem('dsh-bg-cats') || '[]'); } catch { return []; } }
  function catsSet(c) { try { window.localStorage.setItem('dsh-bg-cats', JSON.stringify(c.slice(0, 10))); } catch {} }
  function shistGet() { try { return JSON.parse(window.localStorage.getItem('dsh-bg-searchhist') || '[]'); } catch { return []; } }
  function shistSet(s) { try { window.localStorage.setItem('dsh-bg-searchhist', JSON.stringify(s.slice(0, 12))); } catch {} }
  function srcGet() { try { return window.localStorage.getItem('dsh-bg-source') || 'wallhaven'; } catch { return 'wallhaven'; } }
  function srcSet(x) { try { window.localStorage.setItem('dsh-bg-source', x); } catch {} }
  function isDark() { try { return theme.getTheme().active.colorScheme === 'dark'; } catch { return false; } }

  // 静态 cordis 插件：客户端→宿主通过 webServer 的 sameOrign HTTP 路由（fetch），不再是动态的 host.call。
  async function call(path, args) {
    const res = await fetch('/dsh-extra/' + path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(args || {}),
    });
    return res.json();
  }
  // 静态客户端没有动态的 styles.insert，改为手动注入 <style> 节点。
  function insertCss(cssText) {
    const tag = document.createElement('style');
    tag.setAttribute('data-dsh-extra', '');
    tag.textContent = cssText;
    document.head.appendChild(tag);
    return () => { try { tag.remove(); } catch {} };
  }

  function ensureStyleEl() {
    if (typeof document === 'undefined') return null;
    if (bgStyleEl && bgStyleEl.isConnected) return bgStyleEl;
    bgStyleEl = document.createElement('style'); bgStyleEl.setAttribute('data-dsh-bg', ''); document.head.appendChild(bgStyleEl);
    return bgStyleEl;
  }
  function setBgCss(cssText) { const el = ensureStyleEl(); if (el) el.textContent = cssText || ''; }
  function buildBgCss(cfg, dark) {
    const veil = dark ? 'rgba(10,12,18,0.3)' : 'rgba(250,251,253,0.38)';
    const b = dark ? 'rgba(13,15,20,0.3)' : 'rgba(247,248,250,0.38)';
    const l1 = dark ? 'rgba(24,27,34,0.4)' : 'rgba(255,255,255,0.44)';
    const l2 = dark ? 'rgba(30,33,42,0.36)' : 'rgba(255,255,255,0.4)';
    const l3 = dark ? 'rgba(40,43,52,0.38)' : 'rgba(255,255,255,0.42)';
    const ov = dark ? 'rgba(24,27,34,0.48)' : 'rgba(255,255,255,0.53)';
    const menu = dark ? 'rgba(30,33,42,0.53)' : 'rgba(255,255,255,0.58)';
    const sb = dark ? 'rgba(13,15,20,0.38)' : 'rgba(255,255,255,0.43)';
    return 'html{background:transparent !important}' + 'body{background:transparent !important}' + '#root{background:transparent !important}' +
      '#root{--dsw-alias-bg-base:' + b + ' !important;--dsw-alias-bg-layer-1:' + l1 + ' !important;--dsw-alias-bg-layer-2:' + l2 + ' !important;--dsw-alias-bg-layer-3:' + l3 + ' !important;--dsw-alias-bg-overlay:' + ov + ' !important;--dsw-specific-menu:' + menu + ' !important;--dsw-specific-sidebar-fill:' + sb + ' !important}' +
      'body::before{content:"";position:fixed;inset:0;z-index:-1;background:url("' + cfg.url + '") center/cover no-repeat fixed}' +
      'body::after{content:"";position:fixed;inset:0;z-index:-1;background:' + veil + '}';
  }
  function applyBackground(cfg, onApplied) { currentBg = cfg || null; setBgCss(cfg && cfg.url ? buildBgCss(cfg, isDark()) : ''); if (onApplied) onApplied(); }
  ctx.on('theme/change', () => { if (currentBg) setBgCss(buildBgCss(currentBg, isDark())); });
  try { applyBackground(storeGet()); } catch {}

  // ---------- 通用图标 ----------
  function RefreshIcon({ size, spin }) {
    return React.createElement('svg', { className: 'dui-icon' + (spin ? ' spin' : ''), width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
      React.createElement('path', { d: 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8' }), React.createElement('path', { d: 'M21 3v5h-5' }),
      React.createElement('path', { d: 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16' }), React.createElement('path', { d: 'M8 16H3v5' }));
  }
  function ArrowUpIcon({ size }) {
    return React.createElement('svg', { className: 'dui-icon', width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
      React.createElement('path', { d: 'M12 19V5' }), React.createElement('path', { d: 'm5 12 7-7 7 7' }));
  }
  function ThemeIcon({ mode, size }) {
    const s = size || 14;
    if (mode === 'light') return React.createElement('svg', { className: 'dui-icon', width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
      React.createElement('circle', { cx: 12, cy: 12, r: 4 }), React.createElement('path', { d: 'M12 2v2' }), React.createElement('path', { d: 'M12 20v2' }), React.createElement('path', { d: 'm4.93 4.93 1.41 1.41' }), React.createElement('path', { d: 'm17.66 17.66 1.41 1.41' }), React.createElement('path', { d: 'M2 12h2' }), React.createElement('path', { d: 'M20 12h2' }), React.createElement('path', { d: 'm6.34 17.66-1.41 1.41' }), React.createElement('path', { d: 'm19.07 4.93-1.41 1.41' }));
    if (mode === 'dark') return React.createElement('svg', { className: 'dui-icon', width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
      React.createElement('path', { d: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z' }));
    return React.createElement('svg', { className: 'dui-icon', width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
      React.createElement('rect', { x: 2, y: 3, width: 20, height: 14, rx: 2 }), React.createElement('path', { d: 'M8 21h8' }), React.createElement('path', { d: 'M12 17v4' }));
  }
  function ChevronDownIcon({ size }) {
    return React.createElement('svg', { className: 'dui-icon', width: size || 14, height: size || 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
      React.createElement('path', { d: 'm6 9 6 6 6-6' }));
  }

  ctx.effect(() => {
    const disposeStyles = insertCss(
      // 通用
      '.dui-icon{flex:none;display:inline-flex}.dui-icon.spin svg{animation:duiSpin 1s linear infinite}' +
      '@keyframes duiSpin{to{transform:rotate(360deg)}}' +
      // 更新行
      '.duiUpdateWrap{flex:none;flex-direction:column;align-items:stretch;width:100%;margin:8px 0 0;display:flex;position:relative;gap:2px}' +
      '.duiUpdateButtons{align-items:center;width:100%;display:flex;gap:2px;height:42px}' +
      '.duiUpdateBadge{flex:1;min-width:0;height:42px;color:var(--dsw-alias-label-primary);cursor:pointer;background:0 0;border:none;border-radius:12px;align-items:center;gap:8px;padding:0 10px 0 8px;font-family:inherit;font-size:14px;display:inline-flex;overflow:hidden;text-align:left}' +
      '.duiUpdateBadge:hover{background:var(--dsw-alias-interactive-bg-hover)}.duiUpdateBadge:disabled{opacity:.55;cursor:default}' +
      '.duiUpdateBadge.update{background:#2f6bff;color:#fff}.duiUpdateBadge.update:hover{background:#2459e6}.duiUpdateBadge.update .duiUpdateLabel{color:#fff;font-weight:500}' +
      '.duiUpdateLabel{text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}' +
      '.duiUpdateCount{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;flex:none;margin-left:auto;font-size:12px;line-height:16px}.duiUpdateCount.ok{color:var(--dsw-alias-state-success-primary)}.duiUpdateCount.avail{color:var(--dsw-alias-state-warn-primary)}' +
      '.duiUpdateNewVersion{flex:none;margin-left:auto;display:inline-flex;align-items:center;background:rgba(255,255,255,.2);color:#fff;border-radius:999px;padding:2px 8px;font-size:12px;line-height:16px;font-variant-numeric:tabular-nums}' +
      '.duiUpdateMore{flex:none;width:32px;height:32px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:none;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:15px;line-height:1;padding:0}' +
      '.duiUpdateMore:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary)}' +
      '.duiThemeRow{flex:1;min-width:0;height:32px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-radius:10px;align-items:center;gap:8px;padding:0 10px 0 8px;font-family:inherit;font-size:13px;display:inline-flex;overflow:hidden;text-align:left}' +
      '.duiThemeRow:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}' +
      '.duiChevron{flex:none;margin-left:auto;display:inline-flex;opacity:.55}' +
      '.duiMenuBut{display:flex;align-items:center;gap:8px;width:100%;padding:8px 10px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary);font-family:inherit;font-size:13px;line-height:18px;cursor:pointer;text-align:left}' +
      '.duiMenuBut:hover{background:var(--dsw-alias-interactive-bg-hover)}.duiMenuBut.active{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}' +
      '.duiMenuCheck{flex:none;margin-left:auto;color:var(--dsw-alias-state-success-primary);font-size:12px}' +
      '.duiMenuBut small{color:var(--dsw-alias-label-tertiary);margin-left:auto;font-size:11px;flex:none}' +
      '.duiBackdrop{position:fixed;inset:0;z-index:998;background:transparent}' +
      '.duiMenu{position:absolute;bottom:calc(100% + 6px);left:0;min-width:220px;background:var(--dsw-specific-menu);border:1px solid var(--dsw-alias-border-inverted);border-radius:12px;box-shadow:var(--dsw-shadow-lv3);padding:4px;display:flex;flex-direction:column;z-index:999}' +
      '.duiWrap.rail{width:36px;margin:0;align-items:center;gap:2px}.duiWrap.rail .duiUpdateButtons{flex-direction:column;gap:2px;height:auto}.duiWrap.rail .duiUpdateBadge{border-radius:50%;justify-content:center;gap:0;width:36px;height:36px;padding:0}.duiWrap.rail .duiUpdateMore{width:36px;height:36px;border-radius:50%}.duiWrap.rail .duiThemeRow{width:36px;height:36px;border-radius:50%;justify-content:center;gap:0;padding:0}' +
      // 个人信息行
      '.duiAcctRow{border-bottom:1px solid var(--dsw-alias-border-l2);align-items:center;gap:8px;padding:16px 0;display:flex}' +
      '.duiAcctRowText{flex-direction:column;flex:1;gap:4px;min-width:0;padding-right:48px;display:flex}' +
      '.duiAcctTitle{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:400;line-height:22px}.duiAcctDesc{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}' +
      '.duiAcctRight{flex:none;display:flex;flex-direction:column;align-items:flex-end;gap:8px;max-width:340px}' +
      '.duiAcctKey{font-family:var(--dsh-font-mono,monospace);font-size:12px;line-height:20px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-module-platform);border-radius:10px;padding:0 10px;height:32px;display:inline-flex;align-items:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px}' +
      '.duiAcctToggle{background:var(--dsw-alias-bg-module-platform);height:32px;color:var(--dsw-alias-label-secondary);cursor:pointer;border:none;border-radius:16px;padding:0 12px;font-size:12px;line-height:20px;display:inline-flex;align-items:center;font-family:inherit;flex:none}.duiAcctToggle:hover{color:var(--dsw-alias-label-primary)}' +
      '.duiAcctRefresh{width:32px;height:32px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:none;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;padding:0;flex:none}.duiAcctRefresh:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary)}' +
      '.duiAcctBalance{display:flex;align-items:center;gap:8px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}.duiAcctBalance strong{color:var(--dsw-alias-label-primary);font-weight:500}' +
      '.duiAcctTag{background:var(--dsw-alias-state-success-tertiary);color:var(--dsw-alias-state-success-primary);border-radius:999px;padding:1px 8px;font-size:11px;line-height:16px;flex:none}.duiAcctTag.warn{background:var(--dsw-alias-state-warn-tertiary);color:var(--dsw-alias-state-warn-label)}' +
      '.duiAcctError{color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:18px}.duiAcctEmpty{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}' +
      // 背景行 + 弹窗
      '.duiBgWrap{flex:none;align-items:center;width:100%;height:32px;margin:2px 0 0;display:flex}.duiBgRow{flex:1;min-width:0;height:32px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-radius:10px;align-items:center;gap:8px;padding:0 10px 0 8px;font-family:inherit;font-size:13px;display:inline-flex;overflow:hidden;text-align:left}.duiBgRow:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.duiBgWrap.rail{width:36px;margin:0}.duiBgWrap.rail .duiBgRow{width:36px;height:36px;border-radius:50%;justify-content:center;gap:0;padding:0}' +
      '.duiBgBackdrop{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:3000;display:flex;align-items:center;justify-content:center;padding:24px}' +
      '.duiBgModal{background:#17181c;border:1px solid rgba(255,255,255,.12);border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.4);width:840px;max-width:100%;max-height:84vh;display:flex;flex-direction:column;overflow:hidden}' +
      '.duiBgHeader{display:flex;align-items:center;gap:8px;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.1)}.duiBgTitle{font-size:15px;font-weight:500;color:var(--dsw-alias-label-primary);flex:none}' +
      '.duiBgSearch{flex:1;min-width:0;display:flex;align-items:center;gap:8px}.duiBgSearchInput{flex:1;min-width:0;height:34px;border:1px solid rgba(255,255,255,.16);border-radius:10px;background:rgba(255,255,255,.06);color:var(--dsw-alias-label-primary);padding:0 12px;font-size:13px;font-family:inherit;outline:none}.duiBgSearchInput:focus{border-color:#2f6bff}' +
      '.duiBgSearchBtn{flex:none;height:34px;padding:0 14px;border:0;border-radius:10px;background:#2f6bff;color:#fff;font-size:13px;font-family:inherit;cursor:pointer}.duiBgSearchBtn:hover{background:#2459e6}.duiBgSearchBtn:disabled{opacity:.5}' +
      '.duiBgClose{flex:none;width:30px;height:30px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-tertiary);font-size:16px;cursor:pointer}.duiBgClose:hover{background:rgba(255,255,255,.1);color:var(--dsw-alias-label-primary)}' +
      '.duiBgTab{flex:none;height:32px;padding:0 12px;border:1px solid rgba(255,255,255,.16);border-radius:16px;background:transparent;color:var(--dsw-alias-label-secondary);font-size:13px;font-family:inherit;cursor:pointer}.duiBgTab:hover{color:var(--dsw-alias-label-primary);background:rgba(255,255,255,.08)}.duiBgTab.on{background:#2f6bff;border-color:#2f6bff;color:#fff}' +
      '.duiBgChips{display:flex;gap:6px;padding:10px 16px;flex-wrap:wrap;align-items:center}.duiBgChip{height:26px;padding:0 10px;border:1px solid rgba(255,255,255,.16);border-radius:13px;background:transparent;color:var(--dsw-alias-label-secondary);font-size:12px;font-family:inherit;cursor:pointer;display:inline-flex;align-items:center;gap:5px}.duiBgChip:hover:not(:disabled){color:var(--dsw-alias-label-primary);background:rgba(255,255,255,.1)}.duiBgChip:disabled{opacity:.45;cursor:not-allowed}.duiBgChip.on{background:#2f6bff;border-color:#2f6bff;color:#fff}.duiBgChipX{color:inherit;opacity:.6;font-size:12px;line-height:1;padding:0;border:0;background:none;cursor:pointer}.duiBgChipX:hover{opacity:1}' +
      '.duiBgAddCat{height:26px;padding:0 10px;border:1px dashed rgba(255,255,255,.3);border-radius:13px;background:transparent;color:var(--dsw-alias-label-secondary);font-size:12px;font-family:inherit;cursor:pointer}.duiBgAddCat:hover{color:var(--dsw-alias-label-primary);background:rgba(255,255,255,.1)}' +
      '.duiBgAddPanel{padding:8px 16px;border-bottom:1px solid rgba(255,255,255,.08);display:flex;gap:8px;align-items:center;flex-wrap:wrap}.duiBgAddInput{height:30px;border:1px solid rgba(255,255,255,.16);border-radius:8px;background:rgba(255,255,255,.06);color:var(--dsw-alias-label-primary);padding:0 10px;font-size:13px;font-family:inherit;outline:none}.duiBgAddBtn{height:30px;padding:0 12px;border:0;border-radius:8px;background:#2f6bff;color:#fff;font-size:13px;font-family:inherit;cursor:pointer}' +
      '.duiBgBody{flex:1;min-height:0;overflow-y:auto;padding:0 16px 14px}' +
      '.duiBgProgressWrap{height:8px;background:rgba(255,255,255,.1);border-radius:6px;overflow:hidden;margin:10px 16px 2px;position:relative}.duiBgProgressBar{height:100%;background:linear-gradient(90deg,#2f6bff,#679efe);border-radius:6px;transition:width .2s ease}.duiBgProgressLabel{font-size:11px;color:var(--dsw-alias-label-tertiary);padding:3px 16px 6px}' +
      '.duiBgGrid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-top:12px}.duiBgCard{position:relative;border-radius:10px;overflow:hidden;border:1px solid rgba(255,255,255,.12);cursor:pointer;background:#222;aspect-ratio:16/10}.duiBgCard img{width:100%;height:100%;object-fit:cover;display:block}.duiBgCard:hover{outline:2px solid #2f6bff}.duiBgCard.on{outline:2px solid #22c55e}' +
      '.duiBgSkel{position:relative;border-radius:10px;overflow:hidden;background:rgba(255,255,255,.05);aspect-ratio:16/10;min-height:120px}.duiBgSkel::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.08),transparent);animation:duiShimmer 1.2s infinite}@keyframes duiShimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}' +
      '.duiBgCardBadge{position:absolute;top:6px;right:6px;background:rgba(0,0,0,.55);color:#fff;font-size:10px;line-height:16px;padding:0 6px;border-radius:8px;pointer-events:none}.duiBgCardCur{position:absolute;top:6px;left:6px;background:rgba(34,197,94,.9);color:#fff;font-size:10px;line-height:16px;padding:0 6px;border-radius:8px;pointer-events:none;font-weight:600}.duiBgCardDl{position:absolute;bottom:6px;right:6px;background:rgba(79,70,229,.85);color:#fff;font-size:10px;line-height:16px;padding:0 6px;border-radius:8px;pointer-events:none}.duiBgCardTip{position:absolute;left:6px;bottom:6px;background:rgba(0,0,0,.55);color:#fff;font-size:10px;line-height:16px;padding:0 6px;border-radius:8px;pointer-events:none;opacity:0;transition:opacity .15s}.duiBgCard:hover .duiBgCardTip{opacity:1}' +
      '.duiBgState{padding:60px 0;text-align:center;color:var(--dsw-alias-label-tertiary);font-size:13px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:240px}.duiBgError{color:var(--dsw-alias-state-error-primary);font-size:12px;padding:6px 0;text-align:center}' +
      '.duiBgPager{display:flex;align-items:center;gap:4px;justify-content:center;padding:12px 0 2px;flex-wrap:wrap}.duiBgPageBtn{height:26px;min-width:26px;padding:0 7px;border:1px solid rgba(255,255,255,.14);border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);font-size:12px;font-family:inherit;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}.duiBgPageBtn:hover:not(:disabled){color:var(--dsw-alias-label-primary);background:rgba(255,255,255,.1)}.duiBgPageBtn:disabled{opacity:.4;cursor:not-allowed}.duiBgPageBtn.on{background:#2f6bff;border-color:#2f6bff;color:#fff}.duiBgDots{color:var(--dsw-alias-label-tertiary);font-size:12px;padding:0 2px}' +
      '.duiBgFooter{display:flex;align-items:center;gap:10px;padding:12px 16px;border-top:1px solid rgba(255,255,255,.1)}.duiBgCurrent{flex:1;min-width:0;font-size:12px;color:var(--dsw-alias-label-tertiary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.duiBgImport{flex:none;height:32px;padding:0 14px;border:1px solid rgba(255,255,255,.16);border-radius:10px;background:transparent;color:var(--dsw-alias-label-secondary);font-size:13px;font-family:inherit;cursor:pointer;display:inline-flex;align-items:center}.duiBgImport:hover{color:var(--dsw-alias-label-primary);background:rgba(255,255,255,.1)}' +
      '.duiBgClear{flex:none;height:32px;padding:0 14px;border:0;border-radius:10px;background:transparent;color:var(--dsw-alias-state-error-primary);font-size:13px;font-family:inherit;cursor:pointer}.duiBgClear:hover{background:rgba(239,68,68,.12)}' +
      '.duiBgCtx{position:fixed;z-index:3100;min-width:170px;background:#1b1c21;border:1px solid rgba(255,255,255,.12);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.4);padding:4px;display:flex;flex-direction:column}.duiBgCtxItem{display:flex;align-items:center;gap:8px;padding:7px 10px;border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-label-primary);font-size:13px;font-family:inherit;cursor:pointer;text-align:left}.duiBgCtxItem:hover{background:rgba(255,255,255,.1)}' +
      '.duiBgConfirm{position:fixed;inset:0;z-index:3200;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center}.duiBgConfirmBox{background:#1b1c21;border:1px solid rgba(255,255,255,.14);border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.5);padding:20px;width:280px;text-align:center}.duiBgConfirmText{font-size:14px;color:var(--dsw-alias-label-primary);margin-bottom:16px}.duiBgConfirmBtns{display:flex;gap:8px;justify-content:center}.duiBgConfirmBtn{height:32px;padding:0 16px;border:0;border-radius:9px;font-size:13px;font-family:inherit;cursor:pointer}.duiBgConfirmBtn.cancel{background:rgba(255,255,255,.1);color:var(--dsw-alias-label-primary)}.duiBgConfirmBtn.ok{background:#2f6bff;color:#fff}'
    );

    const disposeUpdate = slots.inject('sidebar.footer.action', () => slots.register(
      { name: 'sidebar.footer.action', id: 'desktop-update', order: 60 },
      (props) => {
        const wide = Boolean(props && props.wide);
        const THEME_ORDER = ['system', 'light', 'dark'];
        const THEME_LABELS = { system: '跟随系统', light: '浅色', dark: '深色' };
        const LINKS = [
          { label: 'GitHub Issues', caption: '反馈问题', url: 'https://github.com/anywhere-labs/deepseek-harness-desktop/issues' },
          { label: '安装包下载', caption: 'GitHub Releases', url: 'https://github.com/anywhere-labs/deepseek-harness-desktop/releases' },
          { label: '官网', caption: 'dshdesktop.cn', url: 'https://dshdesktop.cn' },
        ];
        const [state, setState] = React.useState({ checking: false, current: null, upToDate: null, updateAvailable: false, error: null, notice: null });
        const [mode, setMode] = React.useState(theme ? theme.getTheme().preference : 'system');
        const [menuOpen, setMenuOpen] = React.useState(false);
        const [themeOpen, setThemeOpen] = React.useState(false);
        React.useEffect(() => { let alive = true; call('update/status', {}).then((r) => { if (!alive || !r) return; setState((s) => ({ ...s, current: r.currentVersion, latest: r.latestVersion, upToDate: r.upToDate, updateAvailable: r.updateAvailable, error: r.error })); }).catch((e) => { if (alive) setState((s) => ({ ...s, error: String((e && e.message) || e) })); }); return () => { alive = false; }; }, []);
        React.useEffect(() => { if (!theme) return undefined; const d = ctx.on('theme/change', (snap) => { if (snap && snap.preference) setMode(snap.preference); }); return () => { if (typeof d === 'function') d(); }; }, []);
        const closeMenus = () => { setMenuOpen(false); setThemeOpen(false); };
        const onCheck = () => { if (state.checking) return; setState((s) => ({ ...s, checking: true, error: null, notice: null })); call('update/check', {}).then((r) => { if (r) setState((s) => ({ ...s, checking: false, notice: r.message || null, error: r.error || null })); }).catch((e) => setState((s) => ({ ...s, checking: false, error: String((e && e.message) || e) }))); };
        const selectTheme = (id) => { if (theme) { try { theme.setTheme(id); } catch (e) { setState((s) => ({ ...s, error: String((e && e.message) || e) })); } } setThemeOpen(false); };
        const openLink = (url) => { closeMenus(); call('update/open', { url }).catch((e) => setState((s) => ({ ...s, error: String((e && e.message) || e) }))); };
        const up = state.updateAvailable === true && !state.checking;
        const count = state.checking ? '检查中…' : (state.current ? 'v' + state.current : '');
        const cc = state.checking ? '' : (state.upToDate === true ? ' ok' : (state.updateAvailable ? ' avail' : ''));
        const title = state.checking ? '正在检查更新…' : (up ? '点击更新到 v' + state.latest : '检查 DSH Desktop 更新' + (state.current ? ' · v' + state.current : '') + (state.error ? ' · ' + state.error : ''));
        return React.createElement('div', { className: 'duiWrap' + (wide ? '' : ' rail') },
          (menuOpen || themeOpen) ? React.createElement('div', { className: 'duiBackdrop', onClick: closeMenus }) : null,
          menuOpen ? React.createElement('div', { className: 'duiMenu', role: 'menu' }, LINKS.map((l) => React.createElement('button', { key: l.url, type: 'button', className: 'duiMenuBut', onClick: () => openLink(l.url) }, React.createElement('span', null, l.label), React.createElement('small', null, l.caption)))) : null,
          themeOpen && theme ? React.createElement('div', { className: 'duiMenu', role: 'menu' }, THEME_ORDER.map((idm) => React.createElement('button', { key: idm, type: 'button', className: 'duiMenuBut' + (mode === idm ? ' active' : ''), onClick: () => selectTheme(idm) }, React.createElement(ThemeIcon, { mode: idm, size: 14 }), React.createElement('span', null, THEME_LABELS[idm]), mode === idm ? React.createElement('span', { className: 'duiMenuCheck' }, '✓') : null))) : null,
          React.createElement('div', { className: 'duiUpdateButtons' },
            React.createElement('button', { type: 'button', className: 'duiUpdateBadge' + (up ? ' update' : ''), onClick: onCheck, disabled: state.checking, title, 'aria-label': '检查更新' },
              up ? React.createElement(ArrowUpIcon, { size: wide ? 16 : 18 }) : React.createElement(RefreshIcon, { size: wide ? 16 : 18, spin: state.checking }),
              wide ? React.createElement('span', { className: 'duiUpdateLabel' }, state.checking ? '正在检查…' : (up ? (state.current ? 'v' + state.current : '') : '检查更新')) : null,
              wide && up ? React.createElement('span', { className: 'duiUpdateNewVersion' }, 'v' + state.latest) : (wide && count ? React.createElement('span', { className: 'duiUpdateCount' + cc }, count) : null)),
            React.createElement('button', { type: 'button', className: 'duiUpdateMore', onClick: () => { setThemeOpen(false); setMenuOpen((v) => !v); }, 'aria-label': '更多链接', 'aria-expanded': menuOpen, title: '更多链接' }, '⋯')),
          theme ? React.createElement('button', { type: 'button', className: 'duiThemeRow', onClick: () => { setMenuOpen(false); setThemeOpen((v) => !v); }, title: '主题：' + (THEME_LABELS[mode] || mode), 'aria-expanded': themeOpen },
            React.createElement(ThemeIcon, { mode: mode || 'system', size: wide ? 14 : 16 }),
            wide ? React.createElement('span', null, THEME_LABELS[mode] || mode) : null,
            wide ? React.createElement(ChevronDownIcon, { size: 14 }) : null) : null);
      }
    ));

    const disposeAccount = slots.inject('settings.general.item', () => slots.register(
      { name: 'settings.general.item', id: 'account-info', order: 30 },
      () => {
        const [state, setState] = React.useState({ loading: true, keys: [], account: null, accountError: null, error: null, revealed: {} });
        const applyResult = (r) => setState((s) => ({ ...s, loading: false, keys: (r && r.keys) || [], account: (r && r.account) || null, accountError: (r && r.accountError) || null, error: (r && r.error) || null }));
        React.useEffect(() => { call('account/status', {}).then(applyResult).catch((e) => setState((s) => ({ ...s, loading: false, error: String((e && e.message) || e) }))); }, []);
        const refresh = () => { call('account/status', {}).then(applyResult).catch((e) => setState((s) => ({ ...s, error: String((e && e.message) || e) }))); };
        const toggleReveal = (ref) => { if (state.revealed[ref]) { setState((s) => ({ ...s, revealed: { ...s.revealed, [ref]: null } })); return; } call('account/reveal', { ref }).then((r) => { if (r && r.ok) setState((s) => ({ ...s, revealed: { ...s.revealed, [ref]: r.value } })); else if (r) setState((s) => ({ ...s, error: r.error || '无法读取 Key' })); }).catch((e) => setState((s) => ({ ...s, error: String((e && e.message) || e) }))); };
        const balance = state.account && state.account.balances && state.account.balances[0];
        const line = state.account ? (balance ? '余额 ¥' + balance.total + ' · 充值 ¥' + balance.toppedUp + ' · 赠送 ¥' + balance.granted : '账户已连接') : null;
        return React.createElement('div', { className: 'duiAcctRow' },
          React.createElement('div', { className: 'duiAcctRowText' }, React.createElement('div', { className: 'duiAcctTitle' }, '个人信息'), React.createElement('div', { className: 'duiAcctDesc' }, '已保存的 API Key 与账户信息（完整 Key 默认隐藏）')),
          React.createElement('div', { className: 'duiAcctRight' },
            state.loading ? React.createElement('div', { className: 'duiAcctEmpty' }, '读取中…')
              : (state.error ? React.createElement('div', { className: 'duiAcctError' }, state.error)
                : (state.keys.length === 0 ? React.createElement('div', { className: 'duiAcctEmpty' }, '未找到已保存的 API Key')
                  : state.keys.map((k) => React.createElement('div', { key: k.ref, className: 'duiAcctKeyRow' }, React.createElement('span', { className: 'duiAcctKey', title: k.ref }, state.revealed[k.ref] ? state.revealed[k.ref] : k.masked), React.createElement('button', { type: 'button', className: 'duiAcctToggle', onClick: () => toggleReveal(k.ref) }, state.revealed[k.ref] ? '隐藏' : '显示'))))),
            line ? React.createElement('div', { className: 'duiAcctBalance' }, React.createElement('strong', null, 'DeepSeek'), React.createElement('span', null, line), React.createElement('span', { className: 'duiAcctTag' + (state.account.isAvailable ? '' : ' warn') }, state.account.isAvailable ? '可用' : '不可用')) : (state.accountError ? React.createElement('div', { className: 'duiAcctError' }, '账户信息获取失败：' + state.accountError) : null),
            React.createElement('button', { type: 'button', className: 'duiAcctRefresh', onClick: refresh, 'aria-label': '刷新', title: '刷新' }, React.createElement('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }, React.createElement('path', { d: 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8' }), React.createElement('path', { d: 'M21 3v5h-5' }), React.createElement('path', { d: 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16' }), React.createElement('path', { d: 'M8 16H3v5' })))));
      }
    ));

    const disposeProfile = slots.inject('settings.general.item', () => slots.register(
      { name: 'settings.general.item', id: 'dsh-profile', order: 20 },
      () => {
        const [state, setState] = React.useState({ loading: true, keys: [], account: null, accountError: null, workspaceCount: null, sessionCount: null, skillsCount: null, presetsCount: null, plugins: [], error: null, revealed: {} });
        const [actErr, setActErr] = React.useState(null);
        const applyResult = (r) => setState((s) => ({ ...s, loading: false, keys: (r && r.keys) || [], account: (r && r.account) || null, accountError: (r && r.accountError) || null, workspaceCount: r && r.workspaceCount, sessionCount: r && r.sessionCount, skillsCount: r && r.skillsCount, presetsCount: r && r.presetsCount, plugins: (r && r.plugins) || [], error: (r && r.error) || null }));
        React.useEffect(() => { call('profile/status', {}).then(applyResult).catch((e) => setState((s) => ({ ...s, loading: false, error: String((e && e.message) || e) }))); }, []);
        const refresh = () => { call('profile/status', {}).then(applyResult).catch((e) => setState((s) => ({ ...s, error: String((e && e.message) || e) }))); };
        const toggleReveal = (ref) => { if (state.revealed[ref]) { setState((s) => ({ ...s, revealed: { ...s.revealed, [ref]: null } })); return; } call('profile/reveal', { ref }).then((r) => { if (r && r.ok) setState((s) => ({ ...s, revealed: { ...s.revealed, [ref]: r.value } })); else if (r) setState((s) => ({ ...s, error: r.error || '无法读取 Key' })); }).catch((e) => setState((s) => ({ ...s, error: String((e && e.message) || e) }))); };
        const go = (what) => { setActErr(null); call('profile/openPage', { page: what }).then((r) => { if (!r || !r.ok) setActErr((r && r.error) || '打开失败'); }).catch((e) => setActErr(String((e && e.message) || e))); };
        const balance = state.account && state.account.balances && state.account.balances[0];
        const keySeed = state.keys.length ? String(state.keys[0].ref || 'D') : 'D';
        let hash = 0; for (const c of keySeed) hash = ((hash * 31) + c.charCodeAt(0)) | 0;
        const hue = Math.abs(hash) % 360; const initials = (keySeed.slice(0, 2) || 'DS').toUpperCase();
        const accountName = state.account && state.account.isAvailable !== undefined ? 'DeepSeek' : 'DSH 用户';
        const stats = [
          { val: balance ? '¥' + balance.total : '—', lbl: 'DeepSeek 余额' }, { val: state.account ? (state.account.isAvailable ? '可用' : '不可用') : '—', lbl: '账户状态' }, { val: state.keys.length, lbl: '已存 API Key' },
          { val: state.workspaceCount != null ? state.workspaceCount : '—', lbl: '工作区' }, { val: state.sessionCount != null ? state.sessionCount : '—', lbl: '会话' }, { val: state.skillsCount != null ? state.skillsCount : '—', lbl: '技能' },
          { val: state.presetsCount != null ? state.presetsCount : '—', lbl: 'Agent 预设' }, { val: state.plugins.length, lbl: '已装插件' }, { val: balance ? balance.granted : '—', lbl: '赠送余额' }
        ];
        return React.createElement('div', { className: 'dshpBox' },
          React.createElement('div', { className: 'dshpHead' },
            React.createElement('div', { className: 'dshpAvatar', style: { background: 'hsl(' + hue + ', 62%, 50%)' } }, initials),
            React.createElement('div', { style: { minWidth: 0 } }, React.createElement('div', { className: 'dshpName' }, accountName), React.createElement('div', { className: 'dshpHandle' }, state.keys[0] ? 'Key ' + state.keys[0].masked : (state.error || '未连接账户')), React.createElement('div', { className: 'dshpBadge' }, 'DSH Desktop')),
            React.createElement('div', { style: { marginLeft: 'auto', display: 'flex', gap: 8, flex: 'none', alignItems: 'center' } },
              React.createElement('button', { type: 'button', className: 'dshpAct', onClick: () => go('topup'), title: '打开 DeepSeek 充值页' }, '充值'),
              React.createElement('button', { type: 'button', className: 'dshpAct2', onClick: () => go('billing'), title: '打开 DeepSeek 账单页' }, '账单'),
              React.createElement('button', { type: 'button', style: { width: 32, height: 32, border: '0', borderRadius: 8, background: 'transparent', color: 'var(--dsw-alias-label-tertiary)', cursor: 'pointer' }, onClick: refresh, 'aria-label': '刷新' }, '↻')
            )
          ),
          actErr ? React.createElement('div', { className: 'dshpErr', style: { marginBottom: 8 } }, actErr) : null,
          React.createElement('div', { className: 'dshpStats' }, stats.map((s2) => React.createElement('div', { key: s2.lbl, className: 'dshpStat' }, React.createElement('div', { className: 'dshpStatVal' }, String(s2.val)), React.createElement('div', { className: 'dshpStatLbl' }, s2.lbl)))),
          React.createElement('div', { className: 'dshpSec' }, React.createElement('div', { className: 'dshpTitle' }, '已保存的 API Key'), state.keys.length === 0 ? React.createElement('div', { className: 'dshpEmpty' }, '未找到已保存的 API Key') : state.keys.map((k) => React.createElement('div', { key: k.ref, className: 'dshpKeyRow' }, React.createElement('span', { className: 'dshpKey', title: k.ref }, state.revealed[k.ref] ? state.revealed[k.ref] : k.masked), React.createElement('button', { type: 'button', className: 'dshpToggle', onClick: () => toggleReveal(k.ref) }, state.revealed[k.ref] ? '隐藏' : '显示')))),
          React.createElement('div', { className: 'dshpSec' }, React.createElement('div', { className: 'dshpTitle' }, '已安装插件'), state.plugins.length === 0 ? React.createElement('div', { className: 'dshpEmpty' }, '未读取到插件列表') : state.plugins.map((p) => React.createElement('span', { key: p, className: 'dshpPlug' }, p))),
          state.accountError ? React.createElement('div', { className: 'dshpErr', style: { marginTop: 8 } }, '账户信息获取失败：' + state.accountError) : null
        );
      }
    ));

    const disposeBg = slots.inject('sidebar.footer.action', () => slots.register(
      { name: 'sidebar.footer.action', id: 'desktop-background', order: 70 },
      (props) => {
        const wide = Boolean(props && props.wide);
        const [open, setOpen] = React.useState(false);
        const [view, setView] = React.useState('online');
        const [query, setQuery] = React.useState('');
        const [items, setItems] = React.useState([]);
        const [loading, setLoading] = React.useState(false);
        const [error, setError] = React.useState(null);
        const [appliedId, setAppliedId] = React.useState(null);
        const [currentName, setCurrentName] = React.useState('');
        const [ctxMenu, setCtxMenu] = React.useState(null);
        const [busy, setBusy] = React.useState(false);
        const [busyId, setBusyId] = React.useState(null);
        const [pct, setPct] = React.useState(0);
        const [history, setHistory] = React.useState([]);
        const [downloaded, setDownloaded] = React.useState([]);
        const [cats, setCats] = React.useState([]);
        const [addingCat, setAddingCat] = React.useState(false);
        const [addLabel, setAddLabel] = React.useState('');
        const [addQuery, setAddQuery] = React.useState('');
        const [page, setPage] = React.useState(1);
        const [lastPage, setLastPage] = React.useState(1);
        const [confirmClose, setConfirmClose] = React.useState(false);
        const [source, setSource] = React.useState(srcGet());
        const [shist, setShist] = React.useState(shistGet());
        const progStop = React.useRef(null);
        const SOURCES = [{ id: 'wallhaven', label: 'Wallhaven' }, { id: 'konachan', label: 'Konachan' }, { id: 'safebooru', label: 'Safebooru' }];
        const switchSource = (s) => { setSource(s); srcSet(s); search(query || 'anime', 1, s); };

        const addHistory = (e2) => { const h = [e2, ...historyGet().filter((x) => x.id !== e2.id)].slice(0, 12); historySet(h); setHistory(h); };
        const markDownloaded = (id) => { if (!id) return; const d = [id, ...dlGet().filter((x) => x !== id)].slice(0, 120); dlSet(d); setDownloaded(d); };
        const startProgress = () => { setPct(1); if (timer) progStop.current = timer.interval(() => setPct((p) => (p < 92 ? Math.min(92, p + Math.max(0.5, (92 - p) * 0.04)) : p)), 120); };
        const stopProgress = (done) => { if (progStop.current) { try { progStop.current(); } catch {} progStop.current = null; } if (done) setPct(100); };

        const setBackground = (item) => {
          const name = String(item.id || 'wallpaper').replace(/[^A-Za-z0-9_-]/g, '_');
          setError(null); setBusy(true); setBusyId(item.id); startProgress();
          call('bg/set', { url: item.full, name }).then((r) => {
            if (r && r.ok && r.dataUrl) {
              const cfg = { url: r.dataUrl, kind: 'local', name: item.id || '本地图片', page: item.page || '' };
              applyBackground(cfg, () => { setAppliedId(item.id); setCurrentName(item.id || ''); });
              storeSet(cfg);
              addHistory({ url: r.dataUrl, name: item.id || '', id: item.id || '', thumb: item.thumb || '', page: item.page || '', kind: 'local' });
              markDownloaded(item.id);
            } else if (r) setError(r.error || '设置失败');
          }).catch((e) => setError(String((e && e.message) || e))).finally(() => { setBusy(false); setBusyId(null); stopProgress(true); });
        };
        const download = (item) => {
          const safe = String(item.id || 'wallpaper').replace(/[^A-Za-z0-9_-]/g, '_');
          setError(null); setBusy(true); setBusyId(item.id); startProgress();
          call('bg/download', { url: item.full, name: safe }).then((r) => { if (r && r.ok) markDownloaded(item.id); else if (r) setError(r.error || '下载失败'); }).catch((e) => setError(String((e && e.message) || e))).finally(() => { setBusy(false); setBusyId(null); stopProgress(true); });
        };
        const search = (q, pg, srcOverride) => {
          const text = (typeof q === 'string' ? q : query).trim(); const p = pg || 1; const src = srcOverride || source;
          setQuery(text); setPage(p); setLoading(true); setError(null);
          if (text) { const sh = [text, ...shistGet().filter((x) => x !== text)].slice(0, 12); shistSet(sh); setShist(sh); }
          call('bg/search', { query: text, page: p, source: src }).then((r) => { if (!r) return; if (r.ok) { setItems(r.items || []); setLastPage(r.lastPage || p || 1); setAppliedId(null); } else setError(r.error || '搜索失败'); }).catch((e) => setError(String((e && e.message) || e))).finally(() => setLoading(false));
        };
        const setFromHistory = (entry) => { if (!entry || !entry.url) return; const cfg = { url: entry.url, kind: 'local', name: entry.name || entry.id || '', page: entry.page || '' }; applyBackground(cfg, () => { setAppliedId(entry.id); setCurrentName(entry.name || entry.id || ''); }); storeSet(cfg); };
        const addCategory = () => { const l = addLabel.trim(); const q = addQuery.trim(); if (!l || !q || cats.length >= 10) return; const c = [...cats, { label: l, q, custom: true }]; catsSet(c); setCats(c); setAddingCat(false); setAddLabel(''); setAddQuery(''); };
        const removeCategory = (idx) => { const c = cats.filter((_, i) => i !== idx); catsSet(c); setCats(c); };
        const clearCategories = () => { catsSet([]); setCats([]); };
        const onOpen = () => { setOpen(true); setError(null); setView('online'); if (items.length === 0) search('anime', 1, srcGet()); let cfg = null; try { cfg = storeGet(); } catch {} setCurrentName(cfg && cfg.name ? cfg.name : ''); setHistory(historyGet()); setShist(shistGet()); setDownloaded(dlGet()); setCats(catsGet()); };
        const clearBackground = () => { applyBackground(null, () => { setCurrentName(''); setAppliedId(null); }); storeClear(); };
        const requestClose = () => setConfirmClose(true);
        const onFile = (e) => {
          const files = e.target && e.target.files ? Array.from(e.target.files) : []; e.target.value = '';
          if (files.length === 0) return;
          let count = 0; let lastCfg = null;
          const process = (file) => {
            if (file.size > 12 * 1024 * 1024) { count += 1; if (count === files.length) { setCurrentName(lastCfg ? lastCfg.name : ''); setOpen(false); setHistory(historyGet()); } return; }
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = String(reader.result || '');
              const finish = (url) => { const cfg = { url, kind: 'local', name: file.name || '本地图片' }; addHistory({ url, name: file.name || '本地图片', id: 'local-' + file.name + '-' + Date.now(), thumb: url, page: '', kind: 'local' }); lastCfg = cfg; applyBackground(cfg); storeSet(cfg); count += 1; if (count === files.length) { setCurrentName(lastCfg.name); setOpen(false); setHistory(historyGet()); } };
              try { const img = new Image(); img.onload = () => { try { const maxW = 2560; if (img.width <= maxW) { finish(dataUrl); return; } const scale = maxW / img.width; const canvas = document.createElement('canvas'); canvas.width = maxW; canvas.height = Math.round(img.height * scale); canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height); finish(canvas.toDataURL('image/jpeg', 0.85)); } catch { finish(dataUrl); } }; img.onerror = () => finish(dataUrl); img.src = dataUrl; } catch { finish(dataUrl); }
            };
            reader.onerror = () => { count += 1; if (count === files.length) { setCurrentName(lastCfg ? lastCfg.name : ''); setOpen(false); setHistory(historyGet()); } };
            reader.readAsDataURL(file);
          };
          files.forEach(process);
        };
        const BUILTIN = [{ label: '推荐', q: 'anime' }, { label: '风景', q: 'landscape' }, { label: '城市', q: 'city' }, { label: '夜景', q: 'night' }, { label: '樱花', q: 'sakura' }, { label: '少女', q: 'girl' }];
        const allCats = [...BUILTIN, ...cats];
        const pages = () => { const total2 = Math.max(1, lastPage || 1); const arr = []; const cur = page; const win = 2; for (let i = 1; i <= total2; i++) { if (i === 1 || i === total2 || Math.abs(i - cur) <= win) arr.push(i); } const out = []; let prev = 0; for (const i of arr) { if (i - prev > 1) out.push('dots'); out.push(i); prev = i; } return out; };
        const renderCard = (it, isHistory) => React.createElement('div', {
          key: it.id || it.thumb, className: 'duiBgCard' + (appliedId === it.id ? ' on' : ''),
          onClick: isHistory ? null : () => setBackground(it), onDoubleClick: isHistory ? () => setFromHistory(it) : null,
          onContextMenu: (e) => { e.preventDefault(); if (!isHistory) setCtxMenu({ x: e.clientX, y: e.clientY, item: it }); },
          title: isHistory ? '双击设置为背景' : (it.id || '') + (it.resolution ? ' · ' + it.resolution : '')
        },
          React.createElement('img', { src: it.thumb, alt: it.id || it.name, loading: 'lazy' }),
          appliedId === it.id ? React.createElement('span', { className: 'duiBgCardCur' }, '背景') : null,
          !isHistory && it.resolution ? React.createElement('span', { className: 'duiBgCardBadge' }, it.resolution) : null,
          downloaded.indexOf(it.id) >= 0 ? React.createElement('span', { className: 'duiBgCardDl' }, '已下载') : null,
          React.createElement('span', { className: 'duiBgCardTip' }, busyId === it.id ? '处理中…' : (isHistory ? '双击设置' : '左键设置')));
        const skeletons = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => React.createElement('div', { key: i, className: 'duiBgSkel' }));

        return React.createElement(React.Fragment, null,
          React.createElement('div', { className: 'duiBgWrap' + (wide ? '' : ' rail') },
            React.createElement('button', { type: 'button', className: 'duiBgRow', onClick: onOpen, title: '设置整体背景壁纸', 'aria-label': '背景壁纸' },
              React.createElement('svg', { className: 'dui-icon', width: wide ? 14 : 16, height: wide ? 14 : 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }, React.createElement('rect', { x: 3, y: 3, width: 18, height: 18, rx: 2 }), React.createElement('circle', { cx: 9, cy: 9, r: 2 }), React.createElement('path', { d: 'm21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21' })),
              wide ? React.createElement('span', null, '背景') : null)),
          open ? React.createElement('div', { className: 'duiBgBackdrop', onClick: requestClose },
            React.createElement('div', { className: 'duiBgModal', onClick: (e) => e.stopPropagation() },
              React.createElement('div', { className: 'duiBgHeader' },
                React.createElement('span', { className: 'duiBgTitle' }, '背景壁纸'),
                React.createElement('select', { value: source, onChange: (e) => switchSource(e.target.value), style: { height: 32, border: '1px solid rgba(255,255,255,.16)', borderRadius: 8, background: 'rgba(255,255,255,.06)', color: 'var(--dsw-alias-label-secondary)', padding: '0 8px', fontSize: 13, flex: 'none' }, 'aria-label': '数据源' }, SOURCES.map((x) => React.createElement('option', { key: x.id, value: x.id }, x.label))),
                view === 'online' ? React.createElement('div', { className: 'duiBgSearch' }, React.createElement('input', { className: 'duiBgSearchInput', value: query, placeholder: '搜索动漫壁纸（如 miku、sakura、landscape、night）', onChange: (e) => setQuery(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter') search(query, 1); } }), React.createElement('button', { type: 'button', className: 'duiBgSearchBtn', onClick: () => search(query, 1), disabled: loading }, '搜索')) : null,
                React.createElement('button', { type: 'button', className: 'duiBgTab' + (view === 'online' ? ' on' : ''), onClick: () => setView('online') }, '在线'),
                React.createElement('button', { type: 'button', className: 'duiBgTab' + (view === 'history' ? ' on' : ''), onClick: () => { setView('history'); setHistory(historyGet()); } }, '历史(' + history.length + ')'),
                React.createElement('button', { type: 'button', className: 'duiBgClose', onClick: () => setOpen(false), 'aria-label': '关闭' }, '✕')),
              view === 'online' ? React.createElement('div', { className: 'duiBgChips' },
                shist.length > 0 ? React.createElement(React.Fragment, null, React.createElement('span', { className: 'duiBgCurrent', style: { fontSize: 11 } }, '最近:'), shist.slice(0, 6).map((t) => React.createElement('button', { key: t, type: 'button', className: 'duiBgChip' + (query === t ? ' on' : ''), onClick: () => search(t, 1) }, t))) : null,
                allCats.map((c, idx) => React.createElement('button', { key: c.q + '-' + idx, type: 'button', className: 'duiBgChip' + (query === c.q ? ' on' : ''), disabled: loading, onClick: () => search(c.q, 1) }, c.label, c.custom ? React.createElement('span', { className: 'duiBgChipX', onClick: (e) => { e.stopPropagation(); removeCategory(idx); } }, '✕') : null)),
                React.createElement('button', { type: 'button', className: 'duiBgAddCat', onClick: () => setAddingCat((v) => !v), disabled: loading }, '+ 分类'),
                cats.length > 0 ? React.createElement('button', { type: 'button', className: 'duiBgAddCat', onClick: clearCategories, disabled: loading }, '清空自定义') : null) : null,
              view === 'online' && addingCat ? React.createElement('div', { className: 'duiBgAddPanel' },
                React.createElement('input', { className: 'duiBgAddInput', placeholder: '分类名', value: addLabel, onChange: (e) => setAddLabel(e.target.value), style: { width: 120 } }),
                React.createElement('input', { className: 'duiBgAddInput', placeholder: '搜索词(如 wallhaven 标签)', value: addQuery, onChange: (e) => setAddQuery(e.target.value), style: { width: 180 } }),
                React.createElement('button', { type: 'button', className: 'duiBgAddBtn', onClick: addCategory }, '保存'),
                React.createElement('button', { type: 'button', className: 'duiBgAddBtn', style: { background: '#565b66' }, onClick: () => setAddingCat(false) }, '取消')) : null,
              busy ? React.createElement(React.Fragment, null, React.createElement('div', { className: 'duiBgProgressWrap' }, React.createElement('div', { className: 'duiBgProgressBar', style: { width: pct + '%' } })), React.createElement('div', { className: 'duiBgProgressLabel' }, '处理中 ' + pct.toFixed(1) + '%')) : null,
              React.createElement('div', { className: 'duiBgBody' },
                error ? React.createElement('div', { className: 'duiBgError' }, error) :
                view === 'history' ? (history.length === 0 ? React.createElement('div', { className: 'duiBgState' }, '暂无历史记录') : React.createElement('div', { className: 'duiBgGrid' }, history.map((it) => renderCard(it, true)))) :
                loading ? React.createElement('div', { className: 'duiBgGrid' }, skeletons) :
                items.length === 0 ? React.createElement('div', { className: 'duiBgState' }, '没有找到图片，换个关键词试试') :
                React.createElement('div', { className: 'duiBgGrid' }, items.map((it) => renderCard(it, false)))),
              view === 'online' && !loading && items.length > 0 ? React.createElement('div', { className: 'duiBgPager' },
                React.createElement('button', { type: 'button', className: 'duiBgPageBtn', disabled: loading || page <= 1, onClick: () => search(query, page - 1) }, '‹'),
                pages().map((p, i) => p === 'dots' ? React.createElement('span', { key: 'd' + i, className: 'duiBgDots' }, '…') : React.createElement('button', { key: p, type: 'button', className: 'duiBgPageBtn' + (p === page ? ' on' : ''), disabled: loading, onClick: () => search(query, p) }, p)),
                React.createElement('button', { type: 'button', className: 'duiBgPageBtn', disabled: loading || page >= lastPage, onClick: () => search(query, page + 1) }, '›')) : null,
              React.createElement('div', { className: 'duiBgFooter' },
                React.createElement('span', { className: 'duiBgCurrent' }, currentName ? '当前背景：' + currentName : '未设置背景'),
                React.createElement('label', { className: 'duiBgImport', htmlFor: 'dsh-bg-file' }, '从本地导入'),
                React.createElement('input', { id: 'dsh-bg-file', type: 'file', accept: 'image/*', multiple: true, webkitdirectory: '', style: { display: 'none' }, onChange: onFile }),
                React.createElement('button', { type: 'button', className: 'duiBgClear', onClick: clearBackground }, '清除背景')))) : null,
          confirmClose ? React.createElement('div', { className: 'duiBgConfirm' }, React.createElement('div', { className: 'duiBgConfirmBox' }, React.createElement('div', { className: 'duiBgConfirmText' }, '确定关闭背景设置？'), React.createElement('div', { className: 'duiBgConfirmBtns' }, React.createElement('button', { type: 'button', className: 'duiBgConfirmBtn cancel', onClick: () => setConfirmClose(false) }, '取消'), React.createElement('button', { type: 'button', className: 'duiBgConfirmBtn ok', onClick: () => { setConfirmClose(false); setOpen(false); } }, '确定')))) : null,
          ctxMenu ? React.createElement('div', { className: 'duiBgBackdrop', style: { background: 'transparent', zIndex: 3090 }, onClick: () => setCtxMenu(null) }) : null,
          ctxMenu ? React.createElement('div', { className: 'duiBgCtx', style: { left: Math.min(ctxMenu.x, window.innerWidth - 190), top: Math.min(ctxMenu.y, window.innerHeight - 130) } },
            React.createElement('button', { type: 'button', className: 'duiBgCtxItem', onClick: () => { setBackground(ctxMenu.item); setCtxMenu(null); } }, '设为背景'),
            React.createElement('button', { type: 'button', className: 'duiBgCtxItem', onClick: () => { download(ctxMenu.item); setCtxMenu(null); } }, '下载到本地'),
            React.createElement('button', { type: 'button', className: 'duiBgCtxItem', onClick: () => { call('bg/open', { url: ctxMenu.item.page || ctxMenu.item.full }).catch(() => {}); setCtxMenu(null); } }, '打开链接')) : null);
      }
    ));

    return () => {
      if (bgStyleEl && bgStyleEl.isConnected) { try { bgStyleEl.remove(); } catch {} }
      bgStyleEl = null;
      if (typeof disposeUpdate === 'function') disposeUpdate();
      if (typeof disposeAccount === 'function') disposeAccount();
      if (typeof disposeProfile === 'function') disposeProfile();
      if (typeof disposeBg === 'function') disposeBg();
      disposeStyles();
    };
  });
}

  return { name, apply, inject };
}});
