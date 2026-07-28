/**
 * Disallows alignment padding with multiple consecutive spaces before '='.
 */

/**
 * @type {import("eslint").Rule.RuleModule}
 */
module.exports = {
    meta: {
        type: "layout",
        docs: {
            description: "Disallow multi-space alignment padding before '=' in Zig",
            category: "Stylistic Issues",
            recommended: true
        },

        schema: []
    },

    create(context) {
        const sourceCode = context.sourceCode;
        const ALIGN_RE = /[a-zA-Z0-9_)"']\s{2,}=/;

        return {
            Program() {
                const lines = sourceCode.getText().split("\n");

                lines.forEach((line, idx) => {
                    const trimmed = line.trimStart();

                    if (trimmed.startsWith("//")) {
                        return;
                    }

                    if (ALIGN_RE.test(line)) {
                        context.report({
                            loc: { line: idx + 1, column: 0 },
                            message: "Do not use multiple spaces for alignment before '='."
                        });
                    }
                });
            }
        };
    }
};
