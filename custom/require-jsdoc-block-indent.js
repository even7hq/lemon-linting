const {
    hasJsdocBlockIndentViolation,
    normalizeJsdocBlockIndent
} = require("../scripts/normalizer/normalize-jsdoc-block-indent");

/**
 * @type {import("eslint").Rule.RuleModule}
 */
module.exports = {
    meta: {
        type: "layout",
        fixable: "code",
        docs: {
            description: "Align interior lines of multiline JSDoc blocks with the opening /** indent",
            category: "Style",
            recommended: true
        },

        schema: []
    },

    create(context) {
        const sourceCode = context.sourceCode;

        return {
            Program() {
                for (const comment of sourceCode.getAllComments()) {
                    if (comment.type !== "Block") {
                        continue;
                    }

                    const commentText = sourceCode.getText(comment);

                    if (!commentText.startsWith("/**")) {
                        continue;
                    }

                    if (!hasJsdocBlockIndentViolation(commentText)) {
                        continue;
                    }

                    context.report({
                        loc: comment.loc,
                        message: "JSDoc lines must use the same ` * ` margin as the rest of the block.",
                        fix(fixer) {
                            const normalized = normalizeJsdocBlockIndent(commentText);

                            if (normalized === commentText) {
                                return null;
                            }

                            return fixer.replaceText(comment, normalized);
                        }
                    });
                }
            }
        };
    }
};
