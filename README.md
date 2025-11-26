# Nuxt.js Fullstack Kit

## 概要

Nuxt.js をベースにした**フルスタックアプリケーション**のスターターキットです。

モダンな技術スタックを採用し、**Cloudflare Pages** でホスティング、**Cloudflare D1** をデータベースとして使用します。フロントエンドとバックエンド間の型安全な API 通信には **oRPC** を採用しています。

### 技術スタック

| カテゴリ | 技術                                                              |
|---------|-----------------------------------------------------------------|
| フレームワーク | [Nuxt.js 4](https://nuxt.com/)                                  |
| スタイリング | [Tailwind CSS 4](https://tailwindcss.com/)                      |
| 言語 | TypeScript                                                      |
| データベース | [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite) |
| ORM | [Prisma](https://www.prisma.io/)                                |
| API通信 | [oRPC](https://orpc.dev/)                                       |
| ホスティング | [Cloudflare Workers](https://workers.cloudflare.com/)           |
| リンター/フォーマッター | [Biome](https://biomejs.dev/)                                   |

---

## 内容

### ディレクトリ構成

```
├── app/                    # フロントエンド (Nuxt.js)
│   ├── assets/            # CSS等のアセット
│   ├── components/        # Vueコンポーネント
│   ├── composable/        # Composables (useApi等)
│   ├── layouts/           # レイアウト
│   ├── pages/             # ページ
│   └── plugins/           # Nuxtプラグイン (oRPCクライアント等)
│
├── server/                 # バックエンド (Nitro)
│   ├── middlewares/       # ミドルウェア
│   ├── orpc/              # oRPCルーター・プロシージャ
│   ├── plugins/           # サーバープラグイン
│   ├── prisma-client/     # Prisma生成クライアント
│   └── routes/            # APIルート
│
├── shared/                 # フロント・バックエンド共有コード
│   └── orpc/              # oRPCコントラクト定義
│
├── prisma/                 # Prisma設定
│   ├── schema.prisma      # スキーマ定義
│   └── migrations/        # マイグレーション
│
└── public/                 # 静的ファイル
```

### 主な機能

- **型安全なAPI通信**: oRPCにより、フロントエンドとバックエンド間で型を共有
- **エッジデータベース**: Cloudflare D1 + Prismaによる高速なデータアクセス
- **SSR対応**: Nuxt.jsのSSR機能をCloudflare Workersで実行
- **開発体験**: Biomeによる高速なリント・フォーマット、Huskyによるコミットフック

---

## 詳細

### セットアップ

#### 1. 依存関係のインストール

```bash
pnpm install
```

#### 2. Cloudflare D1 データベースの作成

```bash
# データベース作成
npx wrangler d1 create your-database-name

# wrangler.toml に出力された database_id を設定
```

#### 3. Prismaクライアントの生成

```bash
pnpm prisma:generate
```

#### 4. データベースのマイグレーション

```bash
pnpm db:push
```

### 開発

```bash
# 開発サーバー起動
pnpm dev
```

### ビルド・デプロイ
#### ビルド
```bash
pnpm build
```
#### デプロイ
```bash
# Cloudflare Pagesへデプロイ
pnpm run deploy
```

### 利用可能なスクリプト

| コマンド | 説明 |
|---------|------|
| `pnpm dev` | 開発サーバー起動 |
| `pnpm build` | プロダクションビルド |
| `pnpm preview` | ビルド結果のプレビュー |
| `pnpm deploy` | Cloudflareへデプロイ |
| `pnpm prisma:generate` | Prismaクライアント生成 |
| `pnpm db:push` | スキーマをDBに反映 |
| `pnpm lint-format` | リント・フォーマットチェック |
| `pnpm lint-format:fix` | リント・フォーマット自動修正 |
| `pnpm typecheck` | 型チェック |

### oRPC の使い方

#### コントラクト定義 (`shared/orpc/`)

```typescript
import { oc } from "@orpc/contract";
import * as z from "zod";

export const test = oc
  .route({
    path: "/test",
    method: "GET",
  })
  .output(
    z.object({
      message: z.string(),
    }),
  );
```

#### ハンドラー実装 (`server/orpc/procedures/`)

```typescript
import { os } from "@/server/orpc/os";

export const example = {
  test: os.example.test.handler(async () => {
    return {
      message: "Hello from ORPC",
    };
  }),
};
```

#### クライアント側での利用 (`app/`)

```typescript
// Composableを使用
const api = useApi();
const result = await api.example.test();

// useAsyncDataでラップ
const { data } = await useAsyncApi((api) => api.example.test());
```

---

## ライセンス

MIT