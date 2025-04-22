import { readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'

const filePath = './refresh_token.json'

export async function getRefreshToken(): Promise<string> {
  if (!existsSync(filePath)) {
    throw new Error('No hay refresh_token.json aún. Visita /api/twitch/login para autorizar.')
  }
  const data = await readFile(filePath, 'utf-8')
  return JSON.parse(data).refresh_token
}

export async function setRefreshToken(token: string) {
  await writeFile(filePath, JSON.stringify({ refresh_token: token }))
}
