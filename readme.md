# Convert MJML to React Email

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Convert MJML email templates into [React Email](https://react.email/) components and render them to HTML.

## How it works

```
input.mjml  →  convertMjml()  →  React elements  →  @react-email/render  →  output.html
```

The converter parses MJML tags with `htmlparser2`, maps them to React Email components (`Html`, `Body`, `Section`, `Column`, `Img`, `Button`, …), and renders the result to a full HTML string.

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
| `<mj-divider>` | `<p>` styled as `border-top` |
| `<mj-spacer>` | `<div>` with fixed height |

## Requirements

- Node.js ≥ 18
- npm ≥ 9

## Installation

```bash
npm install
```

## Usage

Place your MJML template at `input.mjml`, then run:

```bash
npm start
```

This writes the rendered HTML to `output.html`.

### Compile MJML first (optional)

If you want to pre-validate your template with the official MJML compiler:

```bash
npm run mjml        # writes input.html (MJML-rendered reference)
```

### Build

```bash
npm run build       # emit JS to dist/
npm run typecheck   # type-check without emitting
```

## Project structure

```
src/
  converter.ts   – MJML → React element tree
  index.ts       – CLI entry point: read → convert → render → write
input.mjml       – example template
```

## Example
Example is provided from MJML online gallery

## License

[MIT](LICENSE)
