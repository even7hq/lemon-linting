#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const pluginSrc = path.resolve(__dirname, "old");
const targetName = "eslint-plugin-local";

let dir = process.cwd();

while (dir !== path.dirname(dir)) {
    const target = path.join(dir, "node_modules", targetName);

    if (fs.existsSync(path.join(dir, "node_modules")) && !fs.existsSync(target)) {
        try {
            fs.symlinkSync(pluginSrc, target, "junction");
            console.log(`[@lemon/linting] Linked ${target}`);
        } catch (err) {
            console.warn(`[@lemon/linting] Could not link ${target}: ${err.message}`);
        }
    }

    dir = path.dirname(dir);
}
