/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Require JSDoc block comments to use multiline format",
            category: "Style",
            recommended: true
        },
        fixable: "code",
        schema: []
    },

    create(context) {
        const sourceCode = context.sourceCode;

        function isSingleLineJsDoc(comment) {
            return (
                comment.type === "Block" &&
                comment.value.startsWith("*") &&
                comment.loc.start.line === comment.loc.end.line
            );
        }

        function fix(fixer, comment) {
            const indent = " ".repeat(comment.loc.start.column);
            const content = comment.value.replace(/^\*\s*/, "").replace(/\s*$/, "");
            const multiline = `/**\n${indent} * ${content}\n${indent} */`;

            return fixer.replaceTextRange(comment.range, multiline);
        }

        return {
            Program() {
                const comments = sourceCode.getAllComments();

                for (const comment of comments) {
                    if (isSingleLineJsDoc(comment)) {
                        context.report({
                            node: comment,
                            message: "JSDoc block comments must use multiline format (/** ... */ on a single line is not allowed).",
                            fix: (fixer) => fix(fixer, comment)
                        });
                    }
                }
            }
        };
    }
};
