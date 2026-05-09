/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "layout",
        docs: {
            description: "Enforce a blank line before block statements (if, while, for, do)",
            category: "Stylistic Issues",
            recommended: true
        },
        fixable: "whitespace",
        schema: []
    },

    create(context) {
        const sourceCode = context.sourceCode;

        function checkPadding(node) {
            const line = node.loc.start.line;
            if (line <= 1) return;

            const lineAbove = sourceCode.lines[line - 2];
            const trimmed = lineAbove.trim();

            if (trimmed === "") return;

            // A comment line immediately above is fine — it belongs to the block.
            if (trimmed.startsWith("--")) return;

            context.report({
                node,
                message: "Expected a blank line before this block.",
                fix(fixer) {
                    return fixer.insertTextBefore(node, "\n");
                }
            });
        }

        return {
            LuaIfStatement: checkPadding,
            LuaWhileStatement: checkPadding,
            LuaForNumericStatement: checkPadding,
            LuaForGenericStatement: checkPadding,
            LuaDoStatement: checkPadding,
            LuaFunctionDeclaration: checkPadding
        };
    }
};
