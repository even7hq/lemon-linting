/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Require a multiline JSDoc comment on UPPER_CASE const declarations",
            category: "Best Practices",
            recommended: true
        },
        schema: []
    },

    create(context) {
        const sourceCode = context.sourceCode;

        function isUpperCase(name) {
            return /^[A-Z][A-Z0-9_]*$/.test(name);
        }

        function getJsDocComment(node) {
            const nodesToCheck = [node];
            const parent = node.parent;

            if (
                parent &&
                (parent.type === "ExportNamedDeclaration" || parent.type === "ExportDefaultDeclaration")
            ) {
                nodesToCheck.push(parent);
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

        function isMultiline(comment) {
            return comment.loc.start.line !== comment.loc.end.line;
        }

        return {
            VariableDeclaration(node) {
                if (node.kind !== "const") {
                    return;
                }

                for (const declarator of node.declarations) {
                    if (declarator.id.type !== "Identifier" || !isUpperCase(declarator.id.name)) {
                        continue;
                    }

                    const comment = getJsDocComment(node);

                    if (!comment) {
                        context.report({
                            node: declarator.id,
                            message: `UPPER_CASE const "${declarator.id.name}" must have a JSDoc comment.`
                        });

                        continue;
                    }

                    if (!isMultiline(comment)) {
                        context.report({
                            node: comment,
                            message: `UPPER_CASE const "${declarator.id.name}" must have a multiline JSDoc comment (/** ... */ on a single line is not allowed).`
                        });
                    }
                }
            }
        };
    }
};
