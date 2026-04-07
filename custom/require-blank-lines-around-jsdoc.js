/**
 * Requires a blank line before and after any JSDoc block comment (`/** ... *\/`).
 *
 * Exceptions:
 *  - First statement in a block/program (no blank line required before)
 *  - Last statement in a block/program (no blank line required after)
 *  - When the comment is the very first thing in the file
 */

/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Require a blank line before and after JSDoc block comments",
            category: "Style",
            recommended: true
        },
        fixable: "whitespace",
        schema: []
    },

    create(context) {
        const sourceCode = context.sourceCode;

        /**
         * Returns true if the token/comment is the first meaningful thing in its parent block.
         *
         * @param {import("eslint").Rule.Node} comment
         * @returns {boolean}
         */
        function isFirstInBlock(comment) {
            const tokenBefore = sourceCode.getTokenBefore(comment, { includeComments: true });

            if (!tokenBefore) {
                return true;
            }

            // Opening brace of a block counts as "first"
            return tokenBefore.value === "{" || tokenBefore.value === "[";
        }

        /**
         * Returns true if the token/comment is the last meaningful thing in its parent block.
         *
         * @param {import("eslint").Rule.Node} comment
         * @returns {boolean}
         */
        function isLastInBlock(comment) {
            const tokenAfter = sourceCode.getTokenAfter(comment, { includeComments: true });

            if (!tokenAfter) {
                return true;
            }

            return tokenAfter.value === "}" || tokenAfter.value === "]";
        }

        /**
         * Returns the number of blank lines between two positions in the source.
         *
         * @param {number} endPos
         * @param {number} startPos
         * @returns {number}
         */
        function blankLinesBetween(endPos, startPos) {
            const between = sourceCode.text.slice(endPos, startPos);

            return (between.match(/\n/g) || []).length - 1;
        }

        return {
            Program() {
                const comments = sourceCode.getAllComments();

                for (const comment of comments) {
                    if (comment.type !== "Block" || !comment.value.startsWith("*")) {
                        continue;
                    }

                    // ── Check blank line BEFORE ──────────────────────────────────
                    if (!isFirstInBlock(comment)) {
                        const tokenBefore = sourceCode.getTokenBefore(comment, { includeComments: true });

                        if (tokenBefore) {
                            const blanks = blankLinesBetween(tokenBefore.range[1], comment.range[0]);

                            if (blanks < 1) {
                                context.report({
                                    node: comment,
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
                    }

                    // ── Check blank line AFTER ───────────────────────────────────
                    if (!isLastInBlock(comment)) {
                        const tokenAfter = sourceCode.getTokenAfter(comment, { includeComments: true });

                        if (tokenAfter) {
                            const blanks = blankLinesBetween(comment.range[1], tokenAfter.range[0]);

                            if (blanks < 1) {
                                context.report({
                                    node: comment,
                                    message: "Expected a blank line after this JSDoc comment.",
                                    fix(fixer) {
                                        return fixer.insertTextAfterRange(
                                            [comment.range[0], comment.range[1]],
                                            "\n"
                                        );
                                    }
                                });
                            }
                        }
                    }
                }
            }
        };
    }
};
