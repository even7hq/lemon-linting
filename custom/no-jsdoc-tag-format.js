const {
    hasJsdocTagFormatViolation,
    normalizeJsdocCommentValue
} = require("../scripts/normalizer/normalize-jsdoc-line");

/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "layout",
        fixable: "code",
        docs: {
            description: "Normalize JSDoc @param and @returns tags (no dash separator, no inline {Type})",
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
                    if (comment.type !== "Block" || !comment.value.startsWith("*")) {
                        continue;
                    }

                    if (!/@param\b|@returns?\b/.test(comment.value)) {
                        continue;
                    }

                    const lines = comment.value.split("\n");
                    const hasViolation = lines.some((line) => hasJsdocTagFormatViolation(line));

                    if (!hasViolation) {
                        continue;
                    }

                    context.report({
                        loc: comment.loc,
                        message: "Use `@param name Description` (no dash separator, no inline {Type}; {@link …} is allowed).",
                        fix(fixer) {
                            const normalized = normalizeJsdocCommentValue(comment.value);

                            if (normalized === comment.value) {
                                return null;
                            }

                            const commentText = sourceCode.getText().slice(comment.range[0], comment.range[1]);
                            const opening = commentText.startsWith("/**") ? "/**" : "/*";
                            const replacement = `${opening}${normalized}*/`;

                            return fixer.replaceTextRange(comment.range, replacement);
                        }
                    });
                }
            }
        };
    }
};
