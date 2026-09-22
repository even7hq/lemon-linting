/**
 * Re-aligns interior lines of a multiline block JSDoc to a consistent star margin.
 *
 * @param {string} commentText Full block comment text including opening and closing delimiters.
 * @returns {string} Normalized comment text, unchanged when already aligned.
 */
function normalizeJsdocBlockIndent(commentText) {
    const lines = commentText.split(/\r?\n/);
    const openIndex = lines.findIndex((line) => /\/\*\*/.test(line));

    if (openIndex < 0) {
        return commentText;
    }

    const openLine = lines[openIndex];

    if (openLine.includes("*/") && openLine.indexOf("*/") > openLine.indexOf("/**") + 3) {
        return commentText;
    }

    let closeIndex = -1;

    for (let index = lines.length - 1; index >= openIndex; index -= 1) {
        if (/\*\/\s*$/.test(lines[index].trimEnd())) {
            closeIndex = index;
            break;
        }
    }

    if (closeIndex <= openIndex) {
        return commentText;
    }

    const starIndents = [];

    for (let index = openIndex + 1; index <= closeIndex; index += 1) {
        const match = lines[index].trimEnd().match(/^(\s*)\*/);

        if (match) {
            starIndents.push(match[1].length);
        }
    }

    if (starIndents.length === 0) {
        return commentText;
    }

    const referenceIndent = Math.max(...starIndents);
    const starOnly = `${" ".repeat(referenceIndent)}*`;
    const starPrefix = `${" ".repeat(referenceIndent)}* `;
    const closingLine = `${" ".repeat(referenceIndent)}*/`;

    let changed = false;

    const normalized = lines.map((line, index) => {
        if (index <= openIndex || index > closeIndex) {
            return line;
        }

        const trimmed = line.trimEnd();

        if (index === closeIndex) {
            if (trimmed !== closingLine) {
                changed = true;
                return closingLine;
            }

            return line;
        }

        const starMatch = trimmed.match(/^(\s*)\*(\s?(.*))?$/);

        if (!starMatch) {
            return line;
        }

        const rest = starMatch[3] ?? "";
        const fixed = rest === "" ? starOnly : starPrefix + rest;

        if (trimmed !== fixed) {
            changed = true;
            return fixed;
        }

        return line;
    });

    if (!changed) {
        return commentText;
    }

    return normalized.join("\n");
}

/**
 * @param {string} commentText Full block comment text including delimiters.
 * @returns {boolean}
 */
function hasJsdocBlockIndentViolation(commentText) {
    return normalizeJsdocBlockIndent(commentText) !== commentText;
}

module.exports = {
    normalizeJsdocBlockIndent,
    hasJsdocBlockIndentViolation
};
