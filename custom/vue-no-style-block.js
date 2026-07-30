/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow <style> blocks in Vue SFCs - use Tailwind utilities only",
            category: "Best Practices",
            recommended: true
        },
        schema: []
    },

    create(context) {
        const styleRe = /<style\b/i;

        return {
            Program(node) {
                const text = context.sourceCode.getText();

                if (!styleRe.test(text)) {
                    return;
                }

                context.report({
                    node,
                    message:
                        "FORBIDDEN <style> in Vue SFC - use Tailwind utilities / existing design tokens only "
                        + "(rule: vue-tailwind-only)."
                });
            }
        };
    }
};
