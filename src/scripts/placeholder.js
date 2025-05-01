import { readdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve, extname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = join(__dirname, '../../public')
const FILE = join(__dirname, '../data/placeholders.json')

const EXTENSIONS = ['.jpg', '.jpeg', '.png', '.svg']

async function generateBlurPlaceholder(imagePath) {
  try {
    const imageBuffer = await sharp(imagePath).resize(10).webp({ quality: 10 }).toBuffer()

    // convert to base64
    return `data:image/webp;base64,${imageBuffer.toString('base64')}`
  } catch (error) {
    console.error(`Error processing ${imagePath}:`, error)
    return null
  }
}

async function* walkDirectory(dir) {
  const files = await readdir(dir, { withFileTypes: true })
  for (const file of files) {
    const res = resolve(dir, file.name)
    if (file.isDirectory()) {
      yield* walkDirectory(res)
    } else {
      yield res
    }
  }
}

async function generatePlaceholders() {
  const placeholderData = {}
  let count = 0

  try {
    for await (const filePath of walkDirectory(PUBLIC_DIR)) {
      const ext = extname(filePath).toLowerCase()
      if (EXTENSIONS.includes(ext)) {
        const relativePath = relative(PUBLIC_DIR, filePath)
        console.info(`Processing: ${relativePath}`)

        const placeholder = await generateBlurPlaceholder(filePath)
        if (placeholder) {
          placeholderData[`/${relativePath}`] = placeholder
          count++
        }
      }
    }

    // save placeholders to JSON file
    await writeFile(FILE, JSON.stringify(placeholderData, null, 2))

    console.info(`✅ Generated placeholders for ${count} images`)
    console.info(`📝 Data saved in ${relative(process.cwd(), FILE)}`)
  } catch (error) {
    console.error('Error generating placeholders:', error)
    process.exit(1)
  }
}

generatePlaceholders()
