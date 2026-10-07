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

        /** HTTP verb names exported as route handlers - no JSDoc needed. */
        const HTTP_VERBS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]);

        function isUpperCase(name) {
            return /^[A-Z][A-Z0-9_]*$/.test(name);
        }

        function isExportedHttpVerb(declaratorName, varDeclNode) {
            return HTTP_VERBS.has(declaratorName) &&
                varDeclNode.parent?.type === "ExportNamedDeclaration";
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

                    if (isExportedHttpVerb(declarator.id.name, node)) {
                        continue;
                    }

                    const jsdoc = getJsDocComment(node);

                    if (!jsdoc) {
                        context.report({
                            node: declarator.id,
                            message: `UPPER_CASE const "${declarator.id.name}" must have a JSDoc comment.`
                        });

                        continue;
                    }

                    if (!isMultiline(jsdoc)) {
                        context.report({
                            node: jsdoc,
                            message: `UPPER_CASE const "${declarator.id.name}" must have a multiline JSDoc comment (/** ... */ on a single line is not allowed).`
                        });
                    }
                }
            }
        };
    }
};
