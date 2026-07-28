const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

/**
 * Cache for zlint results keyed by absolute file path and mtime.
 */
const ZlintCache = {
    /**
     * @type {Map<string, { mtimeMs: number, diagnostics: object[] }>}
     */
    entries: new Map(),

    /**
     * Clears cached zlint results.
     *
     * @returns Nothing.
     */
    clear() {
        this.entries.clear();
    }
};

/**
 * @type {boolean}
 */
let missingBinaryWarningShown = false;

/**
 * Finds the nearest directory containing build.zig walking up from a file.
 *
 * @param filePath Absolute path to a Zig source file.
 * @returns Directory path to use as zlint cwd.
 */
function findProjectRoot(filePath) {
    let dir = path.dirname(filePath);
    const root = path.parse(dir).root;

    while (dir !== root) {
        if (fs.existsSync(path.join(dir, "build.zig"))) {
            return dir;
        }

        dir = path.dirname(dir);
    }

    return path.dirname(filePath);
}

/**
 * Resolves the zlint binary path from rule options and environment.
 *
 * @param options Rule options.
 * @returns Absolute or bare path to zlint.
 */
function resolveZlintPath(options) {
    if (options.zlintPath) {
        return options.zlintPath;
    }

    if (process.env.ZLINT_PATH) {
        return process.env.ZLINT_PATH;
    }

    return "zlint";
}

/**
 * Parses zlint JSON output (one JSON object per line).
 *
 * @param stdout Raw stdout from zlint.
 * @returns Parsed diagnostic objects.
 */
function parseZlintOutput(stdout) {
    const diagnostics = [];
    const trimmed = stdout.trim();

    if (!trimmed) {
        return diagnostics;
    }

    const lines = trimmed.split("\n");

    for (const line of lines) {
        const candidate = line.trim();

        if (!candidate.startsWith("{")) {
            continue;
        }

        try {
            diagnostics.push(JSON.parse(candidate));
        } catch {
            // Ignore non-JSON lines (summary output, etc.).
        }
    }

    return diagnostics;
}

/**
 * Maps a zlint severity string to an ESLint severity number.
 *
 * @param level Zlint level field.
 * @returns ESLint severity (1 warn, 2 error).
 */
function mapSeverity(level) {
    if (level === "error" || level === "deny") {
        return 2;
    }

    return 1;
}

/**
 * Runs zlint for a file and returns parsed diagnostics.
 *
 * @param filePath Absolute path to the Zig file.
 * @param options Rule options.
 * @returns Parsed zlint diagnostics.
 */
function runZlint(filePath, options) {
    const stat = fs.statSync(filePath);
    const cacheKey = filePath;
    const cached = ZlintCache.entries.get(cacheKey);

    if (cached && cached.mtimeMs === stat.mtimeMs) {
        return cached.diagnostics;
    }

    const zlintPath = resolveZlintPath(options);
    const projectRoot = findProjectRoot(filePath);
    const relativePath = path.relative(projectRoot, filePath);

    let stdout = "";

    try {
        stdout = execFileSync(
            zlintPath,
            ["--format", "json", "--no-summary", relativePath],
            {
                cwd: projectRoot,
                encoding: "utf8",
                stdio: ["ignore", "pipe", "pipe"],
                timeout: options.timeoutMs ?? 30_000
            }
        );
    } catch (err) {
        if (err && typeof err === "object" && "stdout" in err && typeof err.stdout === "string") {
            stdout = err.stdout;
        } else
            if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") {
                if (missingBinaryWarningShown) {
                    return [];
                }

                missingBinaryWarningShown = true;

                return [{
                    level: "warn",
                    code: "zlint-missing",
                    message: "zlint binary not found. Install from https://github.com/DonIsaac/zlint or set ZLINT_PATH.",
                    labels: [{
                        primary: true,
                        start: { line: 1, column: 1 },
                        end: { line: 1, column: 1 }
                    }]
                }];
            } else {
                return [{
                    level: "warn",
                    code: "zlint-failed",
                    message: `zlint failed: ${err instanceof Error ? err.message : String(err)}`,
                    labels: [{
                        primary: true,
                        start: { line: 1, column: 1 },
                        end: { line: 1, column: 1 }
                    }]
                }];
            }
    }

    const diagnostics = parseZlintOutput(stdout);

    ZlintCache.entries.set(cacheKey, {
        mtimeMs: stat.mtimeMs,
        diagnostics
    });

    return diagnostics;
}

/**
 * @type {import("eslint").Rule.RuleModule}
 */
module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Run zlint and surface diagnostics through ESLint",
            category: "Best Practices",
            recommended: true
        },

        schema: [{
            type: "object",
            properties: {
                zlintPath: { type: "string" },
                failIfMissing: { type: "boolean" },
                timeoutMs: { type: "number" }
            },

            additionalProperties: false
        }]
    },

    create(context) {
        const options = context.options[0] ?? {};
        const filename = context.filename;

        if (!filename || filename === "<input>" || !filename.endsWith(".zig")) {
            return {};
        }

        return {
            Program() {
                const absolutePath = path.isAbsolute(filename)
                    ? filename
                    : path.resolve(process.cwd(), filename);

                const diagnostics = runZlint(absolutePath, options);

                for (const diagnostic of diagnostics) {
                    if (diagnostic.code === "zlint-missing" && options.failIfMissing) {
                        context.report({
                            loc: { line: 1, column: 0 },
                            message: diagnostic.message,
                            severity: 2
                        });
                        continue;
                    }

                    const labels = diagnostic.labels ?? [];
                    const primary = labels.find((label) => label.primary) ?? labels[0];
                    const line = primary?.start?.line ?? 1;
                    const column = Math.max((primary?.start?.column ?? 1) - 1, 0);

                    context.report({
                        loc: { line, column },
                        message: diagnostic.message,
                        severity: mapSeverity(diagnostic.level)
                    });
                }
            }
        };
    }
};

module.exports.parseZlintOutput = parseZlintOutput;
module.exports.findProjectRoot = findProjectRoot;
module.exports.ZlintCache = ZlintCache;
