import { useState } from 'react';
import { db, settings } from '@/lib/db.js';
import { announce } from '@/lib/announce.js';
import { testRavelry } from '@/lib/ravelry.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function SettingsView({ navigate }) {
  const [fontScale, setFontScale] = useState(String(settings.get('fontScale', 1)));
  const [ravUser, setRavUser] = useState(settings.get('ravUser', ''));
  const [ravPass, setRavPass] = useState(settings.get('ravPass', ''));
  const [goupcKey, setGoupcKey] = useState(settings.get('goupcKey', ''));
  const [ravChecking, setRavChecking] = useState(false);
  const [ravResult, setRavResult] = useState(null); // { variant: 'success'|'error', message }
  const [importError, setImportError] = useState('');

  return (
    <section aria-labelledby="settings-heading" className="grid gap-3">
      <h2 id="settings-heading" className="text-xl font-bold">Settings</h2>

      <Card>
        <CardHeader><CardTitle>Text size</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-1.5">
            <Label htmlFor="font-scale">Text size</Label>
            <Select value={fontScale} onValueChange={(v) => {
              setFontScale(v);
              settings.set('fontScale', Number(v));
              document.documentElement.style.setProperty('--font-scale', v);
              announce('Text size set to ' + ({ '1': 'regular', '1.15': 'large', '1.3': 'extra large' }[v] || v));
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
            <a className="text-link underline" href="https://www.ravelry.com/pro/developer" target="_blank" rel="noopener noreferrer">
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
              setRavChecking(true);
              setRavResult(null);
              try {
                const username = await testRavelry();
                setRavResult({ variant: 'success', message: `Connected as ${username} ✓` });
              } catch (err) {
                setRavResult({ variant: 'error', message: 'Could not connect: ' + err.message });
              } finally {
                setRavChecking(false);
              }
            }}>Test connection</Button>
          </div>
          {ravChecking && <p role="status" className="text-sm text-muted-foreground">Checking…</p>}
          {ravResult && (
            <Alert variant={ravResult.variant}>
              <AlertDescription>{ravResult.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Barcode lookup</CardTitle>
          <CardDescription>
            Scanned barcodes are first checked against your own stash history, then a public UPC database.
            You can add a{' '}
            <a className="text-link underline" href="https://go-upc.com/plans/api" target="_blank" rel="noopener noreferrer">Go-UPC</a>{' '}
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
            a.download = 'woolgaze-backup.json';
            a.click();
            URL.revokeObjectURL(a.href);
            announce('Backup downloaded');
          }}>Export backup</Button>
          <Button variant="outline" onClick={() => {
            setImportError('');
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
                setImportError(err.message);
                announce('Import failed: ' + err.message);
              }
            });
            input.click();
          }}>Import backup</Button>
          {importError && (
            <Alert variant="error" className="w-full">
              <AlertTitle>Import failed</AlertTitle>
              <AlertDescription>{importError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
