/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Require a blank JSX line before conditional (&&) and map expressions in JSX",
            category: "Style",
            recommended: true
        },
        fixable: "whitespace",
        schema: []
    },

    create(context) {
        const sourceCode = context.sourceCode;

        function isBlockExpression(node) {
            const expr = node.expression;

            if (!expr || expr.type === "JSXEmptyExpression") {
                return false;
            }

            if (expr.type === "LogicalExpression" || expr.type === "ConditionalExpression") {
                return true;
            }

            if (
                expr.type === "CallExpression" &&
                expr.callee.type === "MemberExpression" &&
                (expr.callee.property.name === "map" || expr.callee.property.name === "flatMap")
            ) {
                return true;
            }

            return false;
        }

        function getPreviousJsxSibling(node) {
            const parent = node.parent;

            if (!parent || !parent.children) {
                return null;
            }

            const children = parent.children;
            const idx = children.indexOf(node);

            for (let i = idx - 1; i >= 0; i--) {
                const sibling = children[i];

                if (sibling.type === "JSXText" && sibling.value.trim() === "") {
                    continue;
                }

                return sibling;
            }

            return null;
        }

        return {
            JSXExpressionContainer(node) {
                if (!isBlockExpression(node)) {
                    return;
                }

                const prev = getPreviousJsxSibling(node);

                if (!prev) {
                    return;
                }

                if (node.loc.start.line - prev.loc.end.line >= 2) {
                    return;
                }

                context.report({
                    node,
                    message: "Expected a blank JSX line before this conditional or map expression.",
                    fix(fixer) {
                        const tokenBefore = sourceCode.getTokenBefore(node, { includeComments: true });

                        if (tokenBefore) {
                            return fixer.insertTextAfter(tokenBefore, "\n");
                        }
                    }
                });
            }
        };
    }
};
