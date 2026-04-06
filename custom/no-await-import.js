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
        const sourceCode = context.sourceCode;

        function isStaticImport(node) {
            return node.source.type === "Literal";
        }

        function isJustified(awaitNode) {
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
                if (/@(?!eslint-|ts-)(\w+)/.test(comment.value)) {
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

                if (!isStaticImport(node.argument)) {
                    return;
                }

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
