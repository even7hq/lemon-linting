/**
 * Enforces a blank line before block-opening keywords (if, while, for, do,
 * function) when the immediately preceding line is non-empty and is not a
 * comment.
 *
 * Works by scanning the raw source text line-by-line, since the Lua parser
 * does not populate node locations reliably enough for fixer-based fixes.
 */

/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "layout",
        fixable: "whitespace",
        docs: {
            description: "Enforce a blank line before block statements (if, while, for, do, function)",
            category: "Stylistic Issues",
            recommended: true
        },
        schema: []
    },

    create(context) {
        const sourceCode = context.sourceCode;

        // Keywords that open a block and need a blank line above.
        const BLOCK_RE = /^\s*(if|while|for|do|function)\b/;

        return {
            Program() {
                const text = sourceCode.getText();
                const lines = text.split("\n");

                // Pre-compute the absolute start offset of each line.
                const lineOffsets = [];
                let off = 0;

                for (const l of lines) {
                    lineOffsets.push(off);
                    off += l.length + 1;
                }

                // Track whether we're inside a long string [[ ... ]] to avoid
                // false positives on Lua code embedded inside string literals.
                let insideLongString = false;

                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i];

                    if (insideLongString) {
                        if (line.includes("]]")) insideLongString = false;
                        continue;
                    }

                    if (line.includes("[[")) {
                        if (!line.includes("]]")) insideLongString = true;
                        continue;
                    }

                    if (!BLOCK_RE.test(line)) continue;

                    const above = lines[i - 1];
                    const aboveTrimmed = above.trim();

                    // Already blank above — OK.
                    if (aboveTrimmed === "") continue;

                    // Comment immediately above belongs to this block — OK.
                    if (aboveTrimmed.startsWith("--")) continue;

                    // Line above ends with a block opener — this is the first
                    // statement inside that block, no blank line needed.
                    if (/(?:function\s*\(.*\)|then|do|repeat)\s*$/.test(aboveTrimmed)) continue;

                    // End of the line above (before its \n) — insert \n there.
                    const endOfLineAbove = lineOffsets[i] - 1;

                    context.report({
                        loc: { line: i + 1, column: 0 },
                        message: "Expected a blank line before this block.",
                        fix(fixer) {
                            return fixer.insertTextAfterRange(
                                [lineOffsets[i - 1], endOfLineAbove],
                                "\n"
                            );
                        }
                    });
                }
            }
        };
    }
};
