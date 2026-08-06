# 🎵 Audio Feature - Quick Reference

## ✅ সম্পন্ন:
- ✅ Code pushed to GitHub
- ⏳ Database migration apply
- ⏳ Vercel deploy
- ⏳ Admin panel test
- ⏳ Public page verify

## 🔗 Important Links

| Link | Purpose |
|------|---------|
| https://app.supabase.com/project/llicfiepatzgllmjhzbw/sql/new | Database Migration |
| https://vercel.com/dashboard | Deploy Status |
| https://noorapp.in/admin | Admin Panel |
| https://noorapp.in/stories | Story List |
| https://github.com/abedinmolla2025/easy-imports-d6a8b889 | GitHub Repository |

## 📝 Database Migration SQL

```sql
ALTER TABLE public.admin_content
ADD COLUMN IF NOT EXISTS audio_embed_code TEXT;

COMMENT ON COLUMN public.admin_content.audio_embed_code IS 'HTML iframe embed code for audio player (e.g., SoundCloud embed)';
```

## 🎯 How to Add Audio to a Story

1. Go to Admin Panel: https://noorapp.in/admin
2. Find and edit a story
3. Scroll down to find "Audio Embed Code" field
4. Paste SoundCloud iframe code
5. Click Save

## 🔊 How to Get SoundCloud Embed Code

1. Go to https://soundcloud.com
2. Upload or find your audio
3. Click "Share" button
4. Click "Embed" tab
5. Copy the iframe code
6. Paste in Admin Panel

## 🎬 Example SoundCloud Embed Code

```html
<iframe width="100%" height="300" scrolling="no" frameborder="no" allow="autoplay; encrypted-media" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/YOUR_TRACK_ID&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true"></iframe>
```

## 📱 Mobile Friendly

- Audio player is responsive
- Works on all devices
- Auto-adjusts to screen size

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Audio field not showing | Refresh page, clear cache |
| Audio player not working | Check embed code is valid |
| Save button not working | Check database migration applied |
| Player not responsive | Check Vercel deployment completed |

## 📊 Files Changed

### New Files:
- `src/components/admin/story/StoryAudioEmbedInput.tsx`
- `supabase/migrations/20260806_add_audio_embed_code.sql`
- `scripts/apply-audio-migration.js`

### Updated Files:
- `src/pages/admin/AdminContent.tsx` - Added audio input
- `src/pages/StoryDetailPage.tsx` - Added audio player
- `src/components/admin/story/StoryImportPanel.tsx` - Added audio field support

## 🚀 Deployment Checklist

- [ ] Database migration applied
- [ ] Vercel deployment completed
- [ ] Admin panel shows audio field
- [ ] Can save audio embed code
- [ ] Public page shows audio player
- [ ] Audio player works on mobile
- [ ] Audio player works on desktop

---

**Last Updated:** August 6, 2026
**Status:** Ready for Deployment
