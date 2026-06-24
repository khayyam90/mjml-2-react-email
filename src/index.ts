#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { render } from '@react-email/render'
import { convertMjml } from './converter'

async function main(): Promise<void> {
  const [, , inputArg, outputArg] = process.argv
  const inputPath = path.resolve(process.cwd(), inputArg ?? 'input.mjml')
  const outputPath = path.resolve(process.cwd(), outputArg ?? 'output.html')

  console.log(`Reading ${inputPath}…`)
  const mjmlContent = fs.readFileSync(inputPath, 'utf-8')

  console.log('Converting MJML to React Email elements…')
  const element = convertMjml(mjmlContent)

  console.log('Rendering to HTML…')
  // render() may be sync or async depending on the installed version
  const html = await Promise.resolve(render(element))

  console.log(`Writing output to ${outputPath}…`)
  fs.writeFileSync(outputPath, html, 'utf-8')
  console.log('Done.')
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
