import { cleanCenterName } from './center-utils'

export function createNaverMapLink(name?: string | null, address?: string | null) {
  const cleanedName = cleanCenterName(name)
  const query = [cleanedName, address?.trim()].filter(Boolean).join(' ')

  return `https://map.naver.com/v5/search/${encodeURIComponent(query)}`
}
