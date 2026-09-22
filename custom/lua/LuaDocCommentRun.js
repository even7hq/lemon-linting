/**
 * Matches Lua doc tags that use TSDoc-style annotations.
 */
const TSDOC_TAG_RE = /@param\b|@returns?\b|@throws?\b/;

/**
 * Collects consecutive `--` comment lines directly above a source line.
 *
 * @param {string[]} lines Full file lines (with original indentation).
 * @param {number} anchorLineIndex Zero-based line index of the documented statement.
 * @returns {{ lineIndex: number, lineText: string }[]}
 */
function getCommentRunAboveLine(lines, anchorLineIndex) {
    const run = [];

    for (let index = anchorLineIndex - 1; index >= 0; index -= 1) {
        const lineText = lines[index];
        const trimmed = lineText.trim();

        if (trimmed === "") {
            break;
        }

        if (!trimmed.startsWith("--")) {
            break;
        }

        run.unshift({ lineIndex: index, lineText });
    }

    return run;
}

/**
 * Returns whether a comment run carries TSDoc-style tags.
 *
 * @param run Comment run from getCommentRunAboveLine.
 * @returns True when the block carries TSDoc-style tags.
 */
function isTsdocCommentRun(run) {
    if (!run.length) {
        return false;
    }

    const combined = run.map((entry) => entry.lineText.trim()).join("\n");

    return TSDOC_TAG_RE.test(combined);
}

/**
 * @param {string} text Full source text.
 * @param {number} charOffset Character offset of the anchor token.
 * @returns {number} Zero-based line index for the offset.
 */
function lineIndexAtOffset(text, charOffset) {
    const before = text.slice(0, charOffset);

    return (before.match(/\n/g) || []).length;
}

module.exports = {
    TSDOC_TAG_RE,
    getCommentRunAboveLine,
    isTsdocCommentRun,
    lineIndexAtOffset
};
