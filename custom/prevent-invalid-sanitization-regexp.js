/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Prevent invalid numeric sanitization RegExp",
            category: "Best Practices",
            recommended: true
        },
        schema: []
    },

    create(context) {
        return {
            Literal(node) {
                if (typeof node.value === "string" && node.value.includes("/^[0-9]/")) {
                    context.report({
                        node,
                        message: "If you are REALLY sure that you want to replace only the FIRST number from the string, disable this rule for this line.",
                        fix(fixer) {
                            return fixer.replaceText(node.init, "^[0-9]", "[^0-9]");
                        }
                    });
                }
            }
        };
    }
};
