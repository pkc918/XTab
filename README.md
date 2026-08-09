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

## RSS 来源

首次使用时会默认加入以下来源：

- `OpenAI News`（`https://openai.com/news/rss.xml`）
- `Claude Code`（`https://code.claude.com/docs/en/whats-new/rss.xml`）

在 `.env.local` 中可通过 `WXT_RSS_FEED_URLS` 追加来源，简单场景可使用逗号分隔：

```dotenv
WXT_RSS_FEED_URLS=https://example.com/rss.xml,https://example.org/atom.xml
```

需要自定义显示名称或分类时，也可以使用 JSON 数组（保持在同一行）：

```dotenv
WXT_RSS_FEED_URLS=[{"url":"https://example.com/feed.json","title":"示例 Feed","category":"开发"}]
```

解析器支持 RSS 0.9x/2.0、RSS 1.0（RDF）、Atom 和 JSON Feed 1.0/1.1，也兼容常见的 Content、Dublin Core、Media RSS 与 enclosure 字段。默认的 OpenAI News 和 Claude Code 会直接加载；首次读取用户追加的新域名时，点击 RSS 面板的刷新按钮并允许对应域名。扩展不会在安装时直接申请所有网站的读取权限。

两个 composable 也可以独立使用：

```ts
import { useGithubAuth } from '@/composables/useGithubAuth';
import { useRss } from '@/composables/useRss';

const auth = useGithubAuth({ scopes: ['read:user'] });
await auth.connect();
const response = await auth.apiFetch('/user');

const rss = useRss(['https://example.com/feed.xml']);
const parsed = rss.parse(rawFeed, { sourceUrl: 'https://example.com/feed.xml' });
await rss.refresh({ requestPermissions: true });
```

`useGithubAuth` 还提供会话恢复、取消、断开登录、授权状态及受限的 `apiFetch`；`useRss` 提供并发刷新、超时/大小限制、ETag/Last-Modified 条件请求、去重排序及逐来源错误状态。

## 检查与构建

```bash
pnpm compile
pnpm build
```
