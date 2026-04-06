/**
 * Requires a blank JSX line before conditional expressions ({x && <...>})
 * and map/flatMap calls ({arr.map(...)}) inside JSX.
 */
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
        const sourceCode = context.getSourceCode();

        /**
         * Returns true if a JSXExpressionContainer contains a conditional (&&, ||, ?:)
         * or a .map() / .flatMap() call.
         *
         * @param node - The JSXExpressionContainer node.
         * @returns True if the expression is a conditional or map call.
         */
        function isBlockExpression(node) {
            const expr = node.expression;

            if (!expr || expr.type === "JSXEmptyExpression") {
                return false;
            }

            // {condition && <...>} or {condition || <...>}
            if (expr.type === "LogicalExpression") {
                return true;
            }

            // {condition ? <...> : <...>}
            if (expr.type === "ConditionalExpression") {
                return true;
            }

            // {arr.map(...)} or {arr.flatMap(...)}
            if (
                expr.type === "CallExpression" &&
                expr.callee.type === "MemberExpression" &&
                (expr.callee.property.name === "map" || expr.callee.property.name === "flatMap")
            ) {
                return true;
            }

            return false;
        }

        /**
         * Returns the previous JSX sibling of a node (ignoring text-only whitespace nodes).
         *
         * @param node - The JSX node.
         * @returns The previous sibling node, or null.
         */
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

                const prevEnd = prev.loc.end.line;
                const currStart = node.loc.start.line;

                if (currStart - prevEnd < 2) {
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
            }
        };
    }
};
