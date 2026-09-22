/** The build injects only the public API URL, never provider or AWS credentials. */
export const apiUrl = (path: string) => {
  const base = import.meta.env?.VITE_API_BASE_URL?.replace(/\/$/, '') || ''
  return `${base}${path}`
}
