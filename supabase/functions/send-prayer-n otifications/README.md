# Send Prayer Notifications

Scheduled edge function that automatically sends prayer time notifications based on user preferences and location.

## Features

- Calculates prayer times using Aladhan API
- Supports multiple calculation methods (MWL, ISNA, Egypt, Makkah, Karachi, Tehran, Jafari)
- Sends notifications 0-5 minutes before prayer time
- Prevents duplicate notifications per day
- Supports notification offset (send X minutes before/after)

## Setup

### 1. Deploy the function
The function deploys automatically.

### 2. Set up cron job
Run this SQL in Supabase SQL Editor to schedule the function to run every 5 minutes:

```sql
select cron.schedule(
  'send-prayer-notifications-every-5min',
  '*/5 * * * *', -- every 5 minutes
  $$
  select
    net.http_post(
        url:='https://fdtpzwtzljseyoqhgeyv.supabase.co/functions/v1/send-prayer-notifications',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);
```

**Replace `YOUR_SERVICE_ROLE_KEY` with your actual service role key.**

### 3. Enable required extensions
Make sure these extensions are enabled in your Supabase project:
- `pg_cron` (for scheduling)
- `pg_net` (for HTTP requests)

## How it works

1. Runs every 5 minutes via cron
2. Fetches all enabled user notification preferences
3. For each preference:
   - Calculates prayer times based on location and method
   - Checks if any enabled prayer is within the notification window
   - Verifies notification hasn't been sent today
   - Creates and sends push notification
   - Logs the sent notification to prevent duplicates

## User Preferences

Users can configure:
- Location (latitude/longitude)
- Calculation method
- Which prayers to get notifications for
- Notification offset (minutes before/after prayer time)
- Enable/disable notifications

## API

The function doesn't require any body parameters. It can be called manually for testing:

```bash
curl -X POST https://fdtpzwtzljseyoqhgeyv.supabase.co/functions/v1/send-prayer-notifications \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```
