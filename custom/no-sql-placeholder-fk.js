/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow hardcoded *Id = 1 placeholders in SQL fixtures",
            category: "Best Practices",
            recommended: true
        },
        schema: []
    },

    create(context) {
        const placeholderRe = /\b(?:matrixId|categoryId|userId|resellerId|tenantId|campaignId)\s*=\s*1\b/i;

        return {
            Program(node) {
                const text = context.sourceCode.getText();

                if (!placeholderRe.test(text)) {
                    return;
                }

                context.report({
                    node,
                    message:
                        "SQL fixture with hardcoded *Id = 1 - use skill db-test-fixture "
                        + "(never invent PK/FK placeholders)."
                });
            }
        };
    }
};
