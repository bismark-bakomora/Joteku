import { createBrowserClient } from '@supabase/ssr';
import { supabaseKey, supabaseUrl } from './env';

// The client for components running in the browser. The session lives in cookies.
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseKey);
}
