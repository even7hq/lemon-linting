/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Enforce the use of parentheses in function calls",
            category: "Best Practices",
            recommended: true
        },
        fixable: "code",
        schema: []
    },

    create(context) {
        return {
            TableCallExpression(node) {
                context.report({
                    node,
                    message: "Function calls must use parentheses.",
                    fix(fixer) {
                        const base = node.base;
                        const arg = node.arguments;
                        return fixer.replaceText(node, `${context.sourceCode.getText(base)}(${context.sourceCode.getText(arg)})`);
                    }
                });
            },

            StringCallExpression(node) {
                context.report({
                    node,
                    message: "Function calls must use parentheses.",
                    fix(fixer) {
                        const base = node.base;
                        const arg = node.argument;
                        return fixer.replaceText(node, `${context.sourceCode.getText(base)}(${context.sourceCode.getText(arg)})`);
                    }
                });
            }
        };
    }
};
