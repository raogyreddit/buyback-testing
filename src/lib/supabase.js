import { createClient } from '@supabase/supabase-js'

// Environment variables with fallback for local development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hfkmdctdpujhviwmribc.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhma21kY3RkcHVqaHZpd21yaWJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMzg3MTcsImV4cCI6MjA4NTkxNDcxN30.d-j0iJ3vxfmjsIio7JOTG-r7AyQPtB_lRL167dDKGyY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
