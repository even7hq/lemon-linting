/**
 * Requires a blank JSX line between sibling elements that have children.
 */
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
        const sourceCode = context.getSourceCode();

        /**
         * Returns true if a JSX element has at least one non-whitespace child.
         *
         * @param node - The JSXElement node.
         * @returns True if the element has children.
         */
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

        /**
         * Returns the previous JSX sibling element (ignoring whitespace text nodes).
         *
         * @param node - The JSX node.
         * @returns The previous sibling JSXElement, or null.
         */
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

                const prevEnd = prev.loc.end.line;
                const currStart = node.loc.start.line;

                if (currStart - prevEnd < 2) {
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
            }
        };
    }
};
