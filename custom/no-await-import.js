/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow `await import()` or `require()` inside functions unless justified with a `@tag` comment above",
            category: "Best Practices",
            recommended: true
        },
        schema: []
    },

    create(context) {
        const sourceCode = context.sourceCode;

        /**
         * Returns true if the call is `require("static-string")`.
         *
         * @param {import("eslint").Rule.Node} node
         * @returns {boolean}
         */
        function isStaticRequire(node) {
            return (
                node.type === "CallExpression" &&
                node.callee.type === "Identifier" &&
                node.callee.name === "require" &&
                node.arguments.length === 1 &&
                node.arguments[0].type === "Literal"
            );
        }

        /**
         * Returns true if the node is inside a function body (not top-level).
         *
         * @param {import("eslint").Rule.Node} node
         * @returns {boolean}
         */
        function isInsideFunction(node) {
            let current = node.parent;

            while (current) {
                if (
                    current.type === "FunctionDeclaration" ||
                    current.type === "FunctionExpression" ||
                    current.type === "ArrowFunctionExpression"
                ) {
                    return true;
                }

                current = current.parent;
            }

            return false;
        }

        /**
         * Returns true if a `// @tag` comment (non-eslint, non-ts) precedes the statement.
         *
         * @param {import("eslint").Rule.Node} node
         * @returns {boolean}
         */
        function isJustified(node) {
            let target = node;

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
            // await import("static-path")
            AwaitExpression(node) {
                if (node.argument.type !== "ImportExpression") {
                    return;
                }

                if (node.argument.source.type !== "Literal") {
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
            },

            // require("static-path") inside a function body
            CallExpression(node) {
                if (!isStaticRequire(node)) {
                    return;
                }

                if (!isInsideFunction(node)) {
                    return;
                }

                if (isJustified(node)) {
                    return;
                }

                context.report({
                    node,
                    message:
                        "Avoid `require()` with a static path inside a function. Use a regular `import` at the top of the file, " +
                        "or add a `// @lazy` comment above to justify lazy loading."
                });
            }
        };
    }
};
