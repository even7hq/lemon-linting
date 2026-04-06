/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Require a blank JSX line between sibling JSX elements that have children",
            category: "Style",
            recommended: true
        },
        fixable: "whitespace",
        schema: []
    },

    create(context) {
        const sourceCode = context.sourceCode;

        function hasChildren(node) {
            if (node.type !== "JSXElement") {
                return false;
            }

            return node.children.some((child) => {
                if (child.type === "JSXText") {
                    return child.value.trim() !== "";
                }

                return true;
            });
        }

        function getPreviousElementSibling(node) {
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

                if (sibling.type === "JSXElement") {
                    return sibling;
                }

                return null;
            }

            return null;
        }

        return {
            JSXElement(node) {
                if (!hasChildren(node)) {
                    return;
                }

                const prev = getPreviousElementSibling(node);

                if (!prev || !hasChildren(prev)) {
                    return;
                }

                if (node.loc.start.line - prev.loc.end.line >= 2) {
                    return;
                }

                context.report({
                    node,
                    message: "Expected a blank JSX line between sibling elements with children.",
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
