/**
 * Enforces that Lua block bodies (if/then, while/do, for/do, function) are
 * not written on the same line as their opening keyword.
 *
 * Works on raw source text since the Lua parser does not populate node
 * locations or ranges reliably enough for AST-based fixes.
 *
 * Patterns detected and fixed:
 *   if cond then return x end   →  if cond then\n<indent>    return x\n<indent>end
 *   while cond do f() end       →  while cond do\n<indent>    f()\n<indent>end
 *   for k,v in t do f() end     →  same pattern
 *
 * `elseif` blocks that span a single line are left untouched (allowed).
 */

/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "layout",
        fixable: "whitespace",
        docs: {
            description: "Enforce newlines for Lua block bodies",
            category: "Stylistic Issues",
            recommended: true
        },
        schema: []
    },

    create(context) {
        const sourceCode = context.sourceCode;

        /**
         * Matches a single-line block:
         *   group 1 – leading indent
         *   group 2 – keyword + condition + opening word (then|do)
         *   group 3 – body (everything between opener and `end`)
         *
         * Deliberately does NOT match `elseif … then … end` on its own
         * because elseif is always part of a larger if-block.
         */
        const INLINE_BLOCK_RE =
            /^(\s*)((?:(?:if|while|for)\b(?:(?!\belseif\b).)*?\bthen\b|(?:if|while|for)\b.*?\bdo\b))\s+(.+?)\s+end\s*$/;

        return {
            Program() {
                const text = sourceCode.getText();
                const lines = text.split("\n");

                let offset = 0;

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    const lineStart = offset;
                    offset += line.length + 1;

                    const m = INLINE_BLOCK_RE.exec(line);

                    if (!m) continue;

                    const indent = m[1];
                    const opener = m[2];
                    const body = m[3];

                    // Compute positions within the full source text.
                    // We replace the entire line content (excluding the trailing \n).
                    const lineEnd = lineStart + line.length;

                    const fixed = `${indent}${opener}\n${indent}    ${body}\n${indent}end`;

                    context.report({
                        loc: { line: i + 1, column: 0 },
                        message: "Block body must not be on the same line as its opening keyword.",
                        fix(fixer) {
                            return fixer.replaceTextRange([lineStart, lineEnd], fixed);
                        }
                    });
                }
            }
        };
    }
};
