/**
 * Requires doc comments for exported (`pub fn`) functions and validates tags.
 */

/**
 * @type {import("eslint").Rule.RuleModule}
 */
module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Require documentation for pub fn declarations in Zig",
            category: "Best Practices",
            recommended: true
        },

        schema: []
    },

    create(context) {
        const sourceCode = context.sourceCode;
        const PUB_FN_RE = /^\s*pub\s+fn\s+(\w+)\s*\(([^)]*)\)/;

        /**
         * Returns true when a parameter name is a conventional unused placeholder.
         *
         * @param name Zig parameter identifier.
         * @returns True when @param documentation is not required.
         */
        function isIgnoredParamName(name) {
            return /^_{1,3}$/.test(name);
        }

        /**
         * Extracts parameter names from a Zig function parameter list.
         *
         * @param paramsText Raw text inside the parentheses.
         * @returns Parameter names in declaration order.
         */
        function parseParamNames(paramsText) {
            const names = [];
            const trimmed = paramsText.trim();

            if (!trimmed) {
                return names;
            }

            for (const part of trimmed.split(",")) {
                const segment = part.trim();

                if (!segment || segment === "...") {
                    continue;
                }

                const nameMatch = segment.match(/^([a-zA-Z_]\w*)\s*:/);

                if (nameMatch) {
                    names.push(nameMatch[1]);
                }
            }

            return names;
        }

        /**
         * Returns the doc block immediately above a line index.
         *
         * @param lines File lines.
         * @param fnLineIndex Zero-based line index of the pub fn.
         * @returns Combined doc text or null when no doc block exists.
         */
        function getDocBlockFromLines(lines, fnLineIndex) {
            const block = [];

            for (let i = fnLineIndex - 1; i >= 0; i--) {
                const trimmed = lines[i].trim();

                if (trimmed === "") {
                    break;
                }

                if (!trimmed.startsWith("///")) {
                    break;
                }

                block.unshift(trimmed);
            }

            if (!block.length) {
                return null;
            }

            return block.join("\n");
        }

        /**
         * Returns true when the function body contains a value return.
         *
         * @param lines File lines.
         * @param fnLineIndex Zero-based line index of the pub fn.
         * @returns True when a value-returning return statement is present.
         */
        function functionHasReturnValue(lines, fnLineIndex) {
            let depth = 0;
            let started = false;

            for (let i = fnLineIndex; i < lines.length; i++) {
                const line = lines[i];

                for (const ch of line) {
                    if (ch === "{") {
                        depth++;
                        started = true;
                    } else
                        if (ch === "}") {
                            depth--;
                        }
                }

                if (started && /\breturn\s+[^;]+;/.test(line) && !/\breturn\s*;/.test(line.trim())) {
                    return true;
                }

                if (started && depth === 0 && i > fnLineIndex) {
                    break;
                }
            }

            return false;
        }

        /**
         * Returns true when the function body uses error returns.
         *
         * @param lines File lines.
         * @param fnLineIndex Zero-based line index of the pub fn.
         * @returns True when error returns are present.
         */
        function functionHasErrorReturn(lines, fnLineIndex) {
            let depth = 0;
            let started = false;

            for (let i = fnLineIndex; i < lines.length; i++) {
                const line = lines[i];

                for (const ch of line) {
                    if (ch === "{") {
                        depth++;
                        started = true;
                    } else
                        if (ch === "}") {
                            depth--;
                        }
                }

                if (started && /\breturn\s+error\./.test(line)) {
                    return true;
                }

                if (started && depth === 0 && i > fnLineIndex) {
                    break;
                }
            }

            return false;
        }

        return {
            Program() {
                const lines = sourceCode.getText().split("\n");

                lines.forEach((line, idx) => {
                    const match = PUB_FN_RE.exec(line);

                    if (!match) {
                        return;
                    }

                    const fnName = match[1];
                    const params = parseParamNames(match[2]);
                    const combined = getDocBlockFromLines(lines, idx);

                    if (!combined) {
                        context.report({
                            loc: { line: idx + 1, column: 0 },
                            message: `Missing doc comment for pub fn "${fnName}".`
                        });

                        return;
                    }

                    const hasTags = /@param\b|@returns?\b|@throws?\b/.test(combined);

                    if (!hasTags) {
                        return;
                    }

                    for (const name of params) {
                        if (isIgnoredParamName(name)) {
                            continue;
                        }

                        if (!new RegExp(`@param\\s+${name}\\b`).test(combined)) {
                            context.report({
                                loc: { line: idx + 1, column: 0 },
                                message: `Missing @param tag for parameter "${name}".`
                            });
                        }
                    }

                    if (!/@returns?\b/.test(combined) && functionHasReturnValue(lines, idx)) {
                        context.report({
                            loc: { line: idx + 1, column: 0 },
                            message: "Missing @returns tag for documented function."
                        });
                    }

                    if (!/@throws?\b/.test(combined) && functionHasErrorReturn(lines, idx)) {
                        context.report({
                            loc: { line: idx + 1, column: 0 },
                            message: "Missing @throws tag for documented function."
                        });
                    }
                });
            }
        };
    }
};
