/** @type {import("eslint").Rule.RuleModule} */
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
        const sourceCode = context.sourceCode;

        function getJsDocComment(node) {
            const nodesToCheck = [node];
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

        function getTagNames(commentValue) {
            const tagPattern = /^\s*\*?\s*@(\w+)/gm;
            const tags = new Set();
            let match;

            while ((match = tagPattern.exec(commentValue)) !== null) {
                tags.add(match[1]);
            }

            return tags;
        }

        function isVoidReturnType(returnTypeAnnotation) {
            if (!returnTypeAnnotation) {
                return false;
            }

            const typeNode = returnTypeAnnotation.typeAnnotation ?? returnTypeAnnotation;

            if (typeNode.type === "TSVoidKeyword" || typeNode.type === "TSNeverKeyword") {
                return true;
            }

            if (typeNode.type === "TSTypeReference" && typeNode.typeName?.name === "Promise") {
                const params = typeNode.typeParameters?.params ?? [];

                // Promise<void>, Promise<never>, Promise<undefined>, or bare Promise<>
                if (params.length === 0) {
                    return true;
                }

                const inner = params[0];

                if (
                    inner.type === "TSVoidKeyword" ||
                    inner.type === "TSNeverKeyword" ||
                    inner.type === "TSUndefinedKeyword"
                ) {
                    return true;
                }
            }

            return false;
        }

        function checkFunction(node, commentNode) {
            if (!commentNode) {
                return;
            }

            const commentValue = commentNode.value;
            const tags = getTagNames(commentValue);
            const params = node.params ?? [];

            for (const param of params) {
                if (param.type === "Identifier") {
                    const name = param.name;

                    // `this` is a TypeScript typing construct, not a real parameter.
                    if (name === "this") {
                        continue;
                    }

                    const hasTag = new RegExp(`@param\\s+(\\{[^}]+\\}\\s+)?${name}\\b`).test(commentValue);

                    if (!hasTag) {
                        context.report({
                            node: commentNode,
                            message: `Missing @param tag for parameter "${name}".`
                        });
                    }
                }
            }

            const returnType = node.returnType;

            if (returnType && !isVoidReturnType(returnType) && !tags.has("returns") && !tags.has("return")) {
                context.report({
                    node: commentNode,
                    message: "Missing @returns tag for non-void return type."
                });
            }
        }

        function handleFunction(node) {
            const parent = node.parent;

            // Getters and setters don't need @returns/@param - the type annotation is enough
            if (parent?.type === "MethodDefinition" && (parent.kind === "get" || parent.kind === "set")) {
                return;
            }

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
