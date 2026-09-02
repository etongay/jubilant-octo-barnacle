import { useEffect, useState } from 'react';
import { db } from '@/lib/db.js';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TagChips } from '@/components/tag-chips.jsx';
import { allTags, addCustomTag } from '@/lib/tags.js';
import { announce } from '@/lib/announce.js';
import { STATUS_LABELS } from './ProjectsView.jsx';

const NONE = '__none__';

export default function ProjectDialog({ open, onOpenChange, onSave, project }) {
  const [name, setName] = useState('');
  const [hook, setHook] = useState('');
  const [status, setStatus] = useState('in-progress');
  const [patternId, setPatternId] = useState(NONE);
  const [patterns, setPatterns] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagDraft, setTagDraft] = useState('');
  const [addingTag, setAddingTag] = useState(false);

  useEffect(() => {
    if (!open) return;
    db.getAll('patterns').then(setPatterns);
    setName(project?.name || '');
    setHook(project?.hook || '');
    setStatus(project?.status || 'in-progress');
    setPatternId(project?.patternId || NONE);
    setTags(project?.tags || []);
    setAddingTag(false);
    setTagDraft('');
  }, [open, project]);

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      ...(project || {}),
      name: name.trim(),
      hook: hook.trim(),
      status,
      tags,
      patternId: patternId === NONE ? null : patternId,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{project ? 'Edit project' : 'New project'}</DialogTitle>
          <DialogDescription>
            {project ? 'Update the details of this project.' : 'Give your new make a name to get started.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="pf-name">Project name (required)</Label>
            <Input id="pf-name" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="pf-pattern">Pattern</Label>
            <Select value={patternId} onValueChange={setPatternId}>
              <SelectTrigger id="pf-pattern"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— none yet —</SelectItem>
                {patterns.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="pf-hook">Hook size</Label>
            <Input id="pf-hook" value={hook} onChange={e => setHook(e.target.value)} placeholder="e.g. 4.0 mm" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="pf-status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="pf-status"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <span id="project-tags-label" className="text-sm font-semibold">Tags</span>
            <TagChips
              label="Tags for this project"
              tags={allTags()}
              selected={tags}
              onToggle={t => setTags(list => (list.includes(t) ? list.filter(x => x !== t) : [...list, t]))}
              onNew={() => setAddingTag(v => !v)}
            />
            {addingTag && (
              <div className="flex gap-2">
                <Label htmlFor="pf-newtag" className="sr-only">New tag name</Label>
                <Input
                  id="pf-newtag"
                  maxLength={24}
                  placeholder="e.g. Test crochet"
                  value={tagDraft}
                  onChange={e => setTagDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key !== 'Enter') return;
                    // Enter here adds the tag; it must not submit the project form.
                    e.preventDefault();
                    const added = addCustomTag(tagDraft);
                    if (added) { setTags(list => [...list, added]); announce(`Tag ${added} created`); }
                    setTagDraft('');
                    setAddingTag(false);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const added = addCustomTag(tagDraft);
                    if (added) { setTags(list => [...list, added]); announce(`Tag ${added} created`); }
                    setTagDraft('');
                    setAddingTag(false);
                  }}
                >
                  Add
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
