# dsh-desktop-extra

> DSH Desktop 桌面增强插件：一键检查更新、主题切换、更多链接、个人信息、**可搜索的二次元背景壁纸图库**。

一个基于 **DeepSeek Harness / DSH Desktop** 的 Cordis 插件（宿主端 + 客户端），把桌面里几个实用的增强功能打包成可安装、可分享的插件。

---

## ✨ 功能

### 1. 检查更新 + 主题切换 + 更多链接（侧边栏底部）
- **检查更新**：有新版时变成蓝色"↑ 更新"按钮，一键触发 DSH Desktop 自带的更新流程（检查 → 确认 → 下载 → 打开安装包）。
- **主题三选一**：跟随系统 / 浅色 / 深色，点击弹出菜单选择，自动保存，与系统"外观"同步联动。
- **更多链接** `⋯`：GitHub Issues / 安装包下载 / 官网。

### 2. 个人信息（设置 → 通用设置）
- 已保存的 API Key（默认打码，点"显示"看完整），以及 DeepSeek 账户余额（余额 / 充值 / 赠送）。

### 3. 背景壁纸（侧边栏"背景"按钮）
- **在线图库**：Wallhaven / Safebooru 二次元壁纸，支持搜索、**分页（1…100）**、分类、**骨架屏加载**、**0–100% 进度条**。
- **设为背景**：下载转本地 data URL（本地缓存、自动重试），整页生效、半透明遮罩、明暗主题自适应、自动保存。
- **历史记录**：双击历史项直接设回背景。
- **自定义分类**：最多 10 个，可删除/清空。
- **本地导入**：单张 / 多选 / 整个文件夹批量导入。
- **状态角标**：卡片显示"背景"（当前）、"已下载"、分辨率。

---

## 🚀 如何安装

### 方式一：DSH Market 插件市场（推荐，一键）
收录后（给仓库打 `dsh-plugin` topic 或提交 DSH 收录 issue，每日管道扫描）：
1. 打开 DSH Desktop 侧边栏 **插件市场**；
2. 搜索 **dsh-desktop-extra**；
3. 点 **安装**，即可用（下次启动自动加载，常驻）。

### 方式二：命令行安装（需要走 npm 或可解析的包）
```bash
dsh plugin --profile desktop add @mhxy13867806343/dsh-desktop-extra
```
> 当前包名 scope 为 `@mhxy13867806343`，若你未发布到 npm，可先用方式一，或改为你的可解析 scope。

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
  package.json         # name/version + exports(. / ./client) + dsh.bundle.patch 标记
  cordis.patch.yml     # dsh 组合 patch：把本插件插入 profile 的层
  lib/index.js         # 宿主端：desktopUpdate.* / account.* / bg.*
  lib/client.js        # 客户端：sidebar.footer.action + settings.general.item + 背景弹窗
  LICENSE              # MIT
  README.md
```

## 🔌 依赖的宿主能力

客户端用 `ctx.get('theme' | 'slots' | 'timer')` 与 `harness.handle`；宿主端用 `ctx.get('desktopRuntime' | 'desktopBrowserAccess' | 'webServer' | 'web' | 'shell' | 'credentials')`，这些都在 DSH Desktop 主进程内存在。

---

## 🔒 安全与网络行为（给审核者）

以下是插件的全部网络操作，均为预期功能，**不收集、不上传你的数据**：

| 操作 | 用途 | 备注 |
|---|---|---|
| `POST http://127.0.0.1:<port>/api/desktop/updates/check` | "检查更新" | DSH Desktop 自带更新接口，要求本机回环 Origin，只发往本机，不对外 |
| `GET dshdesktop.cn` / GitHub Releases | 查询最新版本号 | 只读，无副作用 |
| `curl` 下载 Wallhaven / Safebooru 图片 | "设为背景 / 下载到本地" | 从公开图源下载壁纸到 `~/Downloads/dsh-bg/` |
| `GET api.deepseek.com/user/balance` | 个人信息余额 | 使用你本机已保存的 DeepSeek key |

配置文件（背景选择/历史/分类/已下载标记）仅保存在浏览器 **localStorage**；API Key 只做脱敏展示与余额查询，不落盘、不上传。

---

## 📄 许可证

[MIT](./LICENSE) © 2026 mhxy13867806343
