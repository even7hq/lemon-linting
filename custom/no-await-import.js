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
         * Returns true if a `// @tag` comment (non-eslint, non-ts) precedes the node or
         * any ancestor (e.g. `// @lazy` above a Sequelize `@HasMany` decorator).
         *
         * @param {import("eslint").Rule.Node} node
         * @returns {boolean}
         */
        function isJustified(node) {
            let current = node;

            while (current) {
                const comments = sourceCode.getCommentsBefore(current);

                for (const comment of comments) {
                    if (/@(?!eslint-|ts-)(\w+)/.test(comment.value)) {
                        return true;
                    }
                }

                current = current.parent;
            }

            return hasClassBodyLazyComment(node);
        }

        /**
         * When a single `// @lazy` sits at the top of a class section, it applies to every
         * decorated property below (Sequelize association pattern).
         *
         * @param {import("eslint").Rule.Node} node
         * @returns {boolean}
         */
        function hasClassBodyLazyComment(node) {
            if (!isInsideDecoratorProperty(node)) {
                return false;
            }

            const member = findEnclosingClassMember(node);
            const classBody = member?.parent;

            if (!member || classBody?.type !== "ClassBody") {
                return false;
            }

            for (const comment of sourceCode.ast.comments) {
                if (comment.range[0] < classBody.range[0] || comment.range[1] > member.range[0]) {
                    continue;
                }

                if (/@(?!eslint-|ts-)(\w+)/.test(comment.value)) {
                    return true;
                }
            }

            return false;
        }

        /**
         * @param {import("eslint").Rule.Node} node
         * @returns {boolean}
         */
        function isInsideDecoratorProperty(node) {
            let current = node;

            while (current) {
                if (current.type === "Decorator") {
                    const parent = current.parent;

                    return parent?.type === "PropertyDefinition" || parent?.type === "ClassProperty";
                }

                current = current.parent;
            }

            return false;
        }

        /**
         * @param {import("eslint").Rule.Node} node
         * @returns {import("eslint").Rule.Node | null}
         */
        function findEnclosingClassMember(node) {
            let current = node;

            while (current) {
                if (
                    current.type === "PropertyDefinition" ||
                    current.type === "MethodDefinition" ||
                    current.type === "ClassProperty"
                ) {
                    return current;
                }

                current = current.parent;
            }

            return null;
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
