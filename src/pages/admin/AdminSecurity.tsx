import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Shield,
  Key,
  Mail,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Lock,
  History,
} from "lucide-react";

interface SecurityConfig {
  id: number;
  admin_email: string;
  passcode_hash: string | null;
  require_fingerprint: boolean;
  created_at: string;
  updated_at: string;
}

interface UnlockAttempt {
  id: string;
  created_at: string;
  success: boolean;
  device_fingerprint: string | null;
  ip: string | null;
}

const AdminSecurity = () => {
  const [config, setConfig] = useState<SecurityConfig | null>(null);
  const [attempts, setAttempts] = useState<UnlockAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [adminEmail, setAdminEmail] = useState("");
  const [newPasscode, setNewPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [requireFingerprint, setRequireFingerprint] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    // Load security config
    const { data: configData, error: configError } = await supabase
      .from("admin_security_config")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (configError) {
      console.error("Error loading security config", configError);
    } else if (configData) {
      setConfig(configData);
      setAdminEmail(configData.admin_email);
      setRequireFingerprint(configData.require_fingerprint);
    }

    // Load recent unlock attempts
    const { data: attemptsData, error: attemptsError } = await supabase
      .from("admin_unlock_attempts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (attemptsError) {
      console.error("Error loading unlock attempts", attemptsError);
    } else {
      setAttempts(attemptsData ?? []);
    }

    setLoading(false);
  };

  const handleSaveEmail = async () => {
    if (!adminEmail.trim()) {
      toast.error("ইমেইল দিন");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("admin_security_config")
      .update({ admin_email: adminEmail.trim(), updated_at: new Date().toISOString() })
      .eq("id", 1);

    setSaving(false);

    if (error) {
      console.error("Error saving email", error);
      toast.error("ইমেইল সেভ করতে ব্যর্থ হয়েছে");
    } else {
      toast.success("অ্যাডমিন ইমেইল আপডেট হয়েছে");
      loadData();
    }
  };

  const handleChangePasscode = async () => {
    if (!newPasscode || newPasscode.length < 6) {
      toast.error("পাসকোড কমপক্ষে ৬ ডিজিটের হতে হবে");
      return;
    }

    if (newPasscode !== confirmPasscode) {
      toast.error("পাসকোড মিলছে না");
      return;
    }

    setSaving(true);
    const { error } = await supabase.rpc("update_admin_passcode", {
      new_passcode: newPasscode,
    });

    setSaving(false);

    if (error) {
      console.error("Error changing passcode", error);
      toast.error("পাসকোড পরিবর্তন করতে ব্যর্থ হয়েছে");
    } else {
      toast.success("পাসকোড পরিবর্তন হয়েছে");
      setNewPasscode("");
      setConfirmPasscode("");
      loadData();
    }
  };

  const handleToggleFingerprint = async (value: boolean) => {
    setRequireFingerprint(value);
    
    const { error } = await supabase
      .from("admin_security_config")
      .update({ require_fingerprint: value, updated_at: new Date().toISOString() })
      .eq("id", 1);

    if (error) {
      console.error("Error updating fingerprint setting", error);
      toast.error("সেটিং আপডেট করতে ব্যর্থ হয়েছে");
      setRequireFingerprint(!value);
    } else {
      toast.success(value ? "ফিঙ্গারপ্রিন্ট ভেরিফিকেশন চালু হয়েছে" : "ফিঙ্গারপ্রিন্ট ভেরিফিকেশন বন্ধ হয়েছে");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Security</h1>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const failedAttempts = attempts.filter((a) => !a.success);
  const successfulAttempts = attempts.filter((a) => a.success);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Security</h1>
        <p className="text-muted-foreground">অ্যাডমিন প্যানেলের সিকিউরিটি সেটিংস</p>
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            {config?.passcode_hash ? (
              <CheckCircle2 className="h-8 w-8 text-primary" />
            ) : (
              <AlertTriangle className="h-8 w-8 text-destructive" />
            )}
            <div>
              <p className="text-sm font-medium">Passcode</p>
              <p className="text-xs text-muted-foreground">
                {config?.passcode_hash ? "সেট করা আছে" : "সেট করা নেই"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Mail className="h-8 w-8 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Admin Email</p>
              <p className="truncate text-xs text-muted-foreground">{config?.admin_email}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm font-medium">Fingerprint</p>
              <p className="text-xs text-muted-foreground">
                {config?.require_fingerprint ? "চালু" : "বন্ধ"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Last Updated</p>
              <p className="text-xs text-muted-foreground">
                {config?.updated_at
                  ? new Date(config.updated_at).toLocaleDateString("bn-BD")
                  : "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Admin Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" /> Admin Email
            </CardTitle>
            <CardDescription>পাসকোড রিসেট কোড এই ইমেইলে পাঠানো হবে</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Email Address</Label>
              <Input
                id="adminEmail"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@example.com"
              />
            </div>
            <Button onClick={handleSaveEmail} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              সেভ করুন
            </Button>
          </CardContent>
        </Card>

        {/* Change Passcode */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" /> Change Passcode
            </CardTitle>
            <CardDescription>অ্যাডমিন আনলক পাসকোড পরিবর্তন করুন</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPasscode">New Passcode</Label>
              <Input
                id="newPasscode"
                type="password"
                value={newPasscode}
                onChange={(e) => setNewPasscode(e.target.value)}
                placeholder="নতুন পাসকোড"
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPasscode">Confirm Passcode</Label>
              <Input
                id="confirmPasscode"
                type="password"
                value={confirmPasscode}
                onChange={(e) => setConfirmPasscode(e.target.value)}
                placeholder="পাসকোড নিশ্চিত করুন"
                minLength={6}
              />
            </div>
            <Button onClick={handleChangePasscode} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              পাসকোড পরিবর্তন করুন
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Security Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" /> Security Options
          </CardTitle>
          <CardDescription>অতিরিক্ত সিকিউরিটি অপশনস</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Device Fingerprint Verification</Label>
              <p className="text-sm text-muted-foreground">
                শুধুমাত্র পরিচিত ডিভাইস থেকে লগইন অনুমতি দিন
              </p>
            </div>
            <Switch
              checked={requireFingerprint}
              onCheckedChange={handleToggleFingerprint}
            />
          </div>
        </CardContent>
      </Card>

      {/* Unlock Attempts History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" /> Recent Unlock Attempts
          </CardTitle>
          <CardDescription>
            সাম্প্রতিক অ্যাডমিন আনলক প্রচেষ্টা (
            <span className="text-primary">{successfulAttempts.length} successful</span>,{" "}
            <span className="text-destructive">{failedAttempts.length} failed</span>)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attempts.length === 0 ? (
            <p className="text-sm text-muted-foreground">কোনো প্রচেষ্টা নেই</p>
          ) : (
            <div className="space-y-2">
              {attempts.slice(0, 10).map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    {attempt.success ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {attempt.success ? "সফল" : "ব্যর্থ"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(attempt.created_at).toLocaleString("bn-BD")}
                      </p>
                    </div>
                  </div>
                  <Badge variant={attempt.success ? "default" : "destructive"}>
                    {attempt.success ? "Success" : "Failed"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSecurity;
