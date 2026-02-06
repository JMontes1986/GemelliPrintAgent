const ensureLeadingSlash = (path: string) =>
  path.startsWith('/') ? path : `/${path}`

export const getApiUrl = (path: string) => {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL

  if (!apiBaseUrl) {
    return ensureLeadingSlash(path)
  }

  return new URL(ensureLeadingSlash(path), apiBaseUrl).toString()
}
