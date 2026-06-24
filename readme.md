# mjml-2-react-email

[![CI](https://github.com/khayyam90/mjml-2-react-email/actions/workflows/ci.yml/badge.svg)](https://github.com/khayyam90/mjml-2-react-email/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/mjml-2-react-email)](https://www.npmjs.com/package/mjml-2-react-email)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Convert MJML email templates into [React Email](https://react.email/) components and render them to HTML.

## Why?

MJML compiles to email-client-safe HTML but produces opaque, hard-to-customise output. React Email gives you a composable, type-safe component layer — but you may already have a large library of `.mjml` templates.

This tool bridges the gap: it parses MJML, maps each tag to its React Email equivalent, and renders the result with `@react-email/render`. You get React Email's rendering pipeline applied to your existing MJML templates without rewriting them.

## How it works

```
input.mjml  →  convertMjml()  →  React element tree  →  @react-email/render  →  output.html
```

The converter parses MJML with `htmlparser2`, maps tags to React Email components (`Html`, `Body`, `Section`, `Column`, `Img`, `Button`, …), and renders the result to a complete HTML string.

## Installation

```bash
npm install mjml-2-react-email
```

**Peer dependencies** — install these alongside the package if you don't have them already:

```bash
npm install react @react-email/components @react-email/render
```

## Usage

### Programmatic API

```ts
import { convertMjml } from 'mjml-2-react-email'
import { render } from '@react-email/render'
import fs from 'fs'

const mjml = fs.readFileSync('template.mjml', 'utf-8')
const element = convertMjml(mjml)   // → React.ReactElement
const html = await render(element)  // → full HTML string
```

`convertMjml(mjml: string): React.ReactElement` is the single exported function.

### CLI

After installing, the `mjml2re` binary is available:

```bash
# defaults: input.mjml → output.html
npx mjml2re

# explicit paths
npx mjml2re path/to/template.mjml path/to/output.html
```

Or clone and run locally:

```bash
git clone https://github.com/khayyam90/mjml-2-react-email.git
cd mjml-2-react-email
npm install
npm start                                      # input.mjml → output.html
npm start -- template.mjml result.html         # custom paths
```

## Supported MJML tags

| Tag | Rendered as |
|-----|-------------|
| `<mjml>` | `<Html>` |
| `<mj-head>` | `<Head>` |
| `<mj-body>` | `<Body>` |
| `<mj-preview>` | `<Preview>` |
| `<mj-title>` | `<title>` |
| `<mj-font>` | `<link rel="stylesheet">` |
| `<mj-style>` | `<style>` |
| `<mj-attributes>` | default attribute injection |
| `<mj-section>` | `<Section>` |
| `<mj-column>` | `<Column>` |
| `<mj-image>` | `<Img>` |
| `<mj-text>` | `<div>` (inner HTML preserved) |
| `<mj-button>` | `<Button>` |
| `<mj-divider>` | `<hr>` styled as `border-top` |
| `<mj-spacer>` | `<div>` with fixed height |

## Known limitations

- MJML features that rely on the official compiler's pre-processing (responsive breakpoints, `mj-include`, `mj-hero`, `mj-accordion`, `mj-carousel`) are not supported — only the tags listed above are mapped.
- `mj-all` inside `<mj-attributes>` (catch-all defaults) is not implemented; per-tag defaults work correctly.
- The output targets React Email's rendering pipeline, not MJML's own. Visual differences are possible for complex layouts.

## Development

```bash
npm run build       # compile TypeScript → dist/
npm run typecheck   # type-check without emitting
npm run mjml        # compile input.mjml → input.html (MJML reference output)
```

## Example

The included `input.mjml` is sourced from the [MJML online gallery](https://mjml.io/templates). Run `npm start` to produce `output.html`.

## License

[MIT](LICENSE)
