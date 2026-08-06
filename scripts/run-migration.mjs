#!/usr/bin/env node

/**
 * Migration Runner - Execute audio_embed_code migration
 * Run with: node scripts/run-migration.mjs
 * 
 * This script connects to Supabase and applies the audio_embed_code migration
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumnExists() {
  try {
    // Try to query the table to check if column exists
    const { data, error } = await supabase
      .from('admin_content')
      .select('audio_embed_code')
      .limit(1);

    if (error && error.message.includes('column')) {
      return false; // Column doesn't exist
    }
    
    return true; // Column exists
  } catch (err) {
    return false;
  }
}

async function runMigration() {
  try {
    console.log('🔄 Checking if migration is needed...\n');

    const columnExists = await checkColumnExists();

    if (columnExists) {
      console.log('✅ audio_embed_code column already exists!');
      console.log('✅ Migration is already applied.\n');
      process.exit(0);
    }

    console.log('⚠️  audio_embed_code column not found.');
    console.log('📝 Migration needs to be applied manually via Supabase Dashboard.\n');
    
    console.log('📋 To apply the migration:');
    console.log('1. Go to: https://app.supabase.com/project/llicfiepatzgllmjhzbw/sql/new');
    console.log('2. Copy and paste this SQL:\n');
    
    const sql = `ALTER TABLE public.admin_content
ADD COLUMN IF NOT EXISTS audio_embed_code TEXT;

COMMENT ON COLUMN public.admin_content.audio_embed_code IS 'HTML iframe embed code for audio player (e.g., SoundCloud embed)';`;

    console.log('---');
    console.log(sql);
    console.log('---\n');
    
    console.log('3. Click "Run" to execute');
    console.log('4. After applying, run this script again to verify.\n');

    process.exit(1);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

console.log('🎵 Audio Feature Migration Runner\n');
runMigration();
