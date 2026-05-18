/**
 * Requires a blank line before JSDoc comments and after the node they document.
 *
 * A JSDoc comment (`/** ... *\/`) must have:
 *   1. A blank line BEFORE the comment (unless it's the first thing in a block)
 *   2. A blank line AFTER the node the comment documents (unless it's the last thing in a block)
 *
 * The comment and the node it documents are treated as a unit - no blank line
 * is required between the `*\/` and the decorated/declared node itself.
 */

/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Require a blank line before JSDoc comments and after the node they document",
            category: "Style",
            recommended: true
        },
        fixable: "whitespace",
        schema: []
    },

    create(context) {
        const sourceCode = context.sourceCode;

        /**
         * Returns the leading JSDoc comment for a node, or null if none.
         *
         * @param {import("eslint").Rule.Node} node
         * @returns {import("estree").Comment | null}
         */
        function getLeadingJsdoc(node) {
            const comments = sourceCode.getCommentsBefore(node);

            for (const comment of comments) {
                if (comment.type === "Block" && comment.value.startsWith("*")) {
                    return comment;
                }
            }

            return null;
        }

        /**
         * Returns the number of blank lines between two source positions.
         *
         * @param {number} endPos
         * @param {number} startPos
         * @returns {number}
         */
        function blankLinesBetween(endPos, startPos) {
            const between = sourceCode.text.slice(endPos, startPos);

            return (between.match(/\n/g) || []).length - 1;
        }

        /**
         * Checks and enforces blank lines around a JSDoc-documented node.
         *
         * @param {import("eslint").Rule.Node} node
         */
        function checkNode(node) {
            const jsdoc = getLeadingJsdoc(node);

            if (!jsdoc) {
                return;
            }

            // ── 1. Blank line BEFORE the JSDoc comment ───────────────────────
            const tokenBefore = sourceCode.getTokenBefore(jsdoc, { includeComments: true });

            if (tokenBefore && tokenBefore.value !== "{" && tokenBefore.value !== "[") {
                const blanksBefore = blankLinesBetween(tokenBefore.range[1], jsdoc.range[0]);

                if (blanksBefore < 1) {
                    context.report({
                        node: jsdoc,
                        message: "Expected a blank line before this JSDoc comment.",
                        fix(fixer) {
                            return fixer.insertTextAfterRange(
                                [tokenBefore.range[0], tokenBefore.range[1]],
                                "\n"
                            );
                        }
                    });
                }
            }

            // ── 2. Blank line AFTER the documented node ───────────────────────
            const tokenAfter = sourceCode.getTokenAfter(node, { includeComments: true });

            // Skip when the node is the last thing before a closing delimiter or end-of-block.
            // "}" and "]" cover closing braces/brackets; tokens starting with "</" cover
            // Vue SFC closing tags like </script> and </template>.
            const isClosingDelimiter = !tokenAfter ||
                tokenAfter.value === "}" ||
                tokenAfter.value === "]" ||
                tokenAfter.value.startsWith("</");

            // Skip when the next sibling is an overload signature of the same function/method.
            // Overloads share the same name and sit consecutively - no blank line needed between them.
            const nextSibling = (() => {
                const parent = node.parent;

                if (!parent || !parent.body) return null;

                const siblings = Array.isArray(parent.body) ? parent.body : parent.body.body;

                if (!siblings) return null;

                const idx = siblings.indexOf(node);

                return idx >= 0 ? siblings[idx + 1] : null;
            })();

            const isOverloadSibling = nextSibling && (
                nextSibling.type === "TSDeclareMethod" ||
                nextSibling.type === "TSMethodSignature" ||
                (
                    (nextSibling.type === "MethodDefinition" || nextSibling.type === "FunctionDeclaration") &&
                    nextSibling.key?.name === node.key?.name
                )
            );

            if (!isClosingDelimiter && !isOverloadSibling) {
                const blanksAfter = blankLinesBetween(node.range[1], tokenAfter.range[0]);

                if (blanksAfter < 1) {
                    context.report({
                        node,
                        message: "Expected a blank line after this JSDoc-documented node.",
                        fix(fixer) {
                            return fixer.insertTextAfterRange(
                                [node.range[0], node.range[1]],
                                "\n"
                            );
                        }
                    });
                }
            }
        }

        return {
            // Type aliases, interfaces, class declarations, function declarations
            TSTypeAliasDeclaration: checkNode,
            TSInterfaceDeclaration: checkNode,
            ClassDeclaration: checkNode,
            FunctionDeclaration: checkNode,

            // Variable declarations (const/let/var with JSDoc)
            VariableDeclaration: checkNode,

            // Class properties and methods (including decorated ones)
            PropertyDefinition: checkNode,
            MethodDefinition: checkNode,

            // TypeScript-specific class members
            TSPropertySignature: checkNode,
            TSMethodSignature: checkNode,

            // Decorated declarations (decorators sit before the node but the node holds the JSDoc)
            ExpressionStatement: checkNode
        };
    }
};
