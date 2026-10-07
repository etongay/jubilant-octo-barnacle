import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export default {
  title: 'Components/Form controls',
  component: Input,
};

export const TextInput = {
  render: () => (
    <div className="flex w-72 flex-col gap-2">
      <Label htmlFor="name">Project name</Label>
      <Input id="name" placeholder="e.g. Granny square" />
    </div>
  ),
};

export const Notes = {
  render: () => (
    <div className="flex w-72 flex-col gap-2">
      <Label htmlFor="notes">Notes</Label>
      <Textarea id="notes" placeholder="Hook size, changes to the pattern…" />
    </div>
  ),
};

export const CheckboxWithLabel = {
  render: () => (
    <Label><Checkbox defaultChecked /> Round 3 complete</Label>
  ),
};

export const Disabled = {
  render: () => (
    <div className="flex w-72 flex-col gap-2">
      <Label htmlFor="d">Pattern source</Label>
      <Input id="d" disabled defaultValue="Ravelry" />
    </div>
  ),
};
