export interface JsonResponse<T> {
  ok: boolean
  status: number
  data: T | null
}

export async function requestJson<T>(
  fetcher: typeof fetch,
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<JsonResponse<T>> {
  const response = await fetcher(input, init)
  let data: T | null = null
  try {
    const text = await response.text()
    if (text) data = JSON.parse(text) as T
  } catch {
    data = null
  }
  return { ok: response.ok, status: response.status, data }
}
