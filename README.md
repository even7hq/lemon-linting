<div align="center">

# @lemon/linting

> **Code like Even!**

**Configuração ESLint opinionada da Even7 - flat config (ESLint 9), regras customizadas, presets por stack e parsers próprios para Vue 2, React, Svelte, TypeScript e Lua.**

[![ESLint 9](https://img.shields.io/badge/ESLint-9-blue.svg)](#)
[![Flat Config](https://img.shields.io/badge/Config-Flat%20Config-black.svg)](#)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue.svg)](#)
[![Vue 2](https://img.shields.io/badge/Frontend-Vue%202-green.svg)](#)
[![React](https://img.shields.io/badge/Frontend-React-61DAFB.svg)](#)
[![Svelte 5](https://img.shields.io/badge/Frontend-Svelte%205-FF3E00.svg)](#)
[![Lua](https://img.shields.io/badge/Scripts-Lua-purple.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#licença)

[Começar](#começar) • [Funcionalidades](#funcionalidades) • [Opinionado](#opinionado-de-propósito) • [Arquitetura](#arquitetura) • [Desenvolvimento](#desenvolvimento) • [Contribuir](#contribuindo)

</div>

---

## O que é @lemon/linting?

`@lemon/linting` é o pacote compartilhado de lint da Even7. Um único lugar onde vivem as convenções de código dos repos `luckymaker`, `lemon-design-system`, plugins, CLIs e tudo mais que precisa **parecer escrito pela mesma equipe**.

Ele é **opinionado de propósito**: as escolhas de estilo já foram tomadas. Você instala, aponta o `eslint.config.js` pro preset certo e segue codando - sem reinventar indentação, JSDoc ou ordem de imports a cada projeto novo.

Repositório: [github.com/even7hq/lemon-linting](https://github.com/even7hq/lemon-linting)

```text
  [ Seu projeto (backend, admin, plugin, CLI, ... ) ]
                              |
                              v
                    [ eslint.config.js ]
                              |
                              v
              +---------------+---------------+
              |               |               |
              v               v               v
     [ common.config ] [ typescript.config ] [ preset da stack ]
              |               |          (vue / react / svelte / lua)
              |               |
              v               v
        [ custom/local/* ]  [ @typescript-eslint ]
              |
              v
        [ ESLint 9 flat config ]
```

---

## Funcionalidades

- **Flat config nativo:** ESLint 9+ com composição por array - sem `.eslintrc` legado.
- **Opinionado e consistente:** 4 espaços, aspas duplas, sem trailing comma, `prefer-const`, ordem de imports alfabética com grupos para aliases `@/*`.
- **TypeScript type-aware:** `@typescript-eslint` com `project: true`, naming conventions, `consistent-type-imports` e resolver para imports TypeScript.
- **Plugin `local/*`:** dezenas de regras customizadas da Even7 para JSDoc, legibilidade, imports e JSX - com autofix onde faz sentido.
- **Preset backend:** `common` + `typescript` otimizado para APIs, serviços e código Node.
- **Preset Vue 2:** `vue-eslint-parser`, `flat/vue2-recommended`, `<script lang="ts">` e `<script server lang="lua">`, ordem de blocos/opções de componente, regras de template e indentação via `vue/script-indent`.
- **Preset React:** JSX/TSX com regras extras de newline entre expressões e elementos filhos.
- **Preset Svelte 5:** `eslint-plugin-svelte` com TypeScript em `<script lang="ts">` e regras de template/indentação Svelte-specific.
- **Preset Lua:** parser customizado (`luaparse`) com regras próprias para scripts e configs em Lua.
- **`defineConfig`:** helper para compor presets + overrides locais sem boilerplate.
- **ESLint bundled:** binário do ESLint já vem como dependência - versões alinhadas entre repos.
- **Parsers utilitários:** `ts-parser-path` (caminho resolvido do parser TS), `noop-parser` (blocos Lua em `.vue`), `lua-parser` (lint de `.lua`).

**Parcial / extensível:** regras `prevent-invalid-sanitization-regexp` e outras em `custom/` podem ser ativadas manualmente no projeto quando necessário.

---

## Opinionado de propósito

Sim, ele é **opinionado** - e isso é feature, não bug.

Aqui a gente não tenta agradar todo mundo. As escolhas já foram feitas:

| Área | Decisão |
| --- | --- |
| Indentação | 4 espaços |
| Aspas | Duplas (`"`) |
| Vírgula final | Nunca (`comma-dangle: never`) |
| `console` | Só `console.debug` (backend/TS); Vue/Svelte permitem `error`, `warn`, `info` |
| `else if` | Sempre na linha de baixo |
| JSDoc | Multilinha, `@param`/`@returns`/`@throws` documentados, linhas em branco ao redor |
| Imports | Ordem alfabética; `import type` separado; sem `await import()` escondido |
| Vue | Vue **2** (não Vue 3); componentes PascalCase; sem `v-html` |
| Namespaces | Permitidos (`@typescript-eslint/no-namespace: off`) |
| `any` | Permitido quando necessário |

Se você quer um preset genérico e neutro, existem outros pacotes no npm. Se você quer **codar como a Even7 codifica**, este é o lugar.

Dá para sobrescrever regras no seu `eslint.config.js` - mas o ponto é começar alinhado, não reinventar o lint do zero em cada repo.

---

## Começar

### Instalação

Instale direto do repositório Git:

```bash
yarn add @lemon/linting@git+https://github.com/even7hq/lemon-linting.git
```

No workspace Even7, depois de adicionar a dependência no `package.json`:

```bash
nayr
```

O pacote já traz ESLint 9 e todos os plugins necessários - não duplique versões no projeto.

### Configuração mínima

Crie `eslint.config.js` na raiz e escolha o preset da sua stack:

| Stack | Preset |
| --- | --- |
| Backend / Node / API | `@lemon/linting/backend.config` |
| Vue 2 + TypeScript | `@lemon/linting/vue.config` |
| React + TypeScript | `@lemon/linting/react.config` |
| Svelte 5 | `@lemon/linting/svelte.config` |
| Lua | `@lemon/linting/lua.config` |
| Só TypeScript | `@lemon/linting/typescript.config` |
| Só JavaScript base | `@lemon/linting/common.config` |

**Backend / TypeScript puro:**

```js
const backend = require("@lemon/linting/backend.config");

/** @type {import("eslint").Linter.Config[]} */
module.exports = [
    ...backend,
    {
        ignores: ["node_modules/**", "dist/**"]
    }
];
```

**Vue 2 + TypeScript:**

```js
const vue = require("@lemon/linting/vue.config");

/** @type {import("eslint").Linter.Config[]} */
module.exports = [
    ...vue,
    {
        ignores: ["node_modules/**", "dist/**"]
    }
];
```

**React + TypeScript:**

```js
const react = require("@lemon/linting/react.config");

/** @type {import("eslint").Linter.Config[]} */
module.exports = [
    ...react,
    {
        ignores: ["node_modules/**", "dist/**"]
    }
];
```

**Svelte:**

```js
const svelte = require("@lemon/linting/svelte.config");

/** @type {import("eslint").Linter.Config[]} */
module.exports = [
    ...svelte,
    {
        ignores: ["node_modules/**", "dist/**"]
    }
];
```

**Lua:**

```js
const lua = require("@lemon/linting/lua.config");

/** @type {import("eslint").Linter.Config[]} */
module.exports = [
    ...lua,
    {
        ignores: ["node_modules/**"]
    }
];
```

**Com overrides locais (`defineConfig`):**

```js
const { defineConfig } = require("@lemon/linting/define.config");

module.exports = defineConfig("@lemon/linting/backend.config", [
    {
        files: ["**/*.ts"],
        rules: {
            "no-console": "off"
        }
    }
]);
```

### Rodando o linter

```bash
yarn eslint .
```

Com glob explícito:

```bash
yarn eslint --config eslint.config.js "src/**/*.{ts,tsx,vue,svelte}"
```

Fix automático:

```bash
yarn eslint . --fix
```

### Integração com o editor

Para type-aware linting no VS Code / Cursor, use o parser resolvido pelo pacote:

```js
const tsParserPath = require("@lemon/linting/ts-parser-path");

module.exports = [
    // ... seus presets
    {
        files: ["**/*.ts"],
        languageOptions: {
            parser: require(tsParserPath),
            parserOptions: {
                project: true
            }
        }
    }
];
```

Habilite ESLint no editor apontando para o `eslint.config.js` na raiz do projeto.

---

## Arquitetura

O pacote é organizado em camadas composáveis:

| Módulo | Responsabilidade |
| --- | --- |
| `common.config.js` | Base JS: indent, quotes, imports, `unused-imports`, plugin `local/*` |
| `typescript.config.js` | Regras TS type-aware, naming conventions, padding entre statements |
| `backend.config.js` | `common` + `typescript` para APIs e serviços Node |
| `vue.config.js` | Vue 2 recommended + regras de SFC, script/template, sub-parser TS/Lua |
| `react.config.js` | `common` + `typescript` + regras JSX (`local/jsx-*`) |
| `svelte.config.js` | Svelte recommended + TypeScript em `<script>` + indent Svelte |
| `lua.config.js` | Parser Lua + plugin `lua/*` com regras de documentação e blocos |
| `define.config.js` | Helper `defineConfig()` para merge de presets |
| `custom/` | Plugin ESLint com regras `local/*` e `lua/*` |
| `parsers/` | `lua-parser`, `noop-parser` para casos especiais |
| `index.js` | Barrel que reexporta todos os presets |

### Exports do pacote

| Export | Uso |
| --- | --- |
| `@lemon/linting` | Barrel (`backend`, `vue`, `react`, ...) |
| `@lemon/linting/common.config` | Base JavaScript |
| `@lemon/linting/typescript.config` | TypeScript |
| `@lemon/linting/backend.config` | Backend Node |
| `@lemon/linting/vue.config` | Vue 2 |
| `@lemon/linting/react.config` | React |
| `@lemon/linting/svelte.config` | Svelte 5 |
| `@lemon/linting/lua.config` | Lua |
| `@lemon/linting/define.config` | Helper de composição |
| `@lemon/linting/ts-parser-path` | Caminho do parser TypeScript |
| `@lemon/linting/custom` | Plugin de regras locais |

### Regras customizadas (`local/*`)

Plugin interno em [`custom/`](./custom/):

**JSDoc e documentação**

- `local/require-jsdoc-param-returns` - `@param` e `@returns` obrigatórios
- `local/require-multiline-jsdoc` - JSDoc multilinha
- `local/require-blank-lines-around-jsdoc` - linhas em branco ao redor do bloco
- `local/require-blank-line-between-documented-props` - espaço entre props documentadas
- `local/require-jsdoc-on-upper-case-const` - constantes `UPPER_CASE` documentadas
- `local/require-jsdoc-throws` - `@throws` quando aplicável
- `local/prefer-jsdoc-comment` - preferir JSDoc a comentário solto
- `local/no-jsdoc-tag-format` - formato correto das tags

**Imports e variáveis**

- `local/remove-unused-vars` - remove vars/types/interfaces/enums não usados (autofix)
- `local/no-await-import` - proíbe `await import()` dinâmico
- `local/no-inline-type-import` - proíbe `import { type X }` inline

**Legibilidade**

- `local/max-inline-calls` - limita encadeamento de chamadas inline
- `local/prefer-else-newline-if` - `else if` na linha seguinte
- `local/blank-line-after-block-prop` - linha em branco após props de bloco

**JSX (React)**

- `local/jsx-newline-before-block-expression` - linha antes de `&&` e `.map()`
- `local/jsx-newline-between-elements-with-children` - linha entre irmãos com filhos

**Lua (`lua/*`)**

- `lua/require-jsdoc` - documentação em funções
- `lua/blank-line-before-block` - linha antes de blocos
- `lua/no-same-line-blocks` - blocos não na mesma linha
- `lua/require-call-parens` - parênteses em chamadas
- `lua/consistent-doc-prefix` - prefixo consistente na doc
- `lua/no-param-dash-separator` - separador de params na doc

**Opcionais (ativar manualmente no projeto)**

- `local/prevent-invalid-sanitization-regexp` - regexp de sanitização inválida

### Por que re-registrar plugins no Vue/Svelte?

`vue-eslint-parser` e `svelte-eslint-parser` criam contextos próprios para arquivos `.vue`/`.svelte`. Por isso `vue.config.js` e `svelte.config.js` re-aplicam `local/*` e regras TypeScript dentro do bloco `<script>` - o que funciona em `.ts` puro não herda automaticamente em SFCs.

---

## Desenvolvimento

Clone e instale:

```bash
git clone https://github.com/even7hq/lemon-linting.git
cd lemon-linting
yarn install
```

Testar regras Lua manualmente (fixtures em `test/lua/`):

```bash
yarn eslint test/lua/all_rules.lua --config lua.config.js
yarn eslint test/lua/padding.lua --config lua.config.js
```

Validar um preset contra um projeto consumidor:

```bash
cd ../seu-projeto
yarn eslint src/ --config eslint.config.js
```

### Adicionar uma regra customizada

1. Crie o arquivo em `custom/` (ou `custom/lua/` para Lua).
2. Registre em `custom/index.js` (ou no plugin `lua` em `lua.config.js`).
3. Ative em `common.config.js` (`localRules`) ou no preset específico.
4. Adicione fixture de teste em `test/` quando fizer sentido.

### Dependências principais

| Pacote | Papel |
| --- | --- |
| `eslint` ^9 | Motor de lint |
| `@typescript-eslint/*` | Parser e regras TypeScript |
| `eslint-plugin-vue` | Vue 2 SFC |
| `eslint-plugin-svelte` | Svelte 5 |
| `eslint-plugin-import-x` | Ordem e resolução de imports |
| `eslint-plugin-unused-imports` | Remove imports não usados |
| `luaparse` | AST para o parser Lua |

---

## Contribuindo

Achou uma regra que deveria existir? Um edge case que o autofix quebra? Abre uma issue ou manda PR:

**https://github.com/even7hq/lemon-linting**

Pull requests são bem-vindos - especialmente os que vêm com fixture em [`test/`](./test/) e explicam o *porquê* da regra, não só o *o quê*.

Antes de abrir PR:

1. Teste a regra contra código real de um repo Even7.
2. Verifique se o autofix não corrompe indentação (especialmente em `.vue` e `.svelte`).
3. Mantenha o pacote opinionado - regras genéricas demais provavelmente não pertencem aqui.

---

## Licença

[MIT](./LICENSE) - Copyright (c) Even7. Veja o arquivo [LICENSE](./LICENSE) para o texto completo.

---

<p align="center">
  Feito com carinho pela <strong>Even7</strong> · Code like Even!
</p>
