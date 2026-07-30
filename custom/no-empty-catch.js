/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow empty catch blocks - log with %o/%O or handle the error",
            category: "Best Practices",
            recommended: true
        },
        schema: []
    },

    create(context) {
        return {
            CatchClause(node) {
                const body = node.body;

                if (!body || body.type !== "BlockStatement") {
                    return;
                }

                const meaningful = body.body.filter((statement) => {
                    if (statement.type !== "EmptyStatement") {
                        return true;
                    }

                    return false;
                });

                if (meaningful.length === 0) {
                    context.report({
                        node,
                        message: "Empty catch block - log the error with %o/%O or handle it explicitly."
                    });
                }
            }
        };
    }
};
