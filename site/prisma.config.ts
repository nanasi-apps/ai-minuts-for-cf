import path from "node:path";
import { listLocalDatabases } from "@prisma/adapter-d1";
import { defineConfig } from "prisma/config";

// import your .env file
import "dotenv/config";

export default async () => {
	const dbs = await listLocalDatabases();
	const dbPath = dbs[0];

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
