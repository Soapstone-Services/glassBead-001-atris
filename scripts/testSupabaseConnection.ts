import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '../.env.local');
console.log('Attempting to load .env.local from:', envPath);

if (fs.existsSync(envPath)) {
  console.log('.env.local file found');
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
} else {
  console.log('.env.local file not found');
}

console.log('Environment variables after manual loading:');
console.log('PUBLIC_SUPABASE_URL:', process.env.PUBLIC_SUPABASE_URL ? '[REDACTED]' : 'undefined');
console.log('SUPABASE_PRIVATE_KEY:', process.env.SUPABASE_PRIVATE_KEY ? '[REDACTED]' : 'undefined');

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PRIVATE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or key is missing in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    const { data, error } = await supabase.from('playlists').select('*').limit(1);
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Connected successfully:', data);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testConnection();