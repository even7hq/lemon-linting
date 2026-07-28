const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { Linter } = require("eslint");
const zigConfig = require("../../zig.config.js");
const { parseZlintOutput } = require("../../custom/zig/run-zlint.js");

const linter = new Linter({ configType: "flat" });
const root = path.join(__dirname, "../..");

/**
 * Lints a fixture file with the zig preset.
 *
 * @param relativePath Path relative to lemon-linting root.
 * @returns ESLint messages for the file.
 */
function lintFixture(relativePath) {
    const absolutePath = path.join(root, relativePath);
    const code = fs.readFileSync(absolutePath, "utf8");

    return linter.verify(code, zigConfig, { filename: absolutePath });
}

/**
 * Asserts that ESLint reports at least one message matching a substring.
 *
 * @param relativePath Fixture path relative to lemon-linting root.
 * @param messageSubstring Expected message fragment.
 * @returns Nothing.
 */
function expectRuleMessage(relativePath, messageSubstring) {
    const messages = lintFixture(relativePath);

    assert.ok(
        messages.some((message) => message.message.includes(messageSubstring)),
        `Expected "${messageSubstring}" in ${relativePath}, got: ${JSON.stringify(messages)}`
    );
}

parseZlintOutput("");
assert.equal(
    parseZlintOutput('{"level":"warn","message":"oops","code":"demo","labels":[{"primary":true,"start":{"line":2,"column":3},"end":{"line":2,"column":4}}]}').length,
    1
);

expectRuleMessage("test/zig/bad_no_multi_spaces.zig", "multiple spaces");
expectRuleMessage("test/zig/bad_blank_line_before_block.zig", "blank line");
expectRuleMessage("test/zig/bad_no_doc_dash_separator.zig", " - ");
expectRuleMessage("test/zig/bad_require_doc.zig", "Missing doc comment");

console.log("zig eslint tests passed");
