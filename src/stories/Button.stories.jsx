import { Plus } from '@/lib/icons.jsx';
import { Button } from '@/components/ui/button';

export default {
  title: 'Components/Button',
  component: Button,
  args: { children: 'Start project' },
  argTypes: {
    variant: { control: 'select', options: ['default', 'accent', 'secondary', 'outline', 'ghost', 'destructive', 'link'] },
    size: { control: 'select', options: ['default', 'sm', 'lg', 'icon'] },
    disabled: { control: 'boolean' },
  },
};

export const Primary = {};
export const Accent = { args: { variant: 'accent', children: 'Mark row complete' } };
export const Secondary = { args: { variant: 'secondary' } };
export const Outline = { args: { variant: 'outline' } };
export const Ghost = { args: { variant: 'ghost' } };
export const Destructive = { args: { variant: 'destructive', children: 'Delete project' } };
export const Link = { args: { variant: 'link', children: 'View pattern' } };
export const WithIcon = { args: { children: <><Plus /> New project</> } };
export const IconOnly = { args: { size: 'icon', 'aria-label': 'Add', children: <Plus /> } };

export const AllVariants = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      {['default', 'accent', 'secondary', 'outline', 'ghost', 'destructive', 'link'].map(v => (
        <Button key={v} variant={v}>{v}</Button>
      ))}
    </div>
  ),
};
