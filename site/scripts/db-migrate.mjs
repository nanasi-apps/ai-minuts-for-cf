#!/usr/bin/env node

/**
 * D1 Migration Helper Script
 *
 * wrangler.tomlからデータベース名を自動取得してマイグレーションコマンドを実行します。
 *
 * Usage:
 *   node scripts/db-migrate.mjs create <migration_name>
 *   node scripts/db-migrate.mjs apply --local
 *   node scripts/db-migrate.mjs apply --remote
 *   node scripts/db-migrate.mjs list
 */

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * wrangler.tomlからD1データベース名を取得
 */
function getD1DatabaseName() {
	const wranglerPath = resolve(process.cwd(), "wrangler.toml");

	try {
		const content = readFileSync(wranglerPath, "utf-8");

		// [[d1_databases]] セクションから database_name を抽出
		const match = content.match(/database_name\s*=\s*"([^"]+)"/);

		if (!match) {
			console.error("Error: database_name not found in wrangler.toml");
			console.error(
				"Please ensure your wrangler.toml has a [[d1_databases]] section with database_name defined.",
			);
			process.exit(1);
		}

		return match[1];
	} catch (error) {
		console.error("Error: Could not read wrangler.toml");
		console.error(error.message);
		process.exit(1);
	}
}

/**
 * コマンドを実行
 */
function run(command) {
	console.log(`> ${command}\n`);
	try {
		execSync(command, { stdio: "inherit" });
	} catch {
		process.exit(1);
	}
}

// メイン処理
const args = process.argv.slice(2);
const command = args[0];
const dbName = getD1DatabaseName();

switch (command) {
	case "create": {
		const migrationName = args[1];
		if (!migrationName) {
			console.error("Error: Migration name is required");
			console.error("Usage: pnpm db:migrate:create <migration_name>");
			process.exit(1);
		}
		run(`npx wrangler d1 migrations create ${dbName} ${migrationName}`);
		break;
	}

	case "apply": {
		const target = args[1];
		if (target !== "--local" && target !== "--remote") {
			console.error("Error: Please specify --local or --remote");
			process.exit(1);
		}
		run(`npx wrangler d1 migrations apply ${dbName} ${target}`);
		break;
	}

	case "list": {
		const target = args[1] || "";
		run(`npx wrangler d1 migrations list ${dbName} ${target}`.trim());
		break;
	}

	default:
		console.error("Unknown command:", command);
		console.error("\nAvailable commands:");
		console.error("  create <name>  - Create a new migration file");
		console.error("  apply --local  - Apply migrations to local D1");
		console.error("  apply --remote - Apply migrations to remote D1");
		console.error("  list           - List migration status");
		process.exit(1);
}
