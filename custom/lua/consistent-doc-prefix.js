/**
 * Enforces `---` on every line of a Lua TSDoc block above a function.
 *
 * When a comment run above `function` includes `@param`, `@return(s)`, or
 * `@throws`, description and separator lines must also use `---`, not `--`.
 *
 * @example
 * -- Bad
 * --- Summary.
 * ---
 * -- @param x number Description
 * function foo(x) end
 *
 * -- Good
 * --- Summary.
 * ---
 * --- @param x number Description
 * function foo(x) end
 */

const {
    getCommentRunAboveLine,
    isTsdocCommentRun,
    lineIndexAtOffset
} = require("./LuaDocCommentRun");

/**
 * @type {import("eslint").Rule.RuleModule}
 */
module.exports = {
    meta: {
        type: "layout",
        fixable: "code",
        docs: {
            description: "Require `---` prefix on all lines of a Lua TSDoc comment block",
            category: "Style",
            recommended: true
        },

        schema: []
    },

    create(context) {
        const sourceCode = context.sourceCode;

        /**
         * Reports and fixes `--` lines inside a TSDoc comment run.
         *
         * @param run Comment lines above the anchor.
         * @returns Nothing.
         */
        function checkCommentRun(run) {
            if (!isTsdocCommentRun(run)) {
                return;
            }

            const text = sourceCode.getText();
            const lines = text.split("\n");

            for (const entry of run) {
                const lineText = entry.lineText;
                const trimmed = lineText.trimStart();

                if (!trimmed.startsWith("--") || trimmed.startsWith("---")) {
                    continue;
                }

                const colOffset = lineText.indexOf("--");
                const lineStart = lines.slice(0, entry.lineIndex).reduce((acc, line) => acc + line.length + 1, 0);
                const dashStart = lineStart + colOffset;
                const lineNum = entry.lineIndex + 1;

                context.report({
                    loc: { line: lineNum, column: colOffset },
                    message: "TSDoc comment lines must use `---` prefix, not `--`.",
                    fix(fixer) {
                        return fixer.replaceTextRange([dashStart, dashStart + 2], "---");
                    }
                });
            }
        }

        /**
         * @param {import("eslint").Rule.Node} node Function node with a range.
         * @returns Nothing.
         */
        function checkFunctionAnchor(node) {
            if (!node.range) {
                return;
            }

            const text = sourceCode.getText();
            const lines = text.split("\n");
            const anchorLine = lineIndexAtOffset(text, node.range[0]);
            const run = getCommentRunAboveLine(lines, anchorLine);

            checkCommentRun(run);
        }

        return {
            LuaFunctionDeclaration: checkFunctionAnchor
        };
    }
};
