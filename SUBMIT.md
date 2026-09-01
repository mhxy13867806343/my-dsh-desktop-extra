# 提交到 awesome-dsh-plugin 收录

把本插件收录进 DSH 插件市场（dsh-market）的提交材料。市场数据来自 [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) 注册表，**一个文件一条**。

## 提交文件（内容照抄）

在 `awesome-dsh-plugin` 仓库新建文件
`data/plugins/mhxy13867806343__my-dsh-desktop-extra.yml`：

```yaml
url: https://github.com/mhxy13867806343/my-dsh-desktop-extra
name: mhxy13867806343/my-dsh-desktop-extra
category: ui
description:
  en: DSH Desktop enhancement: one-click update check, theme switching, account info, and a searchable anime wallpaper library.
  zh: DSH Desktop 桌面增强：一键检查更新、主题切换、个人信息，以及可搜索的二次元背景壁纸图库。
```

> 分类 `ui` 贴合它做的事（界面增强）。描述只讲功能、不带营销词、且与代码一致（更新检查/主题/个人信息/背景壁纸都有）。

## 前置门槛（已核对）
| 项 | 要求 | 本仓库 |
|---|---|---|
| `dsh.bundle` manifest | package.json 声明 | ✅ `{'patch':'./cordis.patch.yml'}` |
| `cordis.patch.yml` | 仓库根 | ✅ 有 |
| 仓库年龄 | ≥1 天 | ❌ 目前约几小时，**明天才达标** |
| 提交数 | ≥10 | ✅ 14 |

## 提交流程（等明天，仓库满 1 天后）
1. **加 `dsh-plugin` topic**：GitHub 仓库 → About → Topics → 添加 `dsh-plugin`（CI 会查）。
2. 在 [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) 点 **New Pull Request**，添加上面那个 `data/plugins/...yml` 文件。
3. PR 标题/正文建议：
   ```
   Add mhxy13867806343/my-dsh-desktop-extra
   ```
   ```markdown
   ## 提交插件
   - repo: https://github.com/mhxy13867806343/my-dsh-desktop-extra
   - 分类: ui
   - 说明: DSH Desktop 桌面增强（检查更新/主题/个人信息/二次元背景壁纸）
   ```
4. 合并后，站点 + dsh-market 会在次日自动收录（daily build）。之后你在插件市场就能**一键安装**（客户端会被正确加载、常驻、重启不丢），别人也能搜到。

## 可选
- **截图**：在仓库根放 `screenshots.json` 列出 1-8 张图片（市场详情页展示）。路径相对该文件，指向仓库内图片。
  ```json
  ["assets/screenshot-1.png"]
  ```
- **npm 包**：已发布 `@mhxy13867806343/dsh-desktop-extra`（仓库 `repository` 字段已指回本仓库，会自动关联下载量）。

## 备注
> 市场安装（`dsh plugin add` / 一键）会用市场自己的流程正确注册并加载客户端，比手动装的路径可靠。这也是本插件"别人一键装 + 本地常驻"的官方通道。
