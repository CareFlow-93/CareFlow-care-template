export function cleanCenterName(name?: string | null) {
  if (!name) return ''
  return name.replace(/^[!?*]+/, '').trim()
}

export function parseAddress(address?: string | null) {
  if (!address) return { city: '', district: '', town: '' }

  const parts = address.split(' ')
  return {
    city: parts[0] || '',
    district: parts[1] || '',
    town: parts[2] || '',
  }
}