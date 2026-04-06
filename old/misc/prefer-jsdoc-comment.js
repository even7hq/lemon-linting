/**
 * Autofixable rule: converts standalone `// comment` lines that precede a
 * declaration (const, let, var, function, class, type, interface, enum) into
 * a multiline JSDoc block comment (`/** ... *\/`).
 *
 * Only targets comments that are on their own line immediately before a
 * declaration — inline comments (same line as code) are left untouched.
 */

/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "suggestion",

        docs: {
            description: "Convert line comments before declarations into JSDoc block comments",
            category: "Style",
            recommended: true
        },

        fixable: "code",
        schema: []
    },

    create(context) {
        const sourceCode = context.getSourceCode();

        const DECLARATION_TYPES = new Set([
            "VariableDeclaration",
            "FunctionDeclaration",
            "ClassDeclaration",
            "ExportNamedDeclaration",
            "ExportDefaultDeclaration",
            "TSTypeAliasDeclaration",
            "TSInterfaceDeclaration",
            "TSEnumDeclaration"
        ]);

        /**
         * Collects a consecutive run of `//` comments that appear immediately
         * before `node`, going backwards from the first token of `node`.
         *
         * @param {import("eslint").Rule.Node} node
         * @returns {import("eslint").Rule.Node[]} Line comment nodes, top-to-bottom order.
         */
        function getLeadingLineComments(node) {
            const tokenOrComment = sourceCode.getTokenBefore(node, { includeComments: true });

            if (!tokenOrComment || tokenOrComment.type !== "Line") {
                return [];
            }

            // Walk backwards collecting consecutive Line comments on their own lines
            const run = [];
            let current = tokenOrComment;

            while (current && current.type === "Line") {
                // Must be a standalone comment line (nothing else on that line before it)
                const lineStart = sourceCode.text.lastIndexOf("\n", current.range[0] - 1) + 1;
                const textBefore = sourceCode.text.slice(lineStart, current.range[0]).trim();

                if (textBefore !== "") {
                    break;
                }

                run.unshift(current);

                current = sourceCode.getTokenBefore(current, { includeComments: true });
            }

            return run;
        }

        /**
         * Returns true when the comment is separated from the declaration by a blank line.
         *
         * @param {import("eslint").Rule.Node} lastComment
         * @param {import("eslint").Rule.Node} declNode
         * @returns {boolean}
         */
        function hasBlankLineBetween(lastComment, declNode) {
            const commentEnd = lastComment.range[1];
            const declStart = declNode.range[0];
            const between = sourceCode.text.slice(commentEnd, declStart);

            // Two or more newlines means there's at least one blank line
            return (between.match(/\n/g) || []).length >= 2;
        }

        /**
         * @param {import("eslint").Rule.Node} node
         */
        function check(node) {
            if (!DECLARATION_TYPES.has(node.type)) {
                return;
            }

            // Only apply at module scope — not inside functions, classes or blocks
            const scope = context.getScope();
            const ancestors = context.getAncestors();
            const isModuleLevel = ancestors.every((a) =>
                a.type === "Program" ||
                a.type === "ExportNamedDeclaration" ||
                a.type === "ExportDefaultDeclaration"
            );

            if (!isModuleLevel) {
                return;
            }

            const comments = getLeadingLineComments(node);

            if (comments.length === 0) {
                return;
            }

            // Blank line between comment and declaration — it's a section separator, not a doc
            if (hasBlankLineBetween(comments[comments.length - 1], node)) {
                return;
            }

            // Already has a JSDoc block — skip
            const before = sourceCode.getTokenBefore(comments[0], { includeComments: true });

            if (before && before.type === "Block" && before.value.startsWith("*")) {
                return;
            }

            context.report({
                node: comments[0],
                message: "Prefer a JSDoc block comment (`/** ... */`) over line comments before declarations.",
                fix(fixer) {
                    const indent = " ".repeat(comments[0].loc.start.column);
                    const lines = comments.map((c) => c.value.trim());

                    const docblock =
                        lines.length === 1
                            ? `/**\n${indent} * ${lines[0]}\n${indent} */`
                            : `/**\n${lines.map((l) => `${indent} * ${l}`).join("\n")}\n${indent} */`;

                    const start = comments[0].range[0];
                    const end = comments[comments.length - 1].range[1];

                    return fixer.replaceTextRange([start, end], docblock);
                }
            });
        }

        return {
            VariableDeclaration: check,
            FunctionDeclaration: check,
            ClassDeclaration: check,
            ExportNamedDeclaration: check,
            ExportDefaultDeclaration: check,
            TSTypeAliasDeclaration: check,
            TSInterfaceDeclaration: check,
            TSEnumDeclaration: check
        };
    }
};
