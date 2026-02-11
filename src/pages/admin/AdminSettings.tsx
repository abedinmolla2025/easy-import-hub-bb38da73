import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect, useRef, useState, ChangeEvent } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import BackendHealthWidget from '@/components/BackendHealthWidget';
import { BrandingSeoImageManager } from '@/components/admin/BrandingSeoImageManager';
import { BrandingSeoLivePreview } from '@/components/admin/BrandingSeoLivePreview';
import { AppNameEditor } from '@/components/admin/AppNameEditor';
import { Loader2 } from 'lucide-react';

interface AppSettingRow {
  id: string;
  setting_key: string;
  setting_value: any;
}

const BRANDING_KEY = 'branding';
const THEME_KEY = 'theme';
const SEO_KEY = 'seo';
const SYSTEM_KEY = 'system';
const MODULES_KEY = 'modules';
const LEGAL_KEY = 'legal';

export default function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings } = useQuery<AppSettingRow[]>({
    queryKey: ['app-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('app_settings').select('*');
      if (error) throw error;
      return data as AppSettingRow[];
    },
  });

  const getValue = (key: string) =>
    settings?.find((s) => s.setting_key === key)?.setting_value ?? {};

  const [branding, setBranding] = useState(() => getValue(BRANDING_KEY));
  const [theme, setTheme] = useState(() => getValue(THEME_KEY));
  const [seo, setSeo] = useState(() => getValue(SEO_KEY));
  const [system, setSystem] = useState(() => ({
    maintenanceMode: false,
    showAds: false,
    forceUpdate: false,
    ...(getValue(SYSTEM_KEY) || {}),
  }));
  const [modules, setModules] = useState(() => ({
    prayerTimes: true,
    quran: true,
    duas: true,
    hadith: true,
    calendar: true,
    quiz: true,
    ...(getValue(MODULES_KEY) || {}),
  }));
  const [legal, setLegal] = useState(() => ({
    developerName: '',
    developerNameBn: '',
    contactEmail: '',
    country: '',
    countryBn: '',
    facebookUrl: '',
    whatsappUrl: '',
    websiteUrl: '',
    playStoreUrl: '',
    appStoreUrl: '',
    privacyPolicyLastUpdated: '',
    termsLastUpdated: '',
    legalVersionNumber: '',
    regionComplianceNote: '',
    ...(getValue(LEGAL_KEY) || {}),
  }));

  // Hydrate local form state after async settings load (only once)
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (!settings || hydratedRef.current) return;
    hydratedRef.current = true;

    setBranding(getValue(BRANDING_KEY));
    setTheme(getValue(THEME_KEY));
    setSeo(getValue(SEO_KEY));
    setSystem((prev) => ({
      ...prev,
      ...(getValue(SYSTEM_KEY) || {}),
    }));
    setModules((prev) => ({
      ...prev,
      ...(getValue(MODULES_KEY) || {}),
    }));
    setLegal((prev) => ({
      ...prev,
      ...(getValue(LEGAL_KEY) || {}),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const updateSettingMutation = useMutation({
    mutationFn: async ({
      key,
      value,
    }: {
      key: string;
      value: any;
    }) => {
      const { error } = await supabase
        .from('app_settings')
        .upsert(
          { setting_key: key, setting_value: value },
          {
            onConflict: 'setting_key',
          },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
      toast({ title: 'Settings updated' });
    },
    onError: (e: any) => {
      toast({
        title: 'Save failed',
        description: e?.message ?? 'Could not save settings',
        variant: 'destructive',
      });
    },
  });

  const handleSimpleChange = (
    updater: (value: any) => void,
    field: string,
  ) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      updater((prev: any) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSwitchChange = (
    updater: (value: any) => void,
    field: string,
  ) =>
    (checked: boolean) => {
      updater((prev: any) => ({ ...prev, [field]: checked }));
    };

  const handleModulesToggle = (field: keyof typeof modules) => (checked: boolean) => {
    setModules((prev) => ({ ...prev, [field]: checked }));
  };

  const handleSave = (key: string, value: any) => {
    updateSettingMutation.mutate({ key, value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Global App Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage branding, theme, SEO and system behavior for the entire app.
        </p>
      </div>

      <Tabs defaultValue="branding">
        <TabsList className="mb-4 flex h-auto w-full gap-1 overflow-x-auto p-1.5">
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="legal">Legal & Contact</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
        </TabsList>

        <TabsContent value="branding">
          <div className="space-y-6">
            <AppNameEditor branding={branding} onChange={setBranding} />

            <Card>
              <CardHeader>
                <CardTitle>Logo & Images</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <BrandingSeoImageManager
                    branding={branding}
                    setBranding={setBranding}
                    seo={seo}
                    setSeo={setSeo}
                    onAutoSaveSetting={(key, value) => {
                      updateSettingMutation.mutate({ key, value });
                    }}
                  />
                  <BrandingSeoLivePreview branding={branding} seo={seo} />
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={() => handleSave(BRANDING_KEY, branding)}
                    disabled={updateSettingMutation.isPending}
                  >
                    {updateSettingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save branding
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="theme">
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Colors are HSL values (e.g. <code>158 64% 35%</code>) that map directly to the
                Tailwind design tokens like <code>--primary</code>.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary color (HSL)</Label>
                  <Input
                    id="primaryColor"
                    value={theme.primaryColor || ''}
                    onChange={handleSimpleChange(setTheme, 'primaryColor')}
                    placeholder="158 64% 35%"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary color (HSL)</Label>
                  <Input
                    id="secondaryColor"
                    value={theme.secondaryColor || ''}
                    onChange={handleSimpleChange(setTheme, 'secondaryColor')}
                    placeholder="210 40% 96.1%"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Accent color (HSL)</Label>
                  <Input
                    id="accentColor"
                    value={theme.accentColor || ''}
                    onChange={handleSimpleChange(setTheme, 'accentColor')}
                    placeholder="45 93% 58%"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="borderRadius">Border radius (e.g. 1rem)</Label>
                  <Input
                    id="borderRadius"
                    value={theme.borderRadius || ''}
                    onChange={handleSimpleChange(setTheme, 'borderRadius')}
                    placeholder="1rem"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Default mode</Label>
                    <p className="text-sm text-muted-foreground">Light or dark on first load</p>
                  </div>
                  <Switch
                    checked={theme.defaultMode === 'dark'}
                    onCheckedChange={(checked) =>
                      setTheme((prev: any) => ({
                        ...prev,
                        defaultMode: checked ? 'dark' : 'light',
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSave(THEME_KEY, theme)}
                  disabled={updateSettingMutation.isPending}
                >
                  {updateSettingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save theme
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="seoTitle">Default title</Label>
                  <Input
                    id="seoTitle"
                    value={seo.title || ''}
                    onChange={handleSimpleChange(setSeo, 'title')}
                    placeholder="NOOR - Prayer Times, Quran & More"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seoDescription">Meta description</Label>
                  <Input
                    id="seoDescription"
                    value={seo.description || ''}
                    onChange={handleSimpleChange(setSeo, 'description')}
                    placeholder="Stay connected with your daily prayers..."
                  />
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Share image (OG), logo, icon, and favicon uploads are managed in the Branding tab → Image Manager.
              </p>

              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSave(SEO_KEY, seo)}
                  disabled={updateSettingMutation.isPending}
                >
                  {updateSettingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save SEO
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Show a maintenance banner for all users (frontend only)
                  </p>
                </div>
                <Switch
                  checked={system.maintenanceMode}
                  onCheckedChange={handleSwitchChange(setSystem, 'maintenanceMode')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Ads</Label>
                  <p className="text-sm text-muted-foreground">
                    Toggle ad placements across the app
                  </p>
                </div>
                <Switch
                  checked={system.showAds}
                  onCheckedChange={handleSwitchChange(setSystem, 'showAds')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Force Update</Label>
                  <p className="text-sm text-muted-foreground">
                    Signal clients that a hard refresh / app update is required
                  </p>
                </div>
                <Switch
                  checked={system.forceUpdate}
                  onCheckedChange={handleSwitchChange(setSystem, 'forceUpdate')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adsenseId">AdSense Publisher ID</Label>
                <Input
                  id="adsenseId"
                  value={system.adsensePublisherId || ''}
                  onChange={handleSimpleChange(setSystem, 'adsensePublisherId')}
                  placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                />
                <p className="text-sm text-muted-foreground">
                  AdSense স্ক্রিপ্ট শুধু ওয়েব ব্রাউজারে লোড হবে। খালি রাখলে AdSense নিষ্ক্রিয় থাকবে।
                </p>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSave(SYSTEM_KEY, system)}
                  disabled={updateSettingMutation.isPending}
                >
                  {updateSettingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save system
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules">
          <Card>
            <CardHeader>
              <CardTitle>Module Toggles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enable or disable major app modules. Disabled modules will be hidden from navigation
                and home screen entry points.
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Prayer Times</Label>
                    <p className="text-sm text-muted-foreground">Prayer times & Athan</p>
                  </div>
                  <Switch
                    checked={modules.prayerTimes}
                    onCheckedChange={handleModulesToggle('prayerTimes')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Quran</Label>
                    <p className="text-sm text-muted-foreground">Quran reader & audio</p>
                  </div>
                  <Switch
                    checked={modules.quran}
                    onCheckedChange={handleModulesToggle('quran')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Duas</Label>
                    <p className="text-sm text-muted-foreground">Daily & category based duas</p>
                  </div>
                  <Switch
                    checked={modules.duas}
                    onCheckedChange={handleModulesToggle('duas')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Hadith</Label>
                    <p className="text-sm text-muted-foreground">Bukhari & other collections</p>
                  </div>
                  <Switch
                    checked={modules.hadith}
                    onCheckedChange={handleModulesToggle('hadith')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Calendar</Label>
                    <p className="text-sm text-muted-foreground">Islamic calendar</p>
                  </div>
                  <Switch
                    checked={modules.calendar}
                    onCheckedChange={handleModulesToggle('calendar')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Daily Quiz</Label>
                    <p className="text-sm text-muted-foreground">Daily quiz module</p>
                  </div>
                  <Switch
                    checked={modules.quiz}
                    onCheckedChange={handleModulesToggle('quiz')}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSave(MODULES_KEY, modules)}
                  disabled={updateSettingMutation.isPending}
                >
                  {updateSettingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save modules
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legal">
          <Card>
            <CardHeader>
              <CardTitle>Legal & Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This data is used across Privacy Policy, Terms, About and Contact pages.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Developer Name (English)</Label>
                  <Input
                    value={legal.developerName || ''}
                    onChange={handleSimpleChange(setLegal, 'developerName')}
                    placeholder="ABEDIN MOLLA"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Developer Name (বাংলা)</Label>
                  <Input
                    value={legal.developerNameBn || ''}
                    onChange={handleSimpleChange(setLegal, 'developerNameBn')}
                    placeholder="আবিদিন মোল্লা"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input
                    value={legal.contactEmail || ''}
                    onChange={handleSimpleChange(setLegal, 'contactEmail')}
                    placeholder="noor.islamic.app@gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country (English)</Label>
                  <Input
                    value={legal.country || ''}
                    onChange={handleSimpleChange(setLegal, 'country')}
                    placeholder="India"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Country (বাংলা)</Label>
                  <Input
                    value={legal.countryBn || ''}
                    onChange={handleSimpleChange(setLegal, 'countryBn')}
                    placeholder="ভারত"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Website URL</Label>
                  <Input
                    value={legal.websiteUrl || ''}
                    onChange={handleSimpleChange(setLegal, 'websiteUrl')}
                    placeholder="https://noor-app.com"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Facebook URL</Label>
                  <Input
                    value={legal.facebookUrl || ''}
                    onChange={handleSimpleChange(setLegal, 'facebookUrl')}
                    placeholder="https://facebook.com/noor-app"
                  />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp URL</Label>
                  <Input
                    value={legal.whatsappUrl || ''}
                    onChange={handleSimpleChange(setLegal, 'whatsappUrl')}
                    placeholder="https://wa.me/91XXXXXXXXXX"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Play Store URL</Label>
                  <Input
                    value={legal.playStoreUrl || ''}
                    onChange={handleSimpleChange(setLegal, 'playStoreUrl')}
                    placeholder="https://play.google.com/store/apps/details?id=..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>App Store URL</Label>
                  <Input
                    value={legal.appStoreUrl || ''}
                    onChange={handleSimpleChange(setLegal, 'appStoreUrl')}
                    placeholder="https://apps.apple.com/app/..."
                  />
                </div>
              </div>

              <h3 className="text-sm font-semibold pt-2 border-t border-border">Compliance Fields</h3>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Privacy Policy Last Updated</Label>
                  <Input
                    value={legal.privacyPolicyLastUpdated || ''}
                    onChange={handleSimpleChange(setLegal, 'privacyPolicyLastUpdated')}
                    placeholder="2026-02-08"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Terms Last Updated</Label>
                  <Input
                    value={legal.termsLastUpdated || ''}
                    onChange={handleSimpleChange(setLegal, 'termsLastUpdated')}
                    placeholder="2026-02-08"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Legal Version</Label>
                  <Input
                    value={legal.legalVersionNumber || ''}
                    onChange={handleSimpleChange(setLegal, 'legalVersionNumber')}
                    placeholder="1.0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Region Compliance Note (optional)</Label>
                <Input
                  value={legal.regionComplianceNote || ''}
                  onChange={handleSimpleChange(setLegal, 'regionComplianceNote')}
                  placeholder="This app complies with Indian IT regulations..."
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => handleSave(LEGAL_KEY, legal)}
                  disabled={updateSettingMutation.isPending}
                >
                  {updateSettingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Legal & Contact
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health">
          <BackendHealthWidget />
        </TabsContent>
      </Tabs>
    </div>
  );
}
