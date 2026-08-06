# Audio Feature Deployment Guide

এই গাইডটি অনুসরণ করে আপনি audio feature আপনার সাইটে deploy করতে পারবেন।

## ✅ সম্পন্ন কাজ

1. **Admin Panel Update**: Admin-এ audio embed code input field যোগ করা হয়েছে
2. **Public Page Update**: Story detail page-এ audio player render করা হয়েছে
3. **Import/Export Logic**: StoryImportPanel-এ audio_embed_code field যোগ করা হয়েছে
4. **Database Migration**: Migration file তৈরি করা হয়েছে

## 📋 Deployment Steps

### Step 1: Database Migration Apply করুন

**মোবাইল থেকে:**

1. আপনার Supabase Dashboard খুলুন:
   - URL: `https://app.supabase.com/project/llicfiepatzgllmjhzbw/sql/new`

2. নতুন SQL Query window-এ এই SQL paste করুন:

```sql
ALTER TABLE public.admin_content
ADD COLUMN IF NOT EXISTS audio_embed_code TEXT;

COMMENT ON COLUMN public.admin_content.audio_embed_code IS 'HTML iframe embed code for audio player (e.g., SoundCloud embed)';
```

3. **Run** বাটন ক্লিক করুন

4. সাফল্যের বার্তা দেখবেন: `Query executed successfully`

### Step 2: Code Push করুন

**Option A: GitHub Desktop (যদি আপনার মোবাইলে থাকে)**
- Repository খুলুন
- Changes দেখবেন
- Commit message: "Add audio embed feature"
- Push করুন

**Option B: GitHub Web (সবচেয়ে সহজ)**
1. GitHub repository খুলুন: `https://github.com/abedinmolla2025/easy-imports-d6a8b889`
2. Branch selector থেকে `main` select করুন
3. "Add file" → "Upload files" ক্লিক করুন
4. এই ফাইলগুলো upload করুন:
   - `src/components/admin/story/StoryAudioEmbedInput.tsx`
   - `supabase/migrations/20260806_add_audio_embed_code.sql`
   - `scripts/apply-audio-migration.js`

5. Updated files:
   - `src/pages/admin/AdminContent.tsx` (audio input field যোগ)
   - `src/pages/StoryDetailPage.tsx` (audio player render)
   - `src/components/admin/story/StoryImportPanel.tsx` (audio field support)

### Step 3: Vercel Deploy করুন

1. Vercel Dashboard খুলুন: `https://vercel.com/dashboard`
2. আপনার project খুলুন
3. **Deployments** tab-এ যান
4. সর্বশেষ deployment দেখবেন
5. যদি auto-deploy enable থাকে, নতুন deployment শুরু হবে
6. যদি না হয়, **Redeploy** ক্লিক করুন

### Step 4: Admin Panel-এ Audio Add করুন

1. আপনার সাইটের admin panel খুলুন
2. একটি story edit করুন
3. নতুন "Audio Embed Code" field দেখবেন
4. SoundCloud embed code paste করুন
5. Save করুন

**SoundCloud Embed Code কোথায় পাবেন:**
1. SoundCloud-এ আপনার track খুলুন
2. "Share" বাটন ক্লিক করুন
3. "Embed" tab খুলুন
4. iframe code কপি করুন
5. Admin panel-এ paste করুন

### Step 5: Public Page-এ Verify করুন

1. আপনার সাইটে story page খুলুন
2. Audio player দেখবেন (যদি embed code add করা থাকে)
3. Player test করুন - play/pause কাজ করবে

## 📁 নতুন/আপডেট করা ফাইল

### নতুন ফাইল:
```
src/components/admin/story/StoryAudioEmbedInput.tsx
supabase/migrations/20260806_add_audio_embed_code.sql
scripts/apply-audio-migration.js
```

### আপডেট করা ফাইল:
```
src/pages/admin/AdminContent.tsx
src/pages/StoryDetailPage.tsx
src/components/admin/story/StoryImportPanel.tsx
```

## 🔧 Troubleshooting

### সমস্যা: Audio field দেখা যাচ্ছে না

**সমাধান:**
1. Database migration apply করেছেন কিনা check করুন
2. Page refresh করুন (Ctrl+Shift+R বা Cmd+Shift+R)
3. Browser cache clear করুন

### সমস্যা: Audio player কাজ করছে না

**সমাধান:**
1. SoundCloud embed code সঠিক কিনা check করুন
2. Embed code-এ `https://` থাকবে
3. iframe tag থাকবে

### সমস্যা: Admin panel save করলে error

**সমাধান:**
1. Browser console খুলুন (F12)
2. Error message দেখুন
3. Database migration সঠিকভাবে apply হয়েছে কিনা check করুন

## 📊 Feature Summary

| Feature | Status | Location |
|---------|--------|----------|
| Admin Input Field | ✅ Done | AdminContent.tsx |
| Public Player | ✅ Done | StoryDetailPage.tsx |
| Import/Export | ✅ Done | StoryImportPanel.tsx |
| Database Column | ⏳ Pending | Supabase |
| Deployment | ⏳ Pending | GitHub + Vercel |

## 🎯 Next Steps

1. ✅ Database migration apply করুন
2. ✅ Code push করুন GitHub-এ
3. ✅ Vercel deploy করুন
4. ✅ Admin panel-এ audio add করুন
5. ✅ Public page-এ verify করুন

---

**প্রশ্ন থাকলে আমাকে জানান!**
