/**
 * Disallows `await import(...)` unless:
 *   1. The import path is dynamic (contains a variable/expression, not a string literal), OR
 *   2. There is a JSDoc/line comment immediately above with a `@tag` (e.g. `@dynamic`, `@lazy`)
 *      — any `@word` except `@eslint-*` counts as justification.
 */

/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "suggestion",

        docs: {
            description: "Disallow `await import()` unless the import is dynamic or justified with a `@tag` comment above",
            category: "Best Practices",
            recommended: true
        },

        schema: []
    },

    create(context) {
        const sourceCode = context.getSourceCode();

        /**
         * Returns true if the node is a static string literal import — i.e. `import("some/path")`.
         *
         * @param {import("eslint").Rule.Node} node - ImportExpression node.
         * @returns {boolean}
         */
        function isStaticImport(node) {
            return node.source.type === "Literal";
        }

        /**
         * Returns true when there is a comment directly above the AwaitExpression
         * (or its ancestor statement) that contains a `@tag` other than `@eslint-*`.
         *
         * @param {import("eslint").Rule.Node} awaitNode
         * @returns {boolean}
         */
        function isJustified(awaitNode) {
            // Walk up to the nearest statement so we catch comments before the whole line
            let target = awaitNode;

            while (
                target.parent &&
                target.parent.type !== "Program" &&
                target.parent.type !== "BlockStatement" &&
                target.parent.type !== "SwitchCase"
            ) {
                target = target.parent;
            }

            const comments = sourceCode.getCommentsBefore(target);

            for (const comment of comments) {
                const text = comment.value;

                // Match any @tag that is NOT @eslint-disable / @eslint-enable / @ts-*
                if (/@(?!eslint-|ts-)(\w+)/.test(text)) {
                    return true;
                }
            }

            return false;
        }

        return {
            AwaitExpression(node) {
                if (node.argument.type !== "ImportExpression") {
                    return;
                }

                // Dynamic import (non-literal source) — always allowed
                if (!isStaticImport(node.argument)) {
                    return;
                }

                // Justified with a @tag comment above — allowed
                if (isJustified(node)) {
                    return;
                }

                context.report({
                    node,
                    message:
                        "Avoid `await import()` with a static path. Use a regular `import` at the top of the file, " +
                        "or add a `// @lazy` comment above to justify lazy loading."
                });
            }
        };
    }
};
