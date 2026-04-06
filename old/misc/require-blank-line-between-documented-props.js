module.exports = {
    meta: {
        type: "suggestion",

        docs: {
            description: "Require a blank line between interface/type properties when any has a JSDoc block",
            category: "Style",
            recommended: true
        },

        fixable: "whitespace",
        schema: []
    },

    create(context) {
        const sourceCode = context.getSourceCode();

        /**
         * Returns the leading JSDoc block comment for a node, or null.
         *
         * @param node - The AST node to check.
         * @returns The JSDoc block comment, or null.
         */
        function getJsDocComment(node) {
            const comments = sourceCode.getCommentsBefore(node);
            for (let i = comments.length - 1; i >= 0; i--) {
                const comment = comments[i];
                if (comment.type === "Block" && comment.value.startsWith("*")) {
                    return comment;
                }
            }
            return null;
        }

        /**
         * Checks a list of property-like nodes (TSPropertySignature, PropertyDefinition).
         *
         * @param properties - The list of property nodes to check.
         */
        function checkProperties(properties) {
            for (let i = 1; i < properties.length; i++) {
                const current = properties[i];
                const previous = properties[i - 1];
                const currentDoc = getJsDocComment(current);
                const previousDoc = getJsDocComment(previous);

                if (!currentDoc && !previousDoc) {
                    continue;
                }

                const tokenBefore = sourceCode.getTokenBefore(currentDoc ?? current, { includeComments: true });
                if (!tokenBefore) {
                    continue;
                }

                const linesBetween = (currentDoc ?? current).loc.start.line - tokenBefore.loc.end.line;

                if (linesBetween < 2) {
                    context.report({
                        node: currentDoc ?? current,
                        message: "Expected a blank line before this documented property.",

                        fix(fixer) {
                            return fixer.insertTextAfter(tokenBefore, "\n");
                        }
                    });
                }
            }
        }

        return {
            TSInterfaceBody(node) {
                checkProperties(node.body);
            },
            TSTypeLiteral(node) {
                checkProperties(node.members);
            }
        };
    }
};
