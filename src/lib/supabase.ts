
import { createClient } from '@supabase/supabase-js'

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabaseUrl = (envUrl && envUrl !== 'your-supabase-url') ? envUrl : 'https://placeholder.supabase.co'
const supabaseAnonKey = (envKey && envKey !== 'your-supabase-anon-key') ? envKey : 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
