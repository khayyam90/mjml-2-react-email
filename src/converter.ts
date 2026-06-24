import { parseDocument } from 'htmlparser2'
import type { AnyNode, Element, Text as DomText } from 'domhandler'
import React from 'react'
import { Html, Head, Preview, Body, Section, Column, Img, Button } from '@react-email/components'

const MJML_ATTR_TO_CSS: Record<string, string> = {
  'background-color': 'backgroundColor',
  'text-align': 'textAlign',
  'color': 'color',
  'font-family': 'fontFamily',
  'font-size': 'fontSize',
  'font-weight': 'fontWeight',
  'line-height': 'lineHeight',
  'border-radius': 'borderRadius',
  'padding': 'padding',
  'padding-top': 'paddingTop',
  'padding-bottom': 'paddingBottom',
  'padding-left': 'paddingLeft',
  'padding-right': 'paddingRight',
  'border': 'border',
  'width': 'width',
  'vertical-align': 'verticalAlign',
}

function stripFontQuotes(value: string): string {
  return value.replace(/'([^']*)'/g, '$1')
}

function buildMjmlStyle(attribs: Record<string, string>): React.CSSProperties {
  const style: Record<string, string> = {}
  for (const [mjmlAttr, cssProp] of Object.entries(MJML_ATTR_TO_CSS)) {
    if (attribs[mjmlAttr]) {
      const value = attribs[mjmlAttr]
      style[cssProp] = mjmlAttr === 'font-family' ? stripFontQuotes(value) : value
    }
  }
  return style as React.CSSProperties
}

function parseInlineStyle(styleStr: string): React.CSSProperties {
  const result: Record<string, string> = {}
  for (const decl of styleStr.split(';')) {
    const idx = decl.indexOf(':')
    if (idx === -1) continue
    const prop = decl.slice(0, idx).trim()
    const value = decl.slice(idx + 1).trim()
    if (!prop || !value) continue
    const camelProp = prop.replace(/-([a-z])/g, (_, l: string) => l.toUpperCase())
    result[camelProp] = camelProp === 'fontFamily' ? stripFontQuotes(value) : value
  }
  return result as React.CSSProperties
}

function convertHtmlNodes(nodes: AnyNode[]): React.ReactNode[] {
  return nodes.flatMap((node, i): React.ReactNode[] => {
    if (node.type === 'text') {
      const data = (node as unknown as DomText).data
      return data ? [data] : []
    }
    if (node.type === 'tag') {
      const el = node as unknown as Element
      const props: Record<string, unknown> = { key: i }
      for (const [k, v] of Object.entries(el.attribs)) {
        if (k === 'style') props.style = parseInlineStyle(v)
        else if (k === 'class') props.className = v
        else props[k] = v
      }
      return [React.createElement(el.name, props, ...convertHtmlNodes(el.children))]
    }
    return []
  })
}

// Populated before conversion starts; holds per-tag defaults from <mj-attributes>
let mjmlDefaults: Map<string, Record<string, string>> = new Map()

function collectMjAttributes(root: Element): Map<string, Record<string, string>> {
  const defaults = new Map<string, Record<string, string>>()
  const head = root.children.find(
    (c) => c.type === 'tag' && (c as unknown as Element).name.toLowerCase() === 'mj-head',
  ) as Element | undefined
  if (!head) return defaults
  const attrsEl = head.children.find(
    (c) => c.type === 'tag' && (c as unknown as Element).name.toLowerCase() === 'mj-attributes',
  ) as Element | undefined
  if (!attrsEl) return defaults
  for (const child of attrsEl.children) {
    if (child.type !== 'tag') continue
    const el = child as unknown as Element
    defaults.set(el.name.toLowerCase(), { ...el.attribs })
  }
  return defaults
}

function convertNode(node: AnyNode, key: number): React.ReactNode {
  if (node.type !== 'tag') return null
  const el = node as unknown as Element
  const tag = el.name.toLowerCase()
  // Element attribs win over mj-attributes defaults
  const attribs = { ...(mjmlDefaults.get(tag) ?? {}), ...el.attribs }
  const style = buildMjmlStyle(attribs)

  const mjmlKids = el.children
    .filter((c) => c.type === 'tag' && (c as unknown as Element).name.toLowerCase().startsWith('mj-'))
    .map((c, i) => convertNode(c, i))
    .filter((c): c is React.ReactElement => c !== null)

  switch (tag) {
    case 'mjml':
      return React.createElement(Html, { lang: 'en', key }, ...mjmlKids)

    case 'mj-head':
      return React.createElement(Head, { key }, ...mjmlKids)

    // Non-rendering metadata tag
    case 'mj-attributes':
      return null

    case 'mj-title': {
      const text = el.children
        .filter((c) => c.type === 'text')
        .map((c) => (c as unknown as DomText).data)
        .join('')
      return React.createElement('title', { key }, text)
    }

    case 'mj-preview': {
      const text = el.children
        .filter((c) => c.type === 'text')
        .map((c) => (c as unknown as DomText).data)
        .join('')
      return React.createElement(Preview, { key, children: text })
    }

    case 'mj-font':
      return React.createElement('link', {
        key,
        rel: 'stylesheet',
        href: el.attribs.href,
      })

    case 'mj-style': {
      const css = el.children
        .filter((c) => c.type === 'text')
        .map((c) => (c as unknown as DomText).data)
        .join('')
      return React.createElement('style', { key, dangerouslySetInnerHTML: { __html: css } })
    }

    case 'mj-spacer': {
      const height = el.attribs.height ?? '20px'
      return React.createElement('div', { key, style: { height } })
    }

    case 'mj-body':
      return React.createElement(Body, { style, key }, ...mjmlKids)

    case 'mj-section': {
      const className = el.attribs['css-class']
      return React.createElement(Section, { style, key, ...(className ? { className } : {}) }, ...mjmlKids)
    }

    case 'mj-column': {
      const className = el.attribs['css-class']
      return React.createElement(Column, { style, key, ...(className ? { className } : {}) }, ...mjmlKids)
    }

    case 'mj-image': {
      const align = el.attribs.align
      if (align === 'center') {
        (style as Record<string, string>).margin = '0 auto'
        ;(style as Record<string, string>).display = 'block'
      }
      return React.createElement(Img, {
        key,
        src: el.attribs.src,
        width: el.attribs.width,
        alt: el.attribs.alt ?? '',
        style,
      })
    }

    case 'mj-text': {
      // align attribute → textAlign (not in MJML_ATTR_TO_CSS to avoid conflicting with mj-image)
      // MJML defaults: align=left, color=#000000, line-height=1
      const s = style as Record<string, string>
      s.textAlign = attribs['align'] ?? 'left'
      if (!s.color) s.color = '#000000'
      if (!s.lineHeight) s.lineHeight = '1'
      const className = el.attribs['css-class']
      const innerNodes = convertHtmlNodes(el.children)
      if (innerNodes.length === 0) return null
      return React.createElement('div', { key, style, ...(className ? { className } : {}) }, ...innerNodes)
    }

    case 'mj-button': {
      // inner-padding controls the padding inside the button itself
      const innerPadding = el.attribs['inner-padding']
      if (innerPadding) (style as Record<string, string>).padding = innerPadding
      const innerNodes = convertHtmlNodes(el.children)
      return React.createElement(
        Button,
        { key, href: el.attribs.href ?? '#', style },
        ...innerNodes,
      )
    }

    case 'mj-divider': {
      const borderStyle = el.attribs['border-style'] ?? 'solid'
      const borderWidth = el.attribs['border-width'] ?? '1px'
      const borderColor = el.attribs['border-color'] ?? '#000000'
      return React.createElement('p', {
        key,
        style: {
          borderTop: `${borderStyle} ${borderWidth} ${borderColor}`,
          fontSize: '1px',
          margin: '0px auto',
          width: '100%',
        },
      })
    }

    default:
      console.error('missing conversion for ' + tag)
      return null
  }
}

export function convertMjml(mjmlContent: string): React.ReactElement {
  // Use HTML parsing mode so &nbsp; and other HTML entities are handled correctly
  const doc = parseDocument(mjmlContent, { decodeEntities: true })

  const root = doc.children.find(
    (n): n is Element =>
      n.type === 'tag' && (n as unknown as Element).name.toLowerCase() === 'mjml',
  ) as Element | undefined

  if (!root) throw new Error('<mjml> root element not found in input')

  mjmlDefaults = collectMjAttributes(root as unknown as Element)

  return convertNode(root as unknown as AnyNode, 0) as React.ReactElement
}
