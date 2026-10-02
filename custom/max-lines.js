/**
 * Default maximum effective lines per source file (workspace rule: max-file-size).
 */
const DEFAULT_MAX_LINES = 700;

/**
 * @type {import("eslint").Rule.RuleModule}
 */
module.exports = {
    meta: {
        type: "suggestion",

        docs: {
            description:
                "Enforce a maximum number of effective lines per file (blank lines and comment-only lines are not counted)",
            category: "Style",
            recommended: true
        },

        schema: [
            {
                type: "object",
                properties: {
                    max: {
                        type: "integer",
                        minimum: 1
                    }
                },

                additionalProperties: false
            }
        ],

        messages: {
            exceed:
                "File has too many lines ({{actual}}). Maximum allowed is {{max}} (blank lines and comments are not counted)."
        }
    },

    create(context) {
        const max = context.options[0]?.max ?? DEFAULT_MAX_LINES;
        const sourceCode = context.sourceCode;
        const filename = context.filename ?? context.physicalFilename ?? "";

        /**
         * Returns true when a trimmed line is comment-only (JS, TS, JSDoc, or HTML in Vue).
         *
         * @param {string} trimmed Line text after trim.
         * @returns {boolean} True when the line should not count toward the limit.
         */
        function isCommentOnlyLine(trimmed) {
            if (trimmed.length === 0) {
                return false;
            }

            if (trimmed.startsWith("//")) {
                return true;
            }

            if (trimmed.startsWith("/*") || trimmed.startsWith("*") || trimmed.endsWith("*/")) {
                return true;
            }

            if (filename.endsWith(".vue") && trimmed.startsWith("<!--") && trimmed.endsWith("-->")) {
                return true;
            }

            return false;
        }

        /**
         * Returns line records for counting, without a trailing parser-only empty line.
         *
         * @returns {{ lineNumber: number, text: string }[]} Lines to evaluate.
         */
        function getLogicalLines() {
            const raw = sourceCode.lines.map((text, index) => {
                return {
                    lineNumber: index + 1,
                    text
                };
            });

            if (raw.length > 1 && raw.at(-1).text === "") {
                raw.pop();
            }

            return raw;
        }

        /**
         * Counts lines that are not blank and not comment-only.
         *
         * @returns {number} Effective line count.
         */
        function countEffectiveLines() {
            const lines = getLogicalLines();
            let effective = 0;

            for (const line of lines) {
                const trimmed = line.text.trim();

                if (trimmed === "") {
                    continue;
                }

                if (isCommentOnlyLine(trimmed)) {
                    continue;
                }

                effective += 1;
            }

            return effective;
        }

        return {
            "Program:exit"(node) {
                const actual = countEffectiveLines();

                if (actual <= max) {
                    return;
                }

                context.report({
                    node,
                    loc: {
                        start: { line: 1, column: 0 },
                        end: { line: node.loc.end.line, column: 0 }
                    },
                    messageId: "exceed",
                    data: {
                        max: String(max),
                        actual: String(actual)
                    }
                });
            }
        };
    }
};
