#!/usr/bin/env node

import { buildSync } from "esbuild";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const entryPoints = [
	"src/index.ts",
	"src/adapters/express.ts",
	"src/adapters/fastify.ts",
	"src/adapters/hono.ts",
	"src/adapters/koa.ts",
	"src/adapters/node-http.ts",
];

mkdirSync("dist/cjs", { recursive: true });

for (const entry of entryPoints) {
	const outName = entry.replace("src/", "").replace(".ts", ".js");
	const outPath = join("dist/cjs", outName);

	buildSync({
		entryPoints: [entry],
		bundle: true,
		format: "cjs",
		platform: "node",
		target: "node18",
		outfile: outPath,
		external: ["express", "fastify", "hono", "koa"],
		sourcemap: true,
		minify: false,
	});
}

writeFileSync("dist/cjs/package.json", '{"type":"commonjs"}\n');

console.log("✅ CJS build complete");
