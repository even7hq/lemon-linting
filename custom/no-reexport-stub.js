/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow re-export-only stub files (update call sites instead)",
            category: "Best Practices",
            recommended: true
        },
        schema: []
    },

    create(context) {
        const filename = context.filename ?? context.physicalFilename ?? context.getFilename?.() ?? "";
        const basename = filename.split(/[/\\]/).pop() || "";

        if (basename === "index.ts" || basename === "index.js" || basename === "index.mjs") {
            return {};
        }

        const sourceCode = context.sourceCode;
        const exportFromRe = /^\s*export\s+(?:\*|\{[^}]+\})\s+from\s+["'][^"']+["']\s*;?\s*$/;

        return {
            Program(node) {
                const text = sourceCode.getText(node);
                const withoutBlock = text.replace(/\/\*[\s\S]*?\*\//g, "");
                const withoutLine = withoutBlock.replace(/\/\/.*$/gm, "");
                const lines = withoutLine.split("\n").map((line) => line.trim()).filter(Boolean);

                if (!lines.length) {
                    return;
                }

                let exportFrom = 0;
                let other = 0;

                for (const line of lines) {
                    if (exportFromRe.test(line)) {
                        exportFrom += 1;
                        continue;
                    }

                    if (line.startsWith("import ")) {
                        continue;
                    }

                    other += 1;
                }

                if (exportFrom > 0 && other === 0) {
                    context.report({
                        node,
                        message:
                            "Re-export-only stub file - update call sites instead of leaving a shim "
                            + "(rule: no-reexport-on-refactor)."
                    });
                }
            }
        };
    }
};
