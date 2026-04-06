/**
 * Autofixable rule: requires a blank line before an object property/method when
 * the previous property ends with a block (`}`) or call result (`)`).
 *
 * Exception: single-property objects are ignored.
 */

/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "suggestion",

        docs: {
            description: "Require a blank line before object properties that follow a closing `}` or `)`",
            category: "Style",
            recommended: true
        },

        fixable: "whitespace",
        schema: []
    },

    create(context) {
        const sourceCode = context.getSourceCode();

        /**
         * Returns the last meaningful token of a node (skipping trailing commas).
         *
         * @param {import("eslint").Rule.Node} node
         * @returns {import("eslint").Rule.Node}
         */
        function getLastToken(node) {
            let token = sourceCode.getLastToken(node);

            // Skip trailing comma
            if (token && token.value === ",") {
                token = sourceCode.getTokenBefore(token);
            }

            return token;
        }

        /**
         * @param {import("eslint").Rule.Node[]} properties
         */
        function checkProperties(properties) {
            // Exception: single property — no blank line needed
            if (properties.length <= 1) {
                return;
            }

            for (let i = 1; i < properties.length; i++) {
                const prev = properties[i - 1];
                const curr = properties[i];

                const lastToken = getLastToken(prev);

                if (!lastToken) {
                    continue;
                }

                // Only enforce when the previous property value spans multiple lines
                const prevFirstToken = sourceCode.getFirstToken(prev);

                if (!prevFirstToken || lastToken.loc.end.line === prevFirstToken.loc.start.line) {
                    continue;
                }

                const currFirstToken = sourceCode.getFirstToken(curr, { includeComments: true });

                if (!currFirstToken) {
                    continue;
                }

                const linesBetween = currFirstToken.loc.start.line - lastToken.loc.end.line;

                // Need at least one blank line (2 line difference)
                if (linesBetween >= 2) {
                    continue;
                }

                context.report({
                    node: curr,
                    message: "Expected a blank line before this property — the previous property ends with `}` or `)`.",
                    fix(fixer) {
                        // Find the comma/token right after the previous property ends
                        const tokenAfterPrev = sourceCode.getTokenAfter(lastToken);

                        if (!tokenAfterPrev) {
                            return null;
                        }

                        return fixer.insertTextAfter(tokenAfterPrev, "\n");
                    }
                });
            }
        }

        return {
            ObjectExpression(node) {
                checkProperties(node.properties);
            }
        };
    }
};
