const assert = require("node:assert/strict");
const path = require("node:path");
const { RuleTester } = require("eslint");
const tsParser = require("@typescript-eslint/parser");
const vueParser = require("vue-eslint-parser");
const noopParser = require("../../parsers/noop-parser");

/**
 * Runs a RuleTester suite and prefixes failures with the rule name.
 *
 * @param {string} name Rule label.
 * @param {() => void} run RuleTester.run callback.
 */
function runRule(name, run) {
    try {
        run();
        console.log(`PASS ${name}`);
    } catch (err) {
        console.error(`FAIL ${name}`);
        throw err;
    }
}

const rules = {
    "no-em-dash": require("../../custom/no-em-dash.js"),
    "no-reexport-stub": require("../../custom/no-reexport-stub.js"),
    "no-unsafe-type-assertion": require("../../custom/no-unsafe-type-assertion.js"),
    "no-catch-any": require("../../custom/no-catch-any.js"),
    "no-empty-catch": require("../../custom/no-empty-catch.js"),
    "vue-no-style-block": require("../../custom/vue-no-style-block.js"),
    "no-form-data-consumer": require("../../custom/no-form-data-consumer.js"),
    "no-sql-placeholder-fk": require("../../custom/no-sql-placeholder-fk.js"),
    "pt-br-accents": require("../../custom/pt-br-accents.js"),
    "no-await-import": require("../../custom/no-await-import.js")
};

const tsRuleTester = new RuleTester({
    languageOptions: {
        parser: tsParser,
        parserOptions: {
            ecmaVersion: 2021,
            sourceType: "module"
        }
    }
});

const vueRuleTester = new RuleTester({
    languageOptions: {
        parser: vueParser,
        parserOptions: {
            parser: tsParser,
            ecmaVersion: 2021,
            sourceType: "module"
        }
    }
});

const jsRuleTester = new RuleTester({
    languageOptions: {
        ecmaVersion: 2021,
        sourceType: "module"
    }
});

const sqlRuleTester = new RuleTester({
    languageOptions: {
        parser: noopParser
    }
});

runRule("no-unsafe-type-assertion", () => {
    tsRuleTester.run("no-unsafe-type-assertion", rules["no-unsafe-type-assertion"], {
        valid: ["const x: number = 1;"],
        invalid: [
            {
                code: "const x = v as any;",
                errors: [{ message: /as any/ }]
            },
            {
                code: "const x = v as unknown as Foo;",
                errors: [{ message: /as unknown/ }]
            }
        ]
    });
});

runRule("no-catch-any", () => {
    tsRuleTester.run("no-catch-any", rules["no-catch-any"], {
        valid: ["try {} catch (err) {}"],
        invalid: [{
            code: "try {} catch (err: any) {}",
            errors: [{ message: /catch \(err: any\)/ }]
        }]
    });
});

runRule("pt-br-accents", () => {
    tsRuleTester.run("pt-br-accents", rules["pt-br-accents"], {
        valid: ['const s = "não encontrado";'],
        invalid: [{
            code: 'const s = "nao encontrado";',
            errors: [{ message: /accent/ }]
        }]
    });
});

runRule("no-reexport-stub", () => {
    tsRuleTester.run("no-reexport-stub", rules["no-reexport-stub"], {
        valid: [{
            code: "export { Foo } from \"./Foo\";",
            filename: path.join(__dirname, "../../index.ts")
        }],
        invalid: [{
            code: "export { Foo } from \"./Foo\";",
            filename: path.join(__dirname, "../../shim.ts"),
            errors: [{ message: /Re-export-only/ }]
        }]
    });
});

runRule("no-empty-catch", () => {
    tsRuleTester.run("no-empty-catch", rules["no-empty-catch"], {
        valid: ["try { x(); } catch (err) { console.debug(err); }"],
        invalid: [{
            code: "try { x(); } catch (err) {}",
            errors: [{ message: /Empty catch/ }]
        }]
    });
});

runRule("no-em-dash", () => {
    tsRuleTester.run("no-em-dash", rules["no-em-dash"], {
        valid: ['const s = "ok";'],
        invalid: [{
            code: 'const s = "a\u2014b";',
            errors: [{ message: /Em dash/ }]
        }]
    });
});

runRule("no-await-import", () => {
    tsRuleTester.run("no-await-import", rules["no-await-import"], {
        valid: ["import x from \"./x\";"],
        invalid: [{
            code: "async function f() { await import(\"./x\"); }",
            errors: [{ message: /await import/ }]
        }]
    });
});

runRule("vue-no-style-block", () => {
    vueRuleTester.run("vue-no-style-block", rules["vue-no-style-block"], {
        valid: [{
            code: "<template><div /></template>",
            filename: "component.vue"
        }],
        invalid: [{
            code: "<template><div /></template><style scoped></style>",
            filename: "component.vue",
            errors: [{ message: /<style>/ }]
        }]
    });
});

runRule("no-form-data-consumer", () => {
    jsRuleTester.run("no-form-data-consumer", rules["no-form-data-consumer"], {
        valid: ["const x = useFormContext;"],
        invalid: [{
            code: "const x = FormDataConsumer;",
            errors: [{ message: /FormDataConsumer/ }]
        }]
    });
});

runRule("no-sql-placeholder-fk", () => {
    sqlRuleTester.run("no-sql-placeholder-fk", rules["no-sql-placeholder-fk"], {
        valid: [{
            code: "UPDATE t SET matrixId = 42;",
            filename: "fixture.sql"
        }],
        invalid: [{
            code: "UPDATE t SET matrixId = 1;",
            filename: "fixture.sql",
            errors: [{ message: /\*Id = 1/ }]
        }]
    });
});

console.log("local eslint rule tests passed");
