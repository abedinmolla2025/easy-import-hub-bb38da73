import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type {
  BrandingSettings,
  ThemeSettings,
  SeoSettings,
  SystemSettings,
  ModuleToggles,
  AppSettingKey,
} from "@/context/GlobalConfigContext";

type SettingsMap = {
  branding: BrandingSettings;
  theme: ThemeSettings;
  seo: SeoSettings;
  system: SystemSettings;
  modules: ModuleToggles;
};

export function useAppSettings<K extends AppSettingKey>(key: K) {
  const [data, setData] = useState<SettingsMap[K] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data: row, error } = await supabase
        .from("app_settings")
        .select("setting_value")
        .eq("setting_key", key)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error(`Error loading ${key}`, error);
        setData({} as SettingsMap[K]);
      } else {
        setData((row?.setting_value as SettingsMap[K]) ?? ({} as SettingsMap[K]));
      }
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [key]);

  const save = useCallback(
    async (value: SettingsMap[K]) => {
      setSaving(true);
      const { error } = await supabase
        .from("app_settings")
        .upsert(
          { setting_key: key, setting_value: value as any, updated_at: new Date().toISOString() },
          { onConflict: "setting_key" }
        );

      setSaving(false);

      if (error) {
        console.error(`Error saving ${key}`, error);
        toast.error("সেটিংস সেভ করতে ব্যর্থ হয়েছে");
        return false;
      }

      setData(value);
      toast.success("সেটিংস সেভ হয়েছে");
      return true;
    },
    [key]
  );

  return { data, loading, saving, save, setData };
}
