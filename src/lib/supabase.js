import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://kxlvdhofagbseytqqegm.supabase.co',
  'sb_publishable_wQEIXLTw60ap2HxgpCkUbg_wpA0Auiw',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      lockAcquireTimeout: 3000
    }
  }
);

const PRODUCTION_APP_URL = 'https://artyommakarov03-code.github.io/academy-makarov/';

export const appRedirectUrl = ({ recovery = false } = {}) =>
  `${PRODUCTION_APP_URL}${recovery ? '?recovery=1' : ''}`;
