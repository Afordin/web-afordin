import type { Contributor } from '@/types/index.d'

export const fetchGithub = async (repo: string): Promise<Contributor[]> => {
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}/contributors`)
    const contributors = await response.json()
    return contributors
  } catch (error) {
    console.error('Error fetching data:', error)
    return []
  }
}
