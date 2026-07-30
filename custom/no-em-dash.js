/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow em dash (U+2014) - use ASCII hyphen-minus",
            category: "Style",
            recommended: true
        },
        schema: []
    },

    create(context) {
        const EM_DASH = "\u2014";

        return {
            Program(node) {
                const text = context.sourceCode.getText(node);

                if (!text.includes(EM_DASH)) {
                    return;
                }

                const index = text.indexOf(EM_DASH);
                const before = text.slice(0, index);
                const line = before.split("\n").length;
                const column = before.length - before.lastIndexOf("\n") - 1;

                context.report({
                    loc: { line, column },
                    message: "Em dash (U+2014) is forbidden - use ASCII hyphen '-' instead."
                });
            }
        };
    }
};
