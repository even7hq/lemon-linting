/**
 * Shared JSDoc tag normalization for TypeScript (tag layout and summary helpers).
 */

/**
 * Regular expression to match raw parameter type declarations.
 */
const RAW_PARAM_TYPE_RE = /(@param\s+\S+)\s+\{(?!@)[^}]+\}\s*/g;

/**
 * Regular expression to match parameter type declarations with a dash separator.
 */
const PARAM_DASH_RE = /(@param\s+\S+(?:\s+\{@[^}]+\})*)\s+[-\u2013\u2014]\s+/;

/**
 * Regular expression to match return type declarations with a dash separator.
 */
const RETURNS_DASH_RE = /(@returns?)\s+[-\u2013\u2014]\s+(?=[A-Za-z`"'/{])/;

/**
 * Normalizes a single JSDoc comment line containing @param or @returns tags.
 *
 * @param line A line from inside a block comment (may include leading ` * `).
 * @returns The normalized line, unchanged when no tag rules apply.
 */
function normalizeJsdocLine(line) {
    if (!/@param\b|@returns?\b/.test(line)) {
        return line;
    }

    let result = line;

    if (/@param\b/.test(result)) {
        result = result.replace(RAW_PARAM_TYPE_RE, "$1 ");
        result = result.replace(PARAM_DASH_RE, "$1 ");
    }

    if (/@returns?\b/.test(result)) {
        result = result.replace(RETURNS_DASH_RE, "$1 ");
    }

    return result;
}

/**
 * Normalizes all JSDoc lines inside a block comment inner value.
 *
 * @param commentValue The inner text of a block comment (without surrounding delimiters).
 * @returns Normalized inner text.
 */
function normalizeJsdocCommentValue(commentValue) {
    return commentValue
        .split("\n")
        .map((line) => normalizeJsdocLine(line))
        .join("\n");
}

/**
 * Normalizes JSDoc block comments in a full source file.
 *
 * @param text Full file contents.
 * @returns Updated file contents.
 */
function normalizeFileContent(text) {
    return text.replace(/\/\*\*[\s\S]*?\*\//g, (comment) => {
        const inner = comment.slice(3, -2);
        const normalized = normalizeJsdocCommentValue(inner);

        if (normalized === inner) {
            return comment;
        }

        return `/**${normalized}*/`;
    });
}

/**
 * Returns true when the line still violates JSDoc tag formatting rules.
 *
 * @param line A line from inside a block comment.
 * @returns True when the line should be normalized.
 */
function hasJsdocTagFormatViolation(line) {
    return normalizeJsdocLine(line) !== line;
}

/**
 * Returns true when JSDoc text includes a prose summary before the first block tag.
 *
 * @param {string} commentValue ESLint block comment inner text (starts with `*`).
 * @returns {boolean} True when a non-empty summary line appears before `@` tags.
 */
function hasJsdocSummaryBeforeTags(commentValue) {
    const lines = commentValue.split(/\r?\n/);

    for (const line of lines) {
        const trimmed = line.replace(/^\s*\*?\s*/, "").trim();

        if (trimmed === "") {
            continue;
        }

        if (trimmed.startsWith("@")) {
            return false;
        }

        return true;
    }

    return false;
}

/**
 * Returns true when a Lua doc comment run includes prose before `@` tags.
 *
 * @param {string} combinedDocText Joined doc lines from a Lua comment block.
 * @returns {boolean} True when a summary line appears before block tags.
 */
function hasLuaDocSummaryBeforeTags(combinedDocText) {
    const lines = combinedDocText.split(/\r?\n/);

    for (const line of lines) {
        const trimmed = line.replace(/^---?\s*/, "").trim();

        if (trimmed === "") {
            continue;
        }

        if (trimmed.startsWith("@")) {
            return false;
        }

        return true;
    }

    return false;
}

module.exports = {
    normalizeJsdocLine,
    normalizeJsdocCommentValue,
    normalizeFileContent,
    hasJsdocTagFormatViolation,
    hasJsdocSummaryBeforeTags,
    hasLuaDocSummaryBeforeTags
};
