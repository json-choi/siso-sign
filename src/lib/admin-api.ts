/** Fetches an admin API route and throws the server's message on failure. */
export async function adminRequest<T>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: json === undefined ? rest.headers : { 'Content-Type': 'application/json', ...rest.headers },
      body: json === undefined ? rest.body : JSON.stringify(json),
    });
  } catch {
    throw new Error('네트워크 연결을 확인해주세요.');
  }

  if (response.status === 401) {
    window.location.assign(`/admin?redirect=${encodeURIComponent(window.location.pathname)}`);
    throw new Error('로그인이 만료되었습니다.');
  }

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data && typeof data === 'object' && 'error' in data && typeof data.error === 'string' ? data.error : null;
    throw new Error(message ?? `요청에 실패했습니다. (${response.status})`);
  }
  return data as T;
}

export function errorMessage(error: unknown, fallback = '문제가 발생했습니다.'): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
