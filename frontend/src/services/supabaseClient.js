

import { createClient } from "@supabase/supabase-js";
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase env variables missing");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // هذا يمنع تراكم sessions متعارضة
    storageKey: "motherhood-auth-v2",
    // ← يمنع تعارض الـ locks بين instances متعددة
    flowType: "pkce",
  },
});

