import { join, relative } from 'node:path'
import { readdirSync, existsSync, mkdirSync, writeFileSync, statSync } from 'node:fs'
import type { AstroIntegration, AstroIntegrationLogger } from 'astro'

export const iconTyping = (): AstroIntegration => ({
  name: 'icon-types',
  hooks: {
    'astro:config:done': ({ logger }) => {
      generateIconTypes(logger)
    },
  },
})

function getAllSvgFiles(dir: string): string[] {
  let results: string[] = []
  const list = readdirSync(dir)

  for (const file of list) {
    const fullPath = join(dir, file)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      results = results.concat(getAllSvgFiles(fullPath))
    } else if (file.endsWith('.svg')) {
      results.push(fullPath)
    }
  }

  return results
}

function generateIconTypes(logger: AstroIntegrationLogger): void {
  try {
    const iconsDir = join(process.cwd(), 'src/icons')
    const svgPaths = getAllSvgFiles(iconsDir)

    const iconNames = svgPaths.map((fullPath) => {
      const relativePath = relative(iconsDir, fullPath).replace(/\\/g, '/')
      return relativePath.replace('.svg', '')
    })

    const typeDefinitions = `declare module 'virtual:icon' {
  export type IconName =
    | ${iconNames.map((name) => `'${name}'`).join('\n    | ')}
}
`

    const outputDir = join(process.cwd(), 'src')
    const outputFile = join(outputDir, 'icon.d.ts')

    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true })
    }

    writeFileSync(outputFile, typeDefinitions)
    logger.info('Types generated')
  } catch (error) {
    logger.error('Failed to generate types: ' + (error as Error).message)
  }
}
