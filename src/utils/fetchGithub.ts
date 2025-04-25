import type { Contributor } from '@/types/index.d'

export const fetchGithub = async (repo: string): Promise<Array<Contributor>> => {
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}/contributors`)
    const contributors = (await response.json()) as Promise<Array<Contributor>>
    return contributors
  } catch (error) {
    console.error('Error fetching data:', error)
    return []
  }
}
