import { promises as fs } from 'fs'
import path from 'path'

const TOKEN_FILE = path.resolve('./refresh_token.json')

export async function getRefreshToken(): Promise<string> {
  try {
    const txt = await fs.readFile(TOKEN_FILE, 'utf-8')
    const { refresh_token } = JSON.parse(txt)
    if (!refresh_token) throw new Error('No hay refresh_token')
    return refresh_token
  } catch (err) {
    throw new Error('Error leyendo refresh token: ' + err)
  }
}

export async function setRefreshToken(refresh_token: string): Promise<void> {
  const payload = { refresh_token }
  await fs.writeFile(TOKEN_FILE, JSON.stringify(payload, null, 2), 'utf-8')
}
