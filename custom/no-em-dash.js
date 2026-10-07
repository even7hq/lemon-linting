/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "problem",
        fixable: "code",
        docs: {
            description: "Disallow em dash (U+2014) - use ASCII hyphen-minus",
            category: "Style",
            recommended: true
        },
        schema: []
    },

    create(context) {
        const EM_DASH = "\u2014";
        const sourceCode = context.sourceCode;

        return {
            Program(node) {
                const text = sourceCode.getText(node);

                if (!text.includes(EM_DASH)) {
                    return;
                }

                let searchFrom = 0;

                while (searchFrom < text.length) {
                    const index = text.indexOf(EM_DASH, searchFrom);

                    if (index === -1) {
                        break;
                    }

                    const before = text.slice(0, index);
                    const line = before.split("\n").length;
                    const column = before.length - before.lastIndexOf("\n") - 1;

                    context.report({
                        loc: { line, column },
                        message: "Em dash (U+2014) is forbidden - use ASCII hyphen '-' instead.",
                        fix(fixer) {
                            return fixer.replaceTextRange([index, index + 1], "-");
                        }
                    });

                    searchFrom = index + 1;
                }
            }
        };
    }
};
