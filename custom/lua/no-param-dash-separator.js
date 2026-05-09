/**
 * Disallows a dash separator between the type and description in Lua doc tags.
 *
 * @example
 * -- Bad
 * --- @param name string - Description here
 * --- @returns string - Description here
 *
 * -- Good
 * --- @param name string Description here
 * --- @returns string Description here
 */

/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "layout",
        fixable: "code",
        docs: {
            description: "Disallow dash separator between type and description in Lua doc tags",
            category: "Style",
            recommended: true
        },
        schema: []
    },

    create(context) {
        const sourceCode = context.sourceCode;

        // Group 1 = prefix before separator, group 2 = the ` - ` separator.
        const PARAM_DASH_RE = /(@param\s+\S+\s+\S+)(\s+-\s+)/;
        const RETURNS_DASH_RE = /(@returns?\s+\S+)(\s+-\s+)/;

        return {
            Program() {
                const text = sourceCode.getText();
                const lines = text.split("\n");
                let offset = 0;

                lines.forEach((lineText, idx) => {
                    const lineOffset = offset;
                    offset += lineText.length + 1;

                    const trimmed = lineText.trimStart();

                    if (!trimmed.startsWith("--")) return;

                    for (const re of [PARAM_DASH_RE, RETURNS_DASH_RE]) {
                        const match = re.exec(lineText);

                        if (!match) continue;

                        const separatorCol = match.index + match[1].length;
                        const separatorLen = match[2].length;
                        const sepStart = lineOffset + separatorCol;

                        context.report({
                            loc: { line: idx + 1, column: separatorCol },
                            message: "Use a space instead of ` - ` to separate type from description in doc tags.",
                            fix(fixer) {
                                return fixer.replaceTextRange([sepStart, sepStart + separatorLen], " ");
                            }
                        });

                        break;
                    }
                });
            }
        };
    }
};
