/**
 * @type {import("eslint").Rule.RuleModule}
 */
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

        // In Vue/Svelte, the autofix conflicts with svelte/indent causing circular
        // fix warnings. The rule still reports; fix manually or via --fix in .ts files.
        const filename = context.filename ?? context.getFilename?.() ?? "";
        const canFix = !/\.(vue|svelte)$/.test(filename);

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

                // Derive indent from the actual source line of the `else` token,
                // which is always on the same line as the closing `}` of the outer if.
                // This is reliable even in Vue/Svelte where node.loc/range may be offset.
                const fullText = sourceCode.getText();
                const elsePos = elseToken.range[0];
                const elseLineStart = fullText.lastIndexOf("\n", elsePos - 1) + 1;
                const ifIndent = fullText.slice(elseLineStart, elsePos).match(/^[ \t]*/)[0];
                const expectedBetween = "\n" + ifIndent;

                // Already on a new line - check that the indent matches the parent `if` column.
                // Allow comments between `else` and `if` (strip them before comparing indent).
                if (betweenText.includes("\n")) {
                    // Strip comment lines and collapse multiple newlines to one,
                    // then check that the remaining indent matches the parent `if` column.
                    const textWithoutComments = betweenText
                        .replace(/[ \t]*\/\/[^\n]*/g, "")
                        .replace(/[ \t]*\/\*[\s\S]*?\*\//g, "")
                        .replace(/\n+/g, "\n");

                    if (textWithoutComments === expectedBetween) {
                        return;
                    }

                    context.report({
                        node: ifToken,
                        message: "The `if` after `else` must be indented at the same level as `else`.",
                        fix: canFix ? (fixer) => fixer.replaceTextRange(betweenRange, expectedBetween) : null
                    });

                    return;
                }

                context.report({
                    node: ifToken,
                    message: "Use `} else\\nif` instead of `} else if` for chained conditionals.",
                    fix: canFix ? (fixer) => fixer.replaceTextRange(betweenRange, expectedBetween) : null
                });
            }
        };
    }
};
