export function formatDate(value?: string) {
  if (!value) return "Unavailable"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "Unavailable" : date.toLocaleString()
}

export function formatUptime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  if (minutes < 1) return "Less than a minute"
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  return `${minutes}m`
}
