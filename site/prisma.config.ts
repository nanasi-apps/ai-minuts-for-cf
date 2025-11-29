import path from "node:path";
import { listLocalDatabases } from "@prisma/adapter-d1";
import { defineConfig } from "prisma/config";

// import your .env file
import "dotenv/config";

export default async () => {
	let dbPath: string | undefined;

	try {
		const dbs = await listLocalDatabases();
		dbPath = dbs[0];
	} catch (error) {
		console.warn(
			"Failed to list local D1 databases; falling back to default SQLite path.",
			error,
		);
	}

	return defineConfig({
		schema: path.join("prisma", "schema.prisma"),
		migrations: {
			path: "prisma/migrations",
		},
		datasource: {
			url: dbPath ? `file:${dbPath}` : "file:./prisma/dev.db",
		},
	});
};
