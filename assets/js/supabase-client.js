// Shared Supabase client for public site + admin panel.
// Anon key is safe to expose — access is gated by Row Level Security.
(function () {
  const SUPABASE_URL = 'https://czwrwzzcygvuizicjuxe.supabase.co';
  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6d3J3enpjeWd2dWl6aWNqdXhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3ODQzMDIsImV4cCI6MjA5MjM2MDMwMn0.ukIs9Z9gTLTwwWkCHFT6lIl2z_WOlVvt_Kgbq7ksDBA';

  if (!window.supabase) {
    console.error('Supabase JS library not loaded.');
    return;
  }
  window.benefitSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
})();
