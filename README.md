# dsh-desktop-extra

DSH Desktop 桌面增强插件（客户端 + 宿主端），把开发过程中用到的三个实用功能打包成一个可发布/可安装的 DSH 插件：

1. **检查更新 + 主题切换 + 更多链接**（侧边栏底部）
   - "检查更新"：有新版时变成蓝色"更新"按钮，一键触发 DSH Desktop 自带的更新流程
   - 主题三选一菜单（跟随系统 / 浅色 / 深色），自动保存，与系统"外观"同步
   - "⋯" 更多链接菜单：GitHub Issues / 安装包下载 / 官网
2. **个人信息**（设置 → 通用设置）
   - 已保存的 API Key（默认打码，可显示）与 DeepSeek 账户余额
3. **背景壁纸**（侧边栏"背景"按钮）
   - 居中弹窗图库（Wallhaven/Safebooru 二次元壁纸），支持搜索、分页、骨架屏、进度条
   - 左键/右键设为背景（下载转本地 data URL，自动重试）、下载到本地、打开链接
   - 历史记录（双击设置）、自定义分类（最多 10 个）、本地导入（单张/多选/文件夹）
   - 背景整页生效、半透明遮罩、明暗主题自适应、自动保存

## 文件结构

```
dsh-desktop-extra/
  package.json         # name/version + exports(. / ./client)
  lib/index.js         # 宿主端：harness.handle 注册 desktopUpdate.* / account.* / bg.*
  lib/client.js        # 客户端：slots 注册 sidebar.footer.action + settings.general.item + 弹窗
  README.md
```

## 依赖的宿主能力

客户端插件在运行期通过 `ctx.get('theme' | 'slots' | 'timer')` 和 `harness.handle` 使用，宿主端用
`ctx.get('desktopRuntime' | 'desktopBrowserAccess' | 'webServer' | 'web' | 'shell' | 'credentials')`。
这些都在 DSH Desktop 主进程里存在。

## 发布到插件市场（第三方目录）

发布需要你自己的市场账号 + 对应市场的发布工具/API，**本仓库只提供规范的包结构**，具体步骤如下（以你的目标市场为准）：

1. 把 `package.json` 的 `name` 改成你自己的 scope（如 `@你的用户名/dsh-desktop-extra`）
2. 每个市场有自己的发布流程（有的用 npm registry，有的用自有目录/CLI）。参照你对应市场的插件发布文档，把本包打包上传
3. 包内 `exports` 需保留 `./client`（客户端）与 `./`|`main`（宿主端），这样 DSH 组合才能按 `name` 引用并加载

## 本地安装（不发布，仅本机每次启动自动加载）

若只是想在自己机器上常驻（避免每次重启动态插件丢失），把本包安装进部署并用 cordis 组合引用：

- 宿主端：`dsh plugin --profile <name> add @yourscope/dsh-desktop-extra`（或直接放入 profile 的插件目录）
- 组合引用：在目标 agent/desktop 组合里加一行，例如

```yaml
- id: desktop-extra
  name: '@yourscope/dsh-desktop-extra'
```

> 注：`dsh-plugin-desktop` 同名的桌面壳插件不能重复；本插件的 `desktopUpdate.*` 走桌面自带的更新接口，其余功能独立。
