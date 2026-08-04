#!/usr/bin/env node

import { buildSync } from "esbuild";
import { cpSync, mkdirSync, writeFileSync } from "node:fs";
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
mkdirSync("dist/cjs/adapters", { recursive: true });

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
		external: [
			"express",
			"fastify",
			"hono",
			"koa",
			"./files.generated.js",
		],
		sourcemap: true,
		minify: false,
	});
}

// Copy files.generated.js to CJS output (so require() can find it)
cpSync(
	join(import.meta.dirname, "..", "dist", "esm", "files.generated.js"),
	join(import.meta.dirname, "..", "dist", "cjs", "files.generated.js"),
);

writeFileSync("dist/cjs/package.json", '{"type":"commonjs"}\n');
console.log("✅ CJS build complete");
