/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Require a blank line before object properties that follow a multiline previous property",
            category: "Style",
            recommended: true
        },
        fixable: "whitespace",
        schema: []
    },

    create(context) {
        const sourceCode = context.sourceCode;

        function getLastToken(node) {
            let token = sourceCode.getLastToken(node);

            if (token && token.value === ",") {
                token = sourceCode.getTokenBefore(token);
            }

            return token;
        }

        function checkProperties(properties) {
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

                const prevFirstToken = sourceCode.getFirstToken(prev);

                if (!prevFirstToken || lastToken.loc.end.line === prevFirstToken.loc.start.line) {
                    continue;
                }

                const currFirstToken = sourceCode.getFirstToken(curr, { includeComments: true });

                if (!currFirstToken) {
                    continue;
                }

                if (currFirstToken.loc.start.line - lastToken.loc.end.line >= 2) {
                    continue;
                }

                context.report({
                    node: curr,
                    message: "Expected a blank line before this property - the previous property ends with `}` or `)`.",
                    fix(fixer) {
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
