/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "suggestion",
        fixable: "code",
        docs: {
            description: "Require a multiline JSDoc comment on UPPER_CASE const declarations",
            category: "Best Practices",
            recommended: true
        },
        schema: []
    },

    create(context) {
        const sourceCode = context.sourceCode;

        /** HTTP verb names exported as route handlers — no JSDoc needed. */
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

        /**
         * Collects all consecutive `//` line comments immediately above `node`,
         * returning them in top-to-bottom order. Stops at the first non-line-comment.
         */
        function getLineCommentsBefore(node) {
            const target = node.parent?.type === "ExportNamedDeclaration" ? node.parent : node;
            const comments = sourceCode.getCommentsBefore(target);
            const lineComments = [];

            for (let i = comments.length - 1; i >= 0; i--) {
                const c = comments[i];

                if (c.type !== "Line") {
                    break;
                }

                lineComments.unshift(c);
            }

            return lineComments;
        }

        function isMultiline(comment) {
            return comment.loc.start.line !== comment.loc.end.line;
        }

        /**
         * Builds a JSDoc block from an array of `//` line comments.
         *
         * The replacement range starts at the first `//` token — the leading
         * whitespace before it is already in the source and is NOT replaced,
         * so we must NOT repeat it in the generated text.
         */
        function buildJsdocFromLineComments(lineComments) {
            const indent = " ".repeat(lineComments[0].loc.start.column);
            const lines = lineComments.map((c) => `${indent} * ${c.value.trimStart()}`);

            // No leading indent on the opening `/**` — the existing source
            // whitespace before the first `//` is preserved by the fixer.
            return `/**\n${lines.join("\n")}\n${indent} */`;
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
                        // Check for `//` line comments that can be converted.
                        const lineComments = getLineCommentsBefore(node);

                        context.report({
                            node: declarator.id,
                            message: `UPPER_CASE const "${declarator.id.name}" must have a JSDoc comment.`,
                            fix: lineComments.length > 0
                                ? (fixer) => {
                                    const first = lineComments[0];
                                    const last = lineComments[lineComments.length - 1];
                                    const jsdocText = buildJsdocFromLineComments(lineComments);

                                    return fixer.replaceTextRange(
                                        [first.range[0], last.range[1]],
                                        jsdocText
                                    );
                                }
                                : null
                        });

                        continue;
                    }

                    if (!isMultiline(jsdoc)) {
                        context.report({
                            node: jsdoc,
                            message: `UPPER_CASE const "${declarator.id.name}" must have a multiline JSDoc comment (/** ... */ on a single line is not allowed).`,
                            fix(fixer) {
                                // Convert `/** text */` → `/**\n * text\n */`
                                const raw = jsdoc.value.slice(1).trim(); // strip leading `*`
                                const indent = " ".repeat(jsdoc.loc.start.column);

                                return fixer.replaceText(
                                    jsdoc,
                                    `/**\n${indent} * ${raw}\n${indent} */`
                                );
                            }
                        });
                    }
                }
            }
        };
    }
};
