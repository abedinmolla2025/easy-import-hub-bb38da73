import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Call the database function to get the next smart notification
    const { data: notification, error: fnError } = await supabase
      .rpc("get_next_smart_notification")
      .single();

    if (fnError) throw fnError;
    if (!notification) return new Response(JSON.stringify({ message: "No notification to send" }), { status: 200 });

    console.log(`Sending notification: ${notification.title}`);

    // Fetch all active web push tokens
    const { data: tokens, error: tokenError } = await supabase
      .from("push_tokens")
      .select("token")
      .eq("platform", "web");

    if (tokenError) throw tokenError;
    if (!tokens || tokens.length === 0) return new Response(JSON.stringify({ message: "No subscribers found" }), { status: 200 });

    // In a real production scenario, we would send to FCM/WebPush here.
    // For now, we log the intent. The get_next_smart_notification function 
    // already logged the delivery in notification_logs.
    
    return new Response(JSON.stringify({ 
      success: true, 
      notification, 
      recipientCount: tokens.length 
    }), { 
      headers: { "Content-Type": "application/json" } 
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
