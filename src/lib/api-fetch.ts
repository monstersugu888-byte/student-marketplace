import { supabase } from '@/lib/supabase/client';

/**
 * Attach the current Supabase access token to same-origin API requests.
 * Server routes must still verify the token and authorize the requested action.
 */
export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (data.session?.access_token) {
    headers.set('Authorization', `Bearer ${data.session.access_token}`);
  }
  return fetch(input, { ...init, headers, credentials: 'same-origin' });
}
