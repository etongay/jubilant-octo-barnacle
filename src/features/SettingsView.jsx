import { useState } from 'react';
import { db, settings } from '@/lib/db.js';
import { announce } from '@/lib/announce.js';
import { testRavelry } from '@/lib/ravelry.js';
import { applyTheme } from '@/App.jsx';
import { applyPlatform, detectPlatform } from '@/lib/platform.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const THEMES = [
  { id: 'hearth', label: 'Hearth', dot: '#f6efe6' },
  { id: 'meadow', label: 'Meadow', dot: '#edf1e4' },
  { id: 'lavender', label: 'Lavender', dot: '#efecf5' },
  { id: 'terracotta', label: 'Terracotta', dot: '#E07A5F' },
  { id: 'night', label: 'Night', dot: '#211e1a' },
  { id: 'contrast', label: 'High contrast', dot: '#ffffff' },
];

export default function SettingsView({ navigate }) {
  const [theme, setTheme] = useState(settings.get('theme', 'hearth') || 'hearth');
  const [fontScale, setFontScale] = useState(String(settings.get('fontScale', 1)));
  const [ravUser, setRavUser] = useState(settings.get('ravUser', ''));
  const [ravPass, setRavPass] = useState(settings.get('ravPass', ''));
  const [goupcKey, setGoupcKey] = useState(settings.get('goupcKey', ''));
  const [ravStatus, setRavStatus] = useState('');
  const [platform, setPlatform] = useState(settings.get('platform', 'auto') || 'auto');

  const PLATFORM_LABELS = {
    cozy: 'Cozy classic', ios: 'iOS glass', material: 'Material (Android)',
  };

  return (
    <section aria-labelledby="settings-heading" className="grid gap-3">
      <h2 id="settings-heading" className="text-xl font-bold">Settings</h2>

      <Card>
        <CardHeader><CardTitle>Theme</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          <RadioGroup
            value={theme}
            onValueChange={(id) => {
              setTheme(id);
              applyTheme(id);
              announce(THEMES.find(t => t.id === id).label + ' theme applied');
            }}
            className="flex flex-wrap gap-2"
          >
            {THEMES.map(t => (
              <Label
                key={t.id}
                htmlFor={'theme-' + t.id}
                data-theme={t.id}
                className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border bg-card px-3.5 py-2 font-normal"
                style={{ background: 'var(--card)', color: 'var(--card-foreground)', borderColor: 'var(--border)' }}
              >
                <RadioGroupItem id={'theme-' + t.id} value={t.id} />
                {t.label}
              </Label>
            ))}
          </RadioGroup>
          <div className="grid gap-1.5">
            <Label htmlFor="app-style">App style</Label>
            <Select value={platform} onValueChange={(v) => {
              setPlatform(v);
              const resolved = applyPlatform(v);
              announce(PLATFORM_LABELS[resolved] + ' style applied');
            }}>
              <SelectTrigger id="app-style" className="max-w-64"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automatic ({PLATFORM_LABELS[detectPlatform()]})</SelectItem>
                <SelectItem value="cozy">Cozy classic</SelectItem>
                <SelectItem value="ios">iOS glass</SelectItem>
                <SelectItem value="material">Material (Android)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Automatic matches your phone: liquid-glass on iPhone, Material on Android.
            </p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="font-scale">Text size</Label>
            <Select value={fontScale} onValueChange={(v) => {
              setFontScale(v);
              settings.set('fontScale', Number(v));
              document.documentElement.style.setProperty('--font-scale', v);
            }}>
              <SelectTrigger id="font-scale" className="max-w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Regular</SelectItem>
                <SelectItem value="1.15">Large</SelectItem>
                <SelectItem value="1.3">Extra large</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ravelry connection</CardTitle>
          <CardDescription>
            Create free API keys at{' '}
            <a className="text-primary underline" href="https://www.ravelry.com/pro/developer" target="_blank" rel="noopener noreferrer">
              ravelry.com/pro/developer
            </a>{' '}
            (choose “Basic Auth: read only”). Keys are stored only on this device.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="rav-user">Access key (username)</Label>
            <Input id="rav-user" autoComplete="off" value={ravUser}
              onChange={e => { setRavUser(e.target.value); settings.set('ravUser', e.target.value.trim()); }} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="rav-pass">Personal key (password)</Label>
            <Input id="rav-pass" type="password" autoComplete="off" value={ravPass}
              onChange={e => { setRavPass(e.target.value); settings.set('ravPass', e.target.value.trim()); }} />
          </div>
          <div>
            <Button variant="outline" onClick={async () => {
              setRavStatus('Checking…');
              try {
                setRavStatus(`Connected as ${await testRavelry()} ✓`);
              } catch (err) {
                setRavStatus('Could not connect: ' + err.message);
              }
            }}>Test connection</Button>
          </div>
          <p role="status" className="text-sm">{ravStatus}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Barcode lookup</CardTitle>
          <CardDescription>
            Scanned barcodes are first checked against your own stash history, then a public UPC database.
            You can add a{' '}
            <a className="text-primary underline" href="https://go-upc.com/plans/api" target="_blank" rel="noopener noreferrer">Go-UPC</a>{' '}
            API key for better coverage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-1.5">
            <Label htmlFor="goupc-key">Go-UPC API key (optional)</Label>
            <Input id="goupc-key" autoComplete="off" value={goupcKey}
              onChange={e => { setGoupcKey(e.target.value); settings.set('goupcKey', e.target.value.trim()); }} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your data</CardTitle>
          <CardDescription>Everything lives on this device. Export a backup before switching phones.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={async () => {
            const data = await db.exportAll();
            const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'hearth-and-hook-backup.json';
            a.click();
            URL.revokeObjectURL(a.href);
            announce('Backup downloaded');
          }}>Export backup</Button>
          <Button variant="outline" onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'application/json';
            input.addEventListener('change', async () => {
              const file = input.files[0];
              if (!file) return;
              try {
                await db.importAll(JSON.parse(await file.text()));
                announce('Backup imported');
                navigate('projects');
              } catch (err) {
                alert('Import failed: ' + err.message);
              }
            });
            input.click();
          }}>Import backup</Button>
        </CardContent>
      </Card>
    </section>
  );
}
