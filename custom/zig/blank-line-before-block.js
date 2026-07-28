/**
 * Enforces a blank line before block-opening keywords in Zig.
 */

/**
 * @type {import("eslint").Rule.RuleModule}
 */
module.exports = {
    meta: {
        type: "layout",
        fixable: "whitespace",
        docs: {
            description: "Enforce a blank line before block statements (if, while, for, switch)",
            category: "Stylistic Issues",
            recommended: true
        },

        schema: []
    },

    create(context) {
        const sourceCode = context.sourceCode;
        const BLOCK_RE = /^\s*(if|while|for|switch)\b/;

        return {
            Program() {
                const text = sourceCode.getText();
                const lines = text.split("\n");
                const lineOffsets = [];
                let off = 0;

                for (const l of lines) {
                    lineOffsets.push(off);
                    off += l.length + 1;
                }

                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i];

                    if (!BLOCK_RE.test(line)) {
                        continue;
                    }

                    const above = lines[i - 1];
                    const aboveTrimmed = above.trim();

                    if (aboveTrimmed === "") {
                        continue;
                    }

                    if (aboveTrimmed.startsWith("//")) {
                        continue;
                    }

                    if (/\)\s*$|\{\s*$|\bthen\s*$|\belse\s*$/.test(aboveTrimmed)) {
                        continue;
                    }

                    if (/[{,]\s*$/.test(aboveTrimmed)) {
                        continue;
                    }

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
