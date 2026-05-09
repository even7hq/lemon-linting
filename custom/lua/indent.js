/**
 * Enforces consistent indentation in Lua files using a token-based stack.
 *
 * Tracks every block opener (function, do, then, repeat) regardless of where
 * it appears on the line, and expects subsequent lines to be indented by
 * parentIndent + indentSize. Handles anonymous functions passed as arguments.
 */

/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "layout",
        fixable: "whitespace",
        docs: {
            description: "Enforce consistent indentation in Lua",
            category: "Stylistic Issues",
            recommended: true
        },
        schema: [{ type: "integer", minimum: 0 }]
    },

    create(context) {
        const indentSize = context.options[0] || 4;
        const sourceCode = context.sourceCode;

        return {
            Program() {
                const text = sourceCode.getText();
                const lines = text.split("\n");

                // Stack of indent levels. Each entry = spaces expected for lines
                // *inside* the block opened on that level.
                const stack = [0];

                // Precompute line start offsets.
                const lineOffsets = [];
                let off = 0;

                for (const l of lines) {
                    lineOffsets.push(off);
                    off += l.length + 1;
                }

                let insideLongString = false;

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    const trimmed = line.trimStart();

                    // Skip long strings.
                    if (insideLongString) {
                        if (/\]\]/.test(line)) insideLongString = false;
                        continue;
                    }

                    if (/\[\[/.test(line) && !/\]\]/.test(line)) {
                        insideLongString = true;
                        continue;
                    }

                    // Skip pure comment lines and blank lines.
                    if (trimmed === "" || trimmed.startsWith("--")) continue;

                    // Strip inline comments and string literals to avoid false
                    // keyword matches inside them.
                    const stripped = trimmed
                        .replace(/--.*$/, "")
                        .replace(/"(?:[^"\\]|\\.)*"/g, '""')
                        .replace(/'(?:[^'\\]|\\.)*'/g, "''");

                    const actualIndent = line.length - trimmed.length;

                    // Count closers (end, until) — each pops one level.
                    // Count re-openers (else, elseif) — pop then push.
                    // Count openers (function, do, then, repeat) — each pushes one level.
                    const closers = (stripped.match(/\bend\b|\buntil\b/g) || []).length;
                    const reopeners = (stripped.match(/\belse\b|\belseif\b/g) || []).length;
                    const openers = (stripped.match(/\bfunction\b|\bdo\b|\bthen\b|\brepeat\b/g) || []).length;

                    // Net = openers that aren't immediately closed on the same line.
                    // e.g. `if x then return y end` → then+1, end-1 → net 0.
                    const net = openers - closers;

                    // Pop for closers first (they belong to the *current* expected level).
                    const closerPops = Math.min(closers + reopeners, stack.length - 1);

                    for (let c = 0; c < closerPops; c++) {
                        stack.pop();
                    }

                    const expectedIndent = stack[stack.length - 1];

                    if (actualIndent !== expectedIndent) {
                        const lineStart = lineOffsets[i];

                        context.report({
                            loc: { line: i + 1, column: 0 },
                            message: `Expected indentation of ${expectedIndent} spaces but found ${actualIndent}.`,
                            fix(fixer) {
                                return fixer.replaceTextRange(
                                    [lineStart, lineStart + actualIndent],
                                    " ".repeat(expectedIndent)
                                );
                            }
                        });
                    }

                    // Push for net openers (after checking this line's own indent).
                    const pushes = Math.max(net + reopeners, 0);

                    for (let p = 0; p < pushes; p++) {
                        stack.push(expectedIndent + indentSize);
                    }
                }
            }
        };
    }
};
