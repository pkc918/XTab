# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

XTab 面向极客用户，尤其是频繁使用 GitHub、RSS 和浏览器快捷入口，并希望把新标签页作为个人信息工作台的人。用户在打开新标签页时，需要快速开始搜索、访问常用网站，并浏览与自己相关或值得发现的技术内容。

## Product Purpose

XTab 是一个替换 Chrome 新标签页的浏览器扩展。它把搜索、快捷网站、RSS 文章、GitHub 推荐内容和用户自己的 GitHub 信息集中到一个页面中，减少用户开始浏览或进入开发工作所需的跳转。

成功意味着用户打开新标签页后，可以立即发起搜索或进入常用网站，同时快速了解新的 RSS/GitHub 内容和自己的 GitHub 信息。

## Positioning

XTab 不是面向所有人的通用新标签页，而是专为极客打造的信息工作台：在一次打开中汇集高频入口、RSS 阅读、GitHub 内容发现和个人 GitHub 状态。

待决定：相比其他面向开发者或极客的新标签页，XTab 更具体的独特机制与差异化仍需确认。

## Operating Context

- XTab 在用户打开 Chrome 新标签页时出现。
- GitHub 登录是个性化 GitHub 内容与个人信息的入口。
- 页面同时承载高频操作（搜索、快捷网站）、内容发现（RSS、GitHub 推荐）和个人 GitHub 信息。

## Capabilities and Constraints

- 覆盖 Chrome 的新标签页。
- 提供产品 Logo 和 GitHub 登录入口。
- 提供搜索框和快捷网站入口。
- 展示 RSS 文章内容。
- 展示 GitHub 推荐内容。
- 展示已登录用户自己的 GitHub 相关信息。
- 现有工程使用 WXT、Vue 3、TypeScript 和 pnpm。
- GitHub 登录使用启用 Device Flow 的 GitHub App/OAuth App；当前只读取已授权用户的公开账号资料与公开统计，Header 登录入口在成功后替换为真实头像。
- GitHub Client ID 通过本地环境变量配置；访问令牌保存在限制为可信扩展上下文读取的扩展存储中。
- 待决定：搜索服务、快捷网站的默认内容及编辑/持久化方式、RSS 来源、GitHub 推荐规则、更完整的个人信息字段、数据缓存/同步策略和隐私政策。
- 待决定：是否只支持 Chrome，或同时支持其他 Chromium 浏览器及 Firefox。

## Brand Commitments

- 产品名称为 XTab。
- 后续视觉设计必须使用黑、白、灰配色。
- 页面需要 XTab Logo；当前仓库尚无已确认的产品 Logo 资产。

## Evidence on Hand

- 仓库目前只有 WXT + Vue 3 的初始模板和模板图标，没有可作为产品事实使用的真实 Logo、内容样本、用户数据、案例或产品声明。
- 后续工作不得虚构 RSS 内容、GitHub 数据、用户指标、评价或其他证明材料；界面演示数据必须明确标示为占位内容。

## Product Principles

- 每次打开新标签页，都应让最高频的操作立即可用。
- GitHub 是产品的核心身份入口，也是推荐内容和个人信息的主要来源。
- 在同一入口中平衡快速行动、内容发现与个人状态，避免任何一类信息挤占其他任务。
- 外部内容和登录数据必须来自真实、可解释的数据源，并清楚呈现加载、空状态、错误和未登录状态。
