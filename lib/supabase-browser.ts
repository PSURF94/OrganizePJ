import { createBrowserClient } from '@supabase/ssr'

// Public values — safe to hardcode in the client bundle
const SUPABASE_URL = 'https://ylasrgswpybznngjhrmc.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsYXNyZ3N3cHliem5uZ2pocm1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NTE4NDMsImV4cCI6MjA5NjAyNzg0M30.huqPr3ZDyHQC6F0Ef_1cUKiPFkRXPB2NfaIZiwASZGQ'

export function getBrowserSupabase() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
