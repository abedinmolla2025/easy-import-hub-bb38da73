import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Power, PowerOff } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SplashScreenPreview } from './SplashScreenPreview';

interface SplashScreen {
  id: string;
  title: string;
  lottie_url: string;
  duration: number;
  fade_out_duration: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  priority: number;
  platform: string;
}

const STORAGE_KEY = 'noor_splash_screens';

function getStoredSplashScreens(): SplashScreen[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveSplashScreens(screens: SplashScreen[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(screens));
}

export function SplashScreensManager() {
  const { toast } = useToast();
  const [splashScreens, setSplashScreens] = useState<SplashScreen[]>(getStoredSplashScreens);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleCreateNew = () => {
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    const newSplash: SplashScreen = {
      id: crypto.randomUUID(),
      title: 'New Splash Screen',
      lottie_url: '',
      duration: 3000,
      fade_out_duration: 500,
      start_date: today,
      end_date: nextMonth.toISOString().split('T')[0],
      is_active: false,
      priority: 0,
      platform: 'both',
    };

    const updated = [...splashScreens, newSplash];
    setSplashScreens(updated);
    saveSplashScreens(updated);
    toast({ title: 'Splash screen created' });
  };

  const handleUpdate = (id: string, updates: Partial<SplashScreen>) => {
    const updated = splashScreens.map(s => s.id === id ? { ...s, ...updates } : s);
    setSplashScreens(updated);
    saveSplashScreens(updated);
    toast({ title: 'Splash screen updated' });
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    const updated = splashScreens.filter(s => s.id !== id);
    setSplashScreens(updated);
    saveSplashScreens(updated);
    toast({ title: 'Splash screen deleted' });
  };

  const toggleAll = (enable: boolean) => {
    const updated = splashScreens.map(s => ({ ...s, is_active: enable }));
    setSplashScreens(updated);
    saveSplashScreens(updated);
    toast({ 
      title: enable ? 'All splash screens enabled' : 'All splash screens disabled',
    });
  };

  const activeCount = splashScreens.filter(s => s.is_active).length;
  const hasAny = splashScreens.length > 0;

  return (
    <div className="space-y-6">
      {/* Global Status Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className={`h-3 w-3 rounded-full ${activeCount > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <div>
            <p className="font-medium text-sm sm:text-base">
              {activeCount > 0 ? `${activeCount} Splash Screen${activeCount > 1 ? 's' : ''} Active` : 'All Splash Screens Disabled'}
            </p>
            <p className="text-xs text-muted-foreground">
              {activeCount > 0 
                ? 'Users will see splash screens based on schedule and platform'
                : 'No splash screens are currently shown to users'}
            </p>
          </div>
        </div>
        {hasAny && (
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant={activeCount > 0 ? "outline" : "default"}
              size="sm"
              className="gap-2 flex-1 sm:flex-none"
              onClick={() => toggleAll(true)}
            >
              <Power className="h-4 w-4" />
              <span className="hidden sm:inline">Enable All</span>
              <span className="sm:hidden">Enable</span>
            </Button>
            <Button
              variant={activeCount > 0 ? "destructive" : "outline"}
              size="sm"
              className="gap-2 flex-1 sm:flex-none"
              onClick={() => toggleAll(false)}
            >
              <PowerOff className="h-4 w-4" />
              <span className="hidden sm:inline">Disable All</span>
              <span className="sm:hidden">Disable</span>
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="w-full sm:w-auto">
          <h2 className="text-xl sm:text-2xl font-bold">Splash Screens</h2>
          <p className="text-sm text-muted-foreground">
            Manage multiple splash screens for different occasions and events
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Create Custom</span>
          <span className="sm:hidden">Custom</span>
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {splashScreens.filter((s) => s.is_active && new Date(s.start_date) <= new Date() && new Date(s.end_date) >= new Date()).map((splash) => (
            <SplashScreenCard
              key={splash.id}
              splash={splash}
              isEditing={editingId === splash.id}
              onEdit={() => setEditingId(splash.id)}
              onUpdate={(updates) => handleUpdate(splash.id, updates)}
              onDelete={() => handleDelete(splash.id)}
            />
          ))}
          {splashScreens.filter((s) => s.is_active && new Date(s.start_date) <= new Date() && new Date(s.end_date) >= new Date()).length === 0 && (
            <p className="text-center text-muted-foreground py-8">No active splash screens</p>
          )}
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          {splashScreens.filter((s) => new Date(s.start_date) > new Date()).map((splash) => (
            <SplashScreenCard
              key={splash.id}
              splash={splash}
              isEditing={editingId === splash.id}
              onEdit={() => setEditingId(splash.id)}
              onUpdate={(updates) => handleUpdate(splash.id, updates)}
              onDelete={() => handleDelete(splash.id)}
            />
          ))}
          {splashScreens.filter((s) => new Date(s.start_date) > new Date()).length === 0 && (
            <p className="text-center text-muted-foreground py-8">No scheduled splash screens</p>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {splashScreens.map((splash) => (
            <SplashScreenCard
              key={splash.id}
              splash={splash}
              isEditing={editingId === splash.id}
              onEdit={() => setEditingId(splash.id)}
              onUpdate={(updates) => handleUpdate(splash.id, updates)}
              onDelete={() => handleDelete(splash.id)}
            />
          ))}
          {splashScreens.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No splash screens. Create one to get started.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SplashScreenCard({
  splash,
  isEditing,
  onEdit,
  onUpdate,
  onDelete,
}: {
  splash: SplashScreen;
  isEditing: boolean;
  onEdit: () => void;
  onUpdate: (updates: Partial<SplashScreen>) => void;
  onDelete: () => void;
}) {
  const [localData, setLocalData] = useState(splash);

  const handleSave = () => {
    onUpdate(localData);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <CardTitle className="text-lg">{splash.title}</CardTitle>
            {splash.is_active ? (
              <Badge variant="default" className="gap-1">
                <Power className="h-3 w-3" />
                Active
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <PowerOff className="h-3 w-3" />
                Inactive
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-muted/50 px-2 sm:px-3 py-1.5 rounded-md flex-1 sm:flex-none justify-center">
              <span className="text-xs font-medium text-muted-foreground">
                {splash.is_active ? 'Enabled' : 'Disabled'}
              </span>
              <Switch
                checked={splash.is_active}
                onCheckedChange={(checked) => onUpdate({ is_active: checked })}
              />
            </div>
            <Button variant="ghost" size="sm" onClick={onEdit}>
              Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={localData.title}
                  onChange={(e) => setLocalData({ ...localData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select
                  value={localData.platform}
                  onValueChange={(value) => setLocalData({ ...localData, platform: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="web">Web</SelectItem>
                    <SelectItem value="app">App</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={localData.start_date.split('T')[0]}
                  onChange={(e) => setLocalData({ ...localData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={localData.end_date.split('T')[0]}
                  onChange={(e) => setLocalData({ ...localData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Duration (ms)</Label>
                <Input
                  type="number"
                  value={localData.duration}
                  onChange={(e) => setLocalData({ ...localData, duration: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Fade Out (ms)</Label>
                <Input
                  type="number"
                  value={localData.fade_out_duration}
                  onChange={(e) => setLocalData({ ...localData, fade_out_duration: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Input
                  type="number"
                  value={localData.priority}
                  onChange={(e) => setLocalData({ ...localData, priority: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Lottie URL</Label>
              <Input
                value={localData.lottie_url}
                onChange={(e) => setLocalData({ ...localData, lottie_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave}>Save Changes</Button>
              <Button variant="outline" onClick={() => setLocalData(splash)}>Cancel</Button>
            </div>
          </>
        ) : (
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform:</span>
              <span className="capitalize">{splash.platform}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration:</span>
              <span>{splash.duration}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Schedule:</span>
              <span>{splash.start_date} → {splash.end_date}</span>
            </div>
            {splash.lottie_url && (
              <div className="mt-4">
                <SplashScreenPreview 
                  lottieUrl={splash.lottie_url} 
                  duration={splash.duration}
                  fadeOutDuration={splash.fade_out_duration}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
