/**
 * Codemod: replace disallowed inline object literals with emptyObject() + assignments.
 *
 * Usage:
 *   node InlineObjectLiteralFix.mjs --import-from "@/core/utils/EmptyObject.js" [--check] [--project tsconfig.json] [files...]
 *
 * When no files are passed, walks `src/` under the project root (directory of tsconfig).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { CLI_BUILDER_METHOD_NAMES } from "./inline-object-literal-policy.js";

/**
 * Maximum shorthand properties allowed inline (must match inline-object-literal-policy).
 */
const MAX_SHORTHAND = 2;

/**
 * Returns true for inline objects passed to CLI builder APIs (not domain DTOs).
 *
 * @param node Object literal expression.
 * @returns True when the codemod should skip this literal.
 */
function isDeclarativeConfigObjectLiteral(node) {
    const parent = node.parent;

    if (!parent || !ts.isCallExpression(parent)) {
        return false;
    }

    if (!parent.arguments.includes(node)) {
        return false;
    }

    const expression = parent.expression;

    if (!ts.isPropertyAccessExpression(expression)) {
        return false;
    }

    return CLI_BUILDER_METHOD_NAMES.has(expression.name.text);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Parses CLI arguments for the codemod.
 *
 * @param argv CLI args.
 * @returns Parsed options.
 * @throws {Error} When --import-from is missing.
 */
function parseArgs(argv) {
    const check = argv.includes("--check");
    let importFrom = process.env.LEMON_LINTING_EMPTY_OBJECT_IMPORT ?? "";
    let projectPath = "tsconfig.json";
    const files = [];

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];

        if (arg === "--check") {
            continue;
        }

        if (arg === "--import-from") {
            importFrom = argv[index + 1] ?? "";
            index += 1;
            continue;
        }

        if (arg === "--project") {
            projectPath = argv[index + 1] ?? projectPath;
            index += 1;
            continue;
        }

        if (!arg.startsWith("--")) {
            files.push(arg);
        }
    }

    if (!importFrom) {
        throw new Error("Missing --import-from (or LEMON_LINTING_EMPTY_OBJECT_IMPORT).");
    }

    return { check, importFrom, projectPath, files: files.length > 0 ? files : null };
}

/**
 * Finds the innermost enclosing statement for an expression.
 *
 * @param node AST node.
 * @returns Enclosing statement, if any.
 */
function findEnclosingStatement(node) {
    let current = node;

    while (current.parent) {
        if (ts.isStatement(current) && !ts.isBlock(current)) {
            return current;
        }

        current = current.parent;
    }

    return undefined;
}

/**
 * Mirrors inline-object-literal-policy for TypeScript AST nodes.
 *
 * @param node Object literal.
 * @returns True when the literal violates the inline policy.
 */
function isViolating(node) {
    const properties = node.properties;

    if (properties.length === 0) {
        return false;
    }

    if (properties.length > MAX_SHORTHAND) {
        return true;
    }

    return !properties.every((prop) => ts.isShorthandPropertyAssignment(prop));
}

/**
 * Resolves a display type string for an object literal expression.
 *
 * @param node Object literal.
 * @param checker Type checker.
 * @returns Type text for emptyObject generic argument.
 */
function objectTypeString(node, checker) {
    try {
        const type = checker.getTypeAtLocation(node);
        const text = checker.typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation);

        if (!text || text === "{}") {
            return "Record<string, unknown>";
        }

        return text.replace(/\s+/g, " ").trim();
    } catch {
        return "Record<string, unknown>";
    }
}

/**
 * Returns source text for an expression node.
 *
 * @param expr Property value expression.
 * @param sourceFile Parsed source.
 * @returns Expression source text.
 */
function expressionText(expr, sourceFile) {
    return expr.getText(sourceFile);
}

/**
 * Collects assignable properties from a violating object literal.
 *
 * @param node Object literal.
 * @param sourceFile Parsed source.
 * @returns Property descriptors for codegen.
 * @throws {Error} When the literal contains a method member.
 */
function collectProperties(node, sourceFile) {
    const props = [];

    for (const prop of node.properties) {
        if (ts.isSpreadAssignment(prop)) {
            const spreadText = expressionText(prop.expression, sourceFile);
            props.push({ key: "__spread__", valueText: spreadText, computed: true, spread: true });

            continue;
        }

        if (ts.isMethodDeclaration(prop) || ts.isGetAccessor(prop) || ts.isSetAccessor(prop)) {
            throw new Error(`Method not supported at ${prop.getStart()}`);
        }

        if (!ts.isPropertyAssignment(prop) && !ts.isShorthandPropertyAssignment(prop)) {
            continue;
        }

        if (ts.isShorthandPropertyAssignment(prop)) {
            const key = prop.name.getText(sourceFile);
            props.push({ key, valueText: key, computed: false });

            continue;
        }

        const keyNode = prop.name;
        let key;

        if (ts.isIdentifier(keyNode)) {
            key = keyNode.getText(sourceFile);
        } else
            if (ts.isStringLiteral(keyNode) || ts.isNumericLiteral(keyNode)) {
                key = keyNode.getText(sourceFile).replace(/^['"]|['"]$/g, "");
            } else {
                key = expressionText(keyNode, sourceFile);
            }

        const computed = !ts.isIdentifier(keyNode) && !ts.isStringLiteral(keyNode) && !ts.isNumericLiteral(keyNode);
        const valueText = expressionText(prop.initializer, sourceFile);
        props.push({ key, valueText, computed });
    }

    return props;
}

/**
 * Inserts text at a byte offset in a source string.
 *
 * @param sourceText File contents.
 * @param position Insert position.
 * @param insert Text to insert.
 * @returns Updated source text.
 */
function insertAt(sourceText, position, insert) {
    return sourceText.slice(0, position) + insert + sourceText.slice(position);
}

/**
 * Replaces a byte range in a source string.
 *
 * @param sourceText File contents.
 * @param start Start offset.
 * @param end End offset.
 * @param replacement Replacement text.
 * @returns Updated source text.
 */
function replaceRange(sourceText, start, end, replacement) {
    return sourceText.slice(0, start) + replacement + sourceText.slice(end);
}

/**
 * Collects violating object literals in a source file.
 *
 * @param sourceFile Parsed source.
 * @returns Violating nodes in reverse source order.
 */
function collectViolations(sourceFile) {
    const nodes = [];

    /**
     * Walks the AST and records violating object literals.
     *
     * @param node AST node.
     * @returns Nothing.
     */
    function visit(node) {
        if (ts.isObjectLiteralExpression(node) && isViolating(node) && !isDeclarativeConfigObjectLiteral(node)) {
            nodes.push(node);
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    nodes.sort((a, b) => b.pos - a.pos);

    return nodes;
}

/**
 * Ensures emptyObject is imported when the file uses it.
 *
 * @param sourceFile Parsed source.
 * @param sourceText File text.
 * @param emptyObjectImport Module specifier for emptyObject.
 * @returns Updated source text.
 */
function addImportIfNeeded(sourceFile, sourceText, emptyObjectImport) {
    const hasEmptyObjectUsage = sourceText.includes("emptyObject(");

    if (!hasEmptyObjectUsage) {
        return sourceText;
    }

    const hasImport = sourceFile.statements.some((stmt) => {
        if (!ts.isImportDeclaration(stmt)) {
            return false;
        }

        const module = stmt.moduleSpecifier.getText(sourceFile);

        if (module !== `"${emptyObjectImport}"` && module !== `'${emptyObjectImport}'`) {
            return false;
        }

        const spec = stmt.importClause?.namedBindings;

        if (!spec || !ts.isNamedImports(spec)) {
            return false;
        }

        return spec.elements.some((el) => el.name.getText(sourceFile) === "emptyObject");
    });

    if (hasImport) {
        return sourceText;
    }

    let lastImportEnd = 0;

    for (const stmt of sourceFile.statements) {
        if (ts.isImportDeclaration(stmt)) {
            lastImportEnd = stmt.getEnd();
        }
    }

    const importLine = `import { emptyObject } from "${emptyObjectImport}";\n`;

    if (lastImportEnd === 0) {
        return importLine + sourceText;
    }

    return insertAt(sourceText, lastImportEnd, "\n" + importLine);
}

/**
 * Rewrites one source file, applying emptyObject transforms bottom-up.
 *
 * @param filePath Absolute path.
 * @param program TypeScript program.
 * @param emptyObjectImport Module specifier.
 * @param check Dry run.
 * @returns True when file changed.
 * @throws {Error} When transform limits are exceeded or codegen cannot anchor a literal.
 */
function fixFile(filePath, program, emptyObjectImport, check) {
    let sourceFile = program.getSourceFile(filePath);

    if (!sourceFile) {
        sourceFile = program.getSourceFileByPath(filePath);
    }

    if (!sourceFile) {
        const normalized = filePath.split(path.sep).join("/");
        sourceFile = program.getSourceFiles().find((sf) => sf.fileName.endsWith(normalized.slice(-40))) ?? undefined;
    }

    if (!sourceFile) {
        return false;
    }

    let sourceText = sourceFile.getFullText();
    let counter = 0;

    let violations = collectViolations(sourceFile);

    if (violations.length === 0) {
        return false;
    }

    let guard = 0;

    while (violations.length > 0) {
        guard += 1;

        if (guard > 5000) {
            throw new Error(`Too many transforms in ${filePath}`);
        }

        const node = violations[0];
        const varName = `draftObj${counter}`;
        counter += 1;

        let currentFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
        const props = collectProperties(node, currentFile);
        const typeStr = objectTypeString(node, program.getTypeChecker());
        const indent = "    ";

        const lines = [];
        lines.push(`${indent}const ${varName} = emptyObject<${typeStr}>();`);

        for (const prop of props) {
            if (prop.spread) {
                lines.push(`${indent}Object.assign(${varName}, ${prop.valueText});`);

                continue;
            }

            if (prop.computed) {
                lines.push(`${indent}${varName}[${prop.key}] = ${prop.valueText};`);
            } else
                if (/^[a-zA-Z_$][\w$]*$/.test(prop.key)) {
                    lines.push(`${indent}${varName}.${prop.key} = ${prop.valueText};`);
                } else {
                    lines.push(`${indent}${varName}["${prop.key}"] = ${prop.valueText};`);
                }
        }

        const block = lines.join("\n") + "\n";

        let arrowFunction = node.parent;

        if (ts.isParenthesizedExpression(arrowFunction?.parent) && ts.isArrowFunction(arrowFunction.parent.parent)) {
            arrowFunction = arrowFunction.parent.parent;
        } else
            if (!ts.isArrowFunction(arrowFunction)) {
                arrowFunction = undefined;
            }

        if (arrowFunction && ts.isArrowFunction(arrowFunction) && arrowFunction.body === node.parent) {
            const arrowStart = arrowFunction.getStart();
            const arrowEnd = arrowFunction.getEnd();
            const paramText = sourceText.slice(arrowFunction.parameters.getStart(), arrowFunction.parameters.getEnd());
            const asyncPrefix = arrowFunction.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword)
                ? "async "
                : "";
            const newArrow = `${asyncPrefix}${paramText} => {\n${block}${indent}return ${varName};\n}`;
            sourceText = replaceRange(sourceText, arrowStart, arrowEnd, newArrow);
        } else
            if (arrowFunction && ts.isArrowFunction(arrowFunction) && arrowFunction.body === node) {
                const arrowStart = arrowFunction.getStart();
                const arrowEnd = arrowFunction.getEnd();
                const paramText = sourceText.slice(arrowFunction.parameters.getStart(), arrowFunction.parameters.getEnd());
                const asyncPrefix = arrowFunction.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword)
                    ? "async "
                    : "";
                const newArrow = `${asyncPrefix}${paramText} => {\n${block}${indent}return ${varName};\n}`;
                sourceText = replaceRange(sourceText, arrowStart, arrowEnd, newArrow);
            } else {
                const stmt = findEnclosingStatement(node);

                if (!stmt) {
                    throw new Error(`No enclosing statement for object at ${node.getStart()} in ${filePath}`);
                }

                const stmtStart = stmt.getStart(currentFile, true);
                const nodeStart = node.getStart(currentFile, true);
                const nodeEnd = node.getEnd(currentFile);
                sourceText = insertAt(sourceText, stmtStart, block);

                const shift = stmtStart <= nodeStart ? block.length : 0;
                sourceText = replaceRange(sourceText, nodeStart + shift, nodeEnd + shift, varName);
            }

        currentFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
        violations = collectViolations(currentFile);
    }

    const finalFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    sourceText = addImportIfNeeded(finalFile, sourceText, emptyObjectImport);

    if (!check) {
        fs.writeFileSync(filePath, sourceText, "utf8");
    }

    return true;
}

/**
 * Lists TypeScript source files under a directory tree.
 *
 * @param dir Directory root.
 * @returns Absolute paths to .ts files.
 */
function walkTs(dir) {
    const out = [];

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            out.push(...walkTs(full));
        } else
            if (entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")) {
                out.push(full);
            }
    }

    return out;
}

/**
 * CLI entrypoint.
 *
 * @returns Nothing.
 */
function main() {
    const { check, importFrom, projectPath, files } = parseArgs(process.argv.slice(2));
    const resolvedProject = path.isAbsolute(projectPath)
        ? projectPath
        : path.resolve(process.cwd(), projectPath);
    const projectRoot = path.dirname(resolvedProject);
    const srcRoot = path.join(projectRoot, "src");
    const config = ts.readConfigFile(resolvedProject, ts.sys.readFile);
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, projectRoot);
    const program = ts.createProgram({
        rootNames: parsed.fileNames,
        options: parsed.options
    });

    const targets = files ?? (fs.existsSync(srcRoot) ? walkTs(srcRoot) : parsed.fileNames);
    let changed = 0;

    for (const filePath of targets) {
        const abs = path.isAbsolute(filePath) ? filePath : path.resolve(projectRoot, filePath);

        try {
            if (fixFile(abs, program, importFrom, check)) {
                changed += 1;
                console.warn(check ? "would fix" : "fixed", path.relative(projectRoot, abs));
            }
        } catch (err) {
            const detail = err instanceof Error ? `${err.message}\n${err.stack ?? ""}` : String(err);
            console.error("failed", path.relative(projectRoot, abs), detail);
            process.exitCode = 1;
        }
    }

    console.warn(`done: ${changed} file(s)${check ? " (dry run)" : ""}`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
    main();
}

export {
    isViolating,
    collectViolations,
    fixFile,
    MAX_SHORTHAND
};
