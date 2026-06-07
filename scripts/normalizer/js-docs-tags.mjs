#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { normalizeFileContent } = require("./normalize-jsdoc-line.js");

const DEFAULT_EXCLUDES = new Set(["node_modules", "dist", ".git", "coverage", "build", "data"]);

/**
 * Parses CLI arguments into a config object.
 *
 * @param argv Process argv slice.
 * @returns Parsed CLI options.
 */
function parseArgs(argv) {
    const options = {
        root: process.cwd(),
        extensions: ["ts", "tsx"],
        excludes: [...DEFAULT_EXCLUDES],
        dryRun: false
    };

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];

        if (arg === "--root") {
            options.root = path.resolve(argv[++i]);
            continue;
        }

        if (arg === "--ext") {
            options.extensions = argv[++i].split(",").map((ext) => ext.trim().replace(/^\./, ""));
            continue;
        }

        if (arg === "--exclude") {
            options.excludes = argv[++i].split(",").map((part) => part.trim()).filter(Boolean);
            continue;
        }

        if (arg === "--dry-run") {
            options.dryRun = true;
        }
    }

    return options;
}

/**
 * Returns true when a directory name should be skipped.
 *
 * @param dirName Directory basename.
 * @param excludes Excluded directory names.
 * @returns True when the directory must be skipped.
 */
function isExcludedDir(dirName, excludes) {
    return excludes.includes(dirName);
}

/**
 * Collects matching files recursively.
 *
 * @param dir Root directory to scan.
 * @param extensions Allowed file extensions without dot.
 * @param excludes Directory names to skip.
 * @returns Absolute file paths.
 */
function collectFiles(dir, extensions, excludes) {
    const results = [];

    if (!fs.existsSync(dir)) {
        return results;
    }

    let entries;

    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === "EACCES") {
            return results;
        }

        throw error;
    }

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            if (isExcludedDir(entry.name, excludes)) {
                continue;
            }

            results.push(...collectFiles(fullPath, extensions, excludes));
            continue;
        }

        if (!entry.isFile()) {
            continue;
        }

        const ext = path.extname(entry.name).slice(1);

        if (extensions.includes(ext)) {
            results.push(fullPath);
        }
    }

    return results;
}

/**
 * Processes one file and returns change metadata.
 *
 * @param filePath Absolute path to the file.
 * @param dryRun When true, do not write changes.
 * @returns Change summary for the file.
 */
function processFile(filePath, dryRun) {
    const original = fs.readFileSync(filePath, "utf8");
    const normalized = normalizeFileContent(original);

    if (normalized === original) {
        return { changed: false, filePath };
    }

    if (!dryRun) {
        fs.writeFileSync(filePath, normalized, "utf8");
    }

    return { changed: true, filePath };
}

/**
 * Prints per-repo summary lines from changed file paths.
 *
 * @param changedFiles Changed absolute file paths.
 * @param root Workspace root used to derive repo labels.
 * @returns Nothing.
 */
function printSummary(changedFiles, root) {
    const byRepo = new Map();

    for (const filePath of changedFiles) {
        const relative = path.relative(root, filePath);
        const repo = relative.split(path.sep)[0] || relative;
        byRepo.set(repo, (byRepo.get(repo) ?? 0) + 1);
    }

    console.log("Changed files by repo:");

    for (const [repo, count] of [...byRepo.entries()].sort((a, b) => b[1] - a[1])) {
        console.log(`  ${repo}: ${count}`);
    }
}

const options = parseArgs(process.argv.slice(2));
const files = collectFiles(options.root, options.extensions, options.excludes);
const changedFiles = [];

for (const filePath of files) {
    const result = processFile(filePath, options.dryRun);

    if (result.changed) {
        changedFiles.push(filePath);
    }
}

console.log(`Scanned ${files.length} file(s).`);
console.log(`${options.dryRun ? "Would change" : "Changed"} ${changedFiles.length} file(s).`);

if (changedFiles.length > 0) {
    printSummary(changedFiles, options.root);
}
