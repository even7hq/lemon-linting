/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow FormDataConsumer in admin - prefer useFormContext",
            category: "Best Practices",
            recommended: true
        },
        schema: []
    },

    create(context) {
        return {
            Identifier(node) {
                if (node.name !== "FormDataConsumer") {
                    return;
                }

                context.report({
                    node,
                    message:
                        "FormDataConsumer detected - prefer useFormContext / reliable admin patterns "
                        + "(see Frontend and Admin docs)."
                });
            }
        };
    }
};
