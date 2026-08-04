import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://kxlvdhofagbseytqqegm.supabase.co',
  'sb_publishable_wQEIXLTw60ap2HxgpCkUbg_wpA0Auiw',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

export const appRedirectUrl = () =>
  `${window.location.origin}${window.location.pathname}`;
