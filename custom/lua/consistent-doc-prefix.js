/**
 * Enforces that `@tag` lines in a Lua doc-comment block use the `---` prefix.
 *
 * Only lines containing `@param`, `@returns`/`@return`, or `@throws`/`@throw`
 * are required to use `---`. Plain description lines are left untouched.
 *
 * @example
 * -- Bad
 * -- Description.
 * -- @param x number Description
 * function foo(x) end
 *
 * -- Good
 * -- Description.
 * --- @param x number Description
 * function foo(x) end
 */

/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "layout",
        fixable: "code",
        docs: {
            description: "Require `---` prefix on @tag lines of a Lua doc-comment block",
            category: "Style",
            recommended: true
        },
        schema: []
    },

    create(context) {
        const sourceCode = context.sourceCode;

        const TAG_RE = /@param\b|@returns?\b|@throws?\b/;

        return {
            Program() {
                const text = sourceCode.getText();
                const lines = text.split("\n");

                lines.forEach((lineText, idx) => {
                    const trimmed = lineText.trimStart();

                    // Only double-dash lines that carry a @tag.
                    if (!trimmed.startsWith("--") || trimmed.startsWith("---")) return;
                    if (!TAG_RE.test(trimmed)) return;

                    const lineNum = idx + 1;
                    const colOffset = lineText.indexOf("--");

                    // Absolute offset of `--` in the full source.
                    const lineStart = text.split("\n").slice(0, idx).reduce((acc, l) => acc + l.length + 1, 0);
                    const dashStart = lineStart + colOffset;

                    context.report({
                        loc: { line: lineNum, column: colOffset },
                        message: "Doc @tag lines must use `---` prefix, not `--`.",
                        fix(fixer) {
                            return fixer.replaceTextRange([dashStart, dashStart + 2], "---");
                        }
                    });
                });
            }
        };
    }
};
