/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Prefer `} else\\nif` over `} else if` for chained conditionals",
            category: "Style",
            recommended: true
        },
        fixable: "code",
        schema: []
    },

    create(context) {
        const sourceCode = context.sourceCode;

        return {
            IfStatement(node) {
                if (!node.alternate || node.alternate.type !== "IfStatement") {
                    return;
                }

                const elseToken = sourceCode.getTokenBefore(node.alternate);
                const ifToken = sourceCode.getFirstToken(node.alternate);

                if (!elseToken || elseToken.value !== "else") {
                    return;
                }

                const betweenRange = [elseToken.range[1], ifToken.range[0]];
                const betweenText = sourceCode.getText().slice(betweenRange[0], betweenRange[1]);

                // The `if` must align with the parent `if` statement (same column as the outer `if`)
                const ifIndent = " ".repeat(node.loc.start.column);
                const expectedBetween = "\n" + ifIndent;

                // Already on a new line — check that the indent matches the `else` column
                if (betweenText.includes("\n")) {
                    if (betweenText === expectedBetween) {
                        return;
                    }

                    context.report({
                        node: ifToken,
                        message: "The `if` after `else` must be indented at the same level as `else`.",
                        fix(fixer) {
                            return fixer.replaceTextRange(betweenRange, expectedBetween);
                        }
                    });

                    return;
                }

                context.report({
                    node: ifToken,
                    message: "Use `} else\\nif` instead of `} else if` for chained conditionals.",
                    fix(fixer) {
                        return fixer.replaceTextRange(betweenRange, expectedBetween);
                    }
                });
            }
        };
    }
};
