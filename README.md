# XTab

面向极客的 Chrome 新标签页：搜索、快捷网站、RSS、GitHub 推荐与个人 GitHub 信息集中在一屏。

## 本地运行

```bash
pnpm install
pnpm dev
```

## GitHub 登录

XTab 使用 GitHub Device Flow，不把 Client Secret 打包进扩展。

1. 创建 GitHub App 或 OAuth App，并启用 Device Flow。
2. 复制 `.env.example` 为 `.env.local`。
3. 填写公开 Client ID：

```dotenv
WXT_GITHUB_CLIENT_ID=your_client_id
```

点击 Header 右侧的圆形 GitHub 图标后，授权码会被复制并打开 GitHub 授权页。授权完成后，Header 会显示真实头像，右侧面板会显示账号与公开统计。

访问令牌保存在扩展自己的 `chrome.storage.local` 中，并限制为可信扩展上下文可读；网页无法直接读取。

## 检查与构建

```bash
pnpm compile
pnpm build
```
