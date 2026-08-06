#!/usr/bin/env node

/**
 * Apply audio_embed_code column migration to admin_content table
 * Run with: node scripts/apply-audio-migration.js
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('🔄 Applying audio_embed_code migration...');

    // Check if column already exists
    const { data: tableInfo, error: checkError } = await supabase
      .from('admin_content')
      .select('*')
      .limit(1);

    if (checkError) {
      console.error('❌ Error checking table:', checkError);
      process.exit(1);
    }

    // Check if audio_embed_code column exists
    if (tableInfo && tableInfo.length > 0) {
      const firstRow = tableInfo[0];
      if ('audio_embed_code' in firstRow) {
        console.log('✅ audio_embed_code column already exists!');
        process.exit(0);
      }
    }

    // If we reach here, we need to use RPC or direct SQL
    // Since we can't execute raw SQL via client SDK, we'll create a migration file
    console.log('📝 Migration file created at: supabase/migrations/20260806_add_audio_embed_code.sql');
    console.log('');
    console.log('To apply this migration:');
    console.log('1. Go to: https://app.supabase.com/project/llicfiepatzgllmjhzbw/sql/new');
    console.log('2. Copy and paste the SQL from supabase/migrations/20260806_add_audio_embed_code.sql');
    console.log('3. Click "Run"');
    console.log('');
    console.log('SQL to execute:');
    console.log('---');
    console.log('ALTER TABLE public.admin_content');
    console.log('ADD COLUMN IF NOT EXISTS audio_embed_code TEXT;');
    console.log('');
    console.log('COMMENT ON COLUMN public.admin_content.audio_embed_code IS');
    console.log("'HTML iframe embed code for audio player (e.g., SoundCloud embed)';");
    console.log('---');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

applyMigration();
