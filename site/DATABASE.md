# Database Setup Guide

Cloudflare D1 と Prisma ORM を使用したデータベース管理ガイドです。

## 概要

このプロジェクトでは、**Cloudflare D1**（SQLiteベースのサーバーレスデータベース）を**Prisma ORM**と組み合わせて使用しています。

Prisma 7 以降、D1 でのマイグレーションは **Wrangler CLI** と **`prisma migrate diff`** を組み合わせて行います。

### 技術構成

| 項目 | 技術 |
|------|------|
| データベース | Cloudflare D1 (SQLite) |
| ORM | Prisma |
| アダプター | @prisma/adapter-d1 |
| CLI | Wrangler |

---

## 内容

### ファイル構成

```
├── prisma/
│   ├── schema.prisma          # Prismaスキーマ定義
│   └── migrations/            # マイグレーションファイル（Wrangler管理）
│       └── migration_lock.toml
│
├── scripts/
│   └── db-migrate.mjs         # マイグレーションヘルパースクリプト
│
├── server/
│   ├── prisma-client.ts       # PrismaClient生成関数
│   └── prisma-client/         # 生成されたPrismaクライアント
│
├── prisma.config.ts           # Prisma設定
└── wrangler.toml              # Cloudflare設定（D1バインディング）
```

### D1 データベースの種類

| 種類 | 説明 | 用途 |
|------|------|------|
| ローカル | `.wrangler/state` に保存 | 開発・テスト |
| リモート | Cloudflare管理 | 本番環境 |

---

## 詳細

### 1. 初期セットアップ

#### 1.1 D1データベースの作成

```bash
# 新しいD1データベースを作成
pnpx wrangler d1 create your-database-name

# 既存のデータベース一覧を確認
pnpx wrangler d1 list
```

作成後、出力された `database_id` を `wrangler.toml` に設定します。

#### 1.2 wrangler.toml の設定

```toml
[[d1_databases]]
binding = "DB"
database_name = "your-database-name"
database_id = "your-database-id"
```

#### 1.3 Prismaクライアントの生成

```bash
pnpm prisma:generate
```

---

### 2. マイグレーションワークフロー

D1 では Prisma の `prisma migrate dev` は使用せず、**Wrangler + prisma migrate diff** を使用します。

#### 2.1 初回マイグレーション（スキーマが空の場合）

##### Step 1: Prismaスキーマを定義

`prisma/schema.prisma` にモデルを定義:

```prisma
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
}
```

##### Step 2: マイグレーションファイルを作成

```bash
pnpm db:migrate:create create_user_table
```

これにより `migrations/0001_create_user_table.sql` が作成されます（中身は空）。

##### Step 3: SQLを生成

```bash
pnpm db:migrate:generate migrations/0001_create_user_table.sql --from-empty
```

##### Step 4: マイグレーションを適用

```bash
# ローカルD1に適用
pnpm db:migrate:local

# リモートD1に適用（本番）
pnpm db:migrate:remote
```

---

#### 2.2 追加マイグレーション（既存スキーマがある場合）

##### Step 1: Prismaスキーマを更新

```prisma
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
  posts Post[]
}

model Post {
  id       Int    @id @default(autoincrement())
  title    String
  author   User   @relation(fields: [authorId], references: [id])
  authorId Int
}
```

##### Step 2: マイグレーションファイルを作成

```bash
pnpm db:migrate:create add_post_table
```

##### Step 3: SQLを生成（ローカルD1から差分を取得）

```bash
pnpm db:migrate:generate migrations/0002_add_post_table.sql
```

> **注意**: `--from-empty` は初回のみ使用。2回目以降はローカルD1の状態から差分を計算します。

##### Step 4: マイグレーションを適用

```bash
# ローカル
pnpm db:migrate:local

# リモート（本番）
pnpm db:migrate:remote
```

---

### 3. 利用可能なスクリプト

| コマンド | 説明 |
|---------|------|
| `pnpm prisma:generate` | Prismaクライアントを生成 |
| `pnpm db:migrate:create <name>` | 新しいマイグレーションファイルを作成 |
| `pnpm db:migrate:generate <file>` | Prismaスキーマからローカルとの差分SQLを生成 |
| `pnpm db:migrate:generate <file> --from-empty` | 空の状態からSQLを生成（初回用） |
| `pnpm db:migrate:local` | ローカルD1にマイグレーションを適用 |
| `pnpm db:migrate:remote` | リモートD1にマイグレーションを適用 |
| `pnpm db:migrate:status` | マイグレーション状態を確認 |

---

### 4. データベースの確認・デバッグ

```bash
# ローカルD1のテーブル一覧
npx wrangler d1 execute test-db --local --command="SELECT name FROM sqlite_master WHERE type='table';"

# リモートD1のテーブル一覧
npx wrangler d1 execute test-db --remote --command="SELECT name FROM sqlite_master WHERE type='table';"

# テーブル構造の確認
npx wrangler d1 execute test-db --local --command="PRAGMA table_info(User);"

# マイグレーション履歴の確認
npx wrangler d1 execute test-db --local --command="SELECT * FROM d1_migrations;"
```

---

### 5. 注意事項

#### トランザクション非対応

Cloudflare D1 は現在トランザクションをサポートしていません。Prisma の暗黙的・明示的トランザクションは無視され、個別のクエリとして実行されます。

#### ローカルとリモートの同期

ローカルD1とリモートD1は独立しています。両方に同じマイグレーションを適用することを忘れないでください。

---

## 参考リンク

- [Prisma + Cloudflare D1 公式ドキュメント](https://www.prisma.io/docs/orm/overview/databases/cloudflare-d1)
- [Cloudflare D1 マイグレーション](https://developers.cloudflare.com/d1/reference/migrations/)
- [prisma migrate diff コマンド](https://www.prisma.io/docs/orm/reference/prisma-cli-reference#migrate-diff)
