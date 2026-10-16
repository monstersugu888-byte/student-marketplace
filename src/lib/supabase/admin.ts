import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/**
 * Resolve configuration only when an API handler actually uses the admin
 * client. Never throw during module import/build-time introspection.
 */
function getClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Supabase server configuration is missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the Vercel environment for this deployment.'
    );
  }

  if (!client) {
    client = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }

  return client;
}

/**
 * Lazy server-only Supabase client. The special "then" case is important:
 * Promise/module loaders probe imported values for a thenable. Returning
 * undefined here prevents that probe from initializing the client (and
 * throwing for absent runtime secrets) during the Next.js build.
 */
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, property) {
    if (property === 'then') return undefined;
    if (property === Symbol.toStringTag) return 'SupabaseClient';

    const instance = getClient();
    const value = Reflect.get(instance, property, instance);
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});
