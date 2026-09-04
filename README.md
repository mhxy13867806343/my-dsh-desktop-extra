# dsh-desktop-extra

> DSH Desktop 桌面增强插件：**检查更新 · DeepSeek 余额与 API Key · 导入其他 AI**。

一个基于 **DeepSeek Harness / DSH Desktop** 的 Cordis 插件（宿主端 + 客户端），把几个实用的桌面增强功能打包成可安装、可分享的插件。

---

## ✨ 功能

### 1. 检查更新（侧边栏底部）
- 显示当前版本（如 `v2.0.5`）与状态颜色：🟢 绿 = 已是最新，🟡 黄 = 快要更新（小版本/补丁），🔴 红 = 有更新（大版本）。
- 点击 → "正在检查…" → 结果；有新版触发 DSH Desktop 自带更新流程（检查 → 确认 → 下载 → 打开安装包）。
- `⋯` 更多菜单：**GitHub / 安装包下载 / 官网**。

### 2. DeepSeek 余额 + API Key（侧边栏）
- **余额**：显示余额金额，**刷新**可重新读取；**更多** → 充值 / 账单（直达 DeepSeek 官方页）。
- **API Key**：默认打码（`sk-5…3023`），**查看**切换显示完整，**复制**一键复制到剪贴板。

### 3. 导入其他 AI（侧边栏按钮 → 弹窗）
- 检测本机其它 AI 工具：**Claude / Codex / Cursor / Trae / Windsurf / Gemini CLI / OpenCode**，显示各自记录数。
- 点"查看"进入对话记录列表 → 再点一条看消息内容（`‹ 返回` 逐级返回）。
- **全部导入 / 一键导入**：把记录**新建成一个 DSH 工作区会话**（写入会话 + 登记到工作区索引）。

---

## 🚀 如何安装

### 方式一：DSH Market 插件市场（推荐，一键）
1. 打开 DSH Desktop 侧边栏 **插件市场**；
2. 搜索 **dsh-desktop-extra**；
3. 点 **安装**，即可用（下次启动自动加载，常驻）。

### 方式二：命令行安装（已发布到 npm，推荐）
```bash
# 本地常驻（每次启动自动加载）
dsh plugin --profile desktop add @mhxy13867806343/dsh-desktop-extra
```
> 包已发布到 npm（`@mhxy13867806343/dsh-desktop-extra`），装完重启 DSH Desktop 即常驻。

### 方式三：手动放进 profile（适合开发者）
把本包放入 profile 的插件目录/依赖，并在组合里引用：
```yaml
# cordis.patch.yml 或 cordis.yml
- insert:
    - id: desktop-extra
      name: '@mhxy13867806343/dsh-desktop-extra'
```

---

## 📦 文件结构

```
dsh-desktop-extra/
  package.json         # name/version + exports(. / ./client)
  lib/index.js         # 宿主端：注册 /dsh-extra/* 的 HTTP 路由（update/account/bg/profile）
  lib/client.js        # 客户端：sidebar.footer.action + settings.general.item + 弹窗
  LICENSE              # MIT
  README.md
```

---

## 🔌 依赖的宿主能力

客户端用 `ctx.get('theme' | 'slots' | 'timer')`，并通过 `fetch` 调宿主 `/dsh-extra/*` 路由；宿主端用 `ctx.get('desktopRuntime' | 'desktopBrowserAccess' | 'webServer' | 'web' | 'shell' | 'credentials')` 与 `webServer.register(...)`，这些都在 DSH Desktop 主进程内存在。

---

## 🔒 安全与网络行为（给审核者）

| 操作 | 用途 | 备注 |
|---|---|---|
| `POST http://127.0.0.1:<port>/api/desktop/updates/check` | "检查更新" | DSH Desktop 自带更新接口，只发往本机回环，不对外 |
| `GET dshdesktop.cn` / GitHub Releases | 查询最新版本号 | 只读，无副作用 |
| `GET api.deepseek.com/user/balance` | 余额 | 使用你本机已保存的 DeepSeek key |
| 读取本机 AI 工具记录文件（`~/.claude`、`~/.codex` 等） | 「导入其他 AI」查看/导入 | 只读本机记录，不上传 |

配置文件仅保存在浏览器 **localStorage**；API Key 只做脱敏展示与余额查询，不落盘、不上传。

---

## 📄 许可证

[MIT](./LICENSE) © 2026 mhxy13867806343
