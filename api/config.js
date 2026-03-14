export default function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=300');
  return res.status(200).json({
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  });
}
