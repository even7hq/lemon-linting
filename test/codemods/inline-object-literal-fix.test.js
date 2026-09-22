/* eslint-disable no-console -- test runner */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const ts = require("typescript");

const codemodPath = path.join(__dirname, "../../scripts/codemods/InlineObjectLiteralFix.mjs");

/**
 * Writes a minimal TypeScript project for codemod tests.
 *
 * @param dir Temp project directory.
 * @returns Nothing.
 */
function writeMinimalProject(dir) {
    fs.mkdirSync(path.join(dir, "src"), { recursive: true });
    fs.copyFileSync(
        path.join(__dirname, "../fixtures/codemods/EmptyObject.ts"),
        path.join(dir, "src/EmptyObject.ts")
    );

    fs.writeFileSync(
        path.join(dir, "tsconfig.json"),
        JSON.stringify(
            {
                compilerOptions: {
                    target: "ES2022",
                    module: "ESNext",
                    strict: true,
                    skipLibCheck: true,
                    rootDir: "src",
                    outDir: "dist"
                },

                include: ["src/**/*.ts"]
            },
            null,
            2
        )
    );
}

/**
 * Asserts that a violating return object is rewritten to emptyObject plus assignments.
 *
 * @returns Nothing.
 */
async function testCodemodRewritesReturnObject() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "inline-obj-fix-"));
    writeMinimalProject(dir);

    const samplePath = path.join(dir, "src/Sample.ts");
    const importFrom = "./EmptyObject.js";

    fs.writeFileSync(
        samplePath,
        `import { emptyObject } from "${importFrom}";

export function build(): { name: string; online: boolean } {
    return { name: "a", online: false };
}
`
    );

    const { fixFile } = await import(pathToFileURL(codemodPath).href);
    const config = ts.readConfigFile(path.join(dir, "tsconfig.json"), ts.sys.readFile);
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, dir);
    const program = ts.createProgram({ rootNames: parsed.fileNames, options: parsed.options });

    const changed = fixFile(samplePath, program, importFrom, false);

    assert.equal(changed, true);

    const out = fs.readFileSync(samplePath, "utf8");

    assert.match(out, /emptyObject</);
    assert.match(out, /draftObj0\.name = "a"/);
    assert.match(out, /draftObj0\.online = false/);
    assert.match(out, /return draftObj0/);
    assert.doesNotMatch(out, /return \{ name: "a", online: false \}/);

    fs.rmSync(dir, { recursive: true, force: true });
}

testCodemodRewritesReturnObject()
    .then(() => {
        console.log("PASS inline-object-literal-fix codemod");
    })
    .catch((err) => {
        console.error("FAIL inline-object-literal-fix codemod");
        throw err;
    });
