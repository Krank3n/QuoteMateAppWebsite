const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://us-central1-hansendev.cloudfunctions.net'
).replace(/\/$/, '');

type FormEndpoint = 'websiteContact' | 'websiteSubscribe';

export async function submitWebsiteForm(
  endpoint: FormEndpoint,
  body: Record<string, string>,
): Promise<{ ok: boolean; error?: string }> {
  const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const result = await response.json().catch(() => null) as { error?: string } | null;
  return {
    ok: response.ok,
    error: result?.error,
  };
}
