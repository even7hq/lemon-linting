module.exports = {
    meta: {
        type: "suggestion",

        docs: {
            description: "Require @param and @returns TSDoc tags on documented functions and methods",
            category: "Best Practices",
            recommended: true
        },

        schema: []
    },

    create(context) {
        const sourceCode = context.getSourceCode();

        /**
         * Returns the leading JSDoc comment block for a node, or null.
         *
         * @param node The node to get the JSDoc comment for.
         * @returns The leading JSDoc comment block, or null if not found.
         */
        function getJsDocComment(node) {
            const nodesToCheck = [node];

            // Also check ancestor wrappers (export, variable declaration, property, method)
            const parent = node.parent;
            if (parent) {
                if (
                    parent.type === "ExportNamedDeclaration" ||
                    parent.type === "ExportDefaultDeclaration" ||
                    parent.type === "MethodDefinition" ||
                    parent.type === "Property"
                ) {
                    nodesToCheck.push(parent);
                }

                if (parent.type === "VariableDeclarator" && parent.parent?.type === "VariableDeclaration") {
                    nodesToCheck.push(parent.parent);
                    if (parent.parent.parent?.type === "ExportNamedDeclaration") {
                        nodesToCheck.push(parent.parent.parent);
                    }
                }
            }

            for (const candidate of nodesToCheck) {
                const comments = sourceCode.getCommentsBefore(candidate);
                for (let i = comments.length - 1; i >= 0; i--) {
                    const comment = comments[i];
                    if (comment.type === "Block" && comment.value.startsWith("*")) {
                        return comment;
                    }
                }
            }

            return null;
        }

        /**
         * Extracts the tag names present in a JSDoc comment block value.
         *
         * @param commentValue The JSDoc comment block value to extract tag names from.
         * @returns A set of tag names present in the comment value.
         */
        function getTagNames(commentValue) {
            // Only match @ tags at the beginning of a JSDoc line (after * and whitespace)
            const tagPattern = /^\s*\*?\s*@(\w+)/gm;
            const tags = new Set();
            let match;

            while ((match = tagPattern.exec(commentValue)) !== null) {
                tags.add(match[1]);
            }

            return tags;
        }

        /**
         * Returns true when a TypeScript type annotation is void or Promise<void>.
         *
         * @param returnTypeAnnotation The TypeScript type annotation to check.
         * @returns True if the type annotation is void or Promise<void>, false otherwise.
         */
        function isVoidReturnType(returnTypeAnnotation) {
            if (!returnTypeAnnotation) {
                return false;
            }

            const typeNode = returnTypeAnnotation.typeAnnotation ?? returnTypeAnnotation;

            if (typeNode.type === "TSVoidKeyword") {
                return true;
            }

            // Promise<void>
            if (
                typeNode.type === "TSTypeReference" &&
                typeNode.typeName?.name === "Promise" &&
                typeNode.typeParameters?.params?.length === 1 &&
                typeNode.typeParameters.params[0].type === "TSVoidKeyword"
            ) {
                return true;
            }

            return false;
        }

        /**
         * Validates a function node against its JSDoc comment.
         *
         * @param node The function node to validate.
         * @param commentNode The JSDoc comment node to validate.
         */
        function checkFunction(node, commentNode) {
            if (!commentNode) {
                return;
            }

            const commentValue = commentNode.value;
            const tags = getTagNames(commentValue);
            const params = node.params ?? [];

            // Check @param for each non-rest, non-destructured parameter
            for (const param of params) {
                if (param.type === "Identifier") {
                    const name = param.name;

                    // Match @param name or @param {type} name
                    const hasTag = new RegExp(`@param\\s+(\\{[^}]+\\}\\s+)?${name}\\b`).test(commentValue);

                    if (!hasTag) {
                        context.report({
                            node: commentNode,
                            message: `Missing @param tag for parameter "${name}".`
                        });
                    }
                }
            }

            // Check @returns when the function has a non-void return type annotation
            const returnType = node.returnType;
            if (returnType && !isVoidReturnType(returnType) && !tags.has("returns") && !tags.has("return")) {
                context.report({
                    node: commentNode,
                    message: "Missing @returns tag for non-void return type."
                });
            }
        }

        /**
         * Handles a function node by checking its JSDoc comment.
         *
         * @param node The function node to handle.
         */
        function handleFunction(node) {
            const commentNode = getJsDocComment(node);
            if (commentNode) {
                checkFunction(node, commentNode);
            }
        }

        return {
            FunctionDeclaration: handleFunction,
            FunctionExpression: handleFunction,
            ArrowFunctionExpression: handleFunction
        };
    }
};
