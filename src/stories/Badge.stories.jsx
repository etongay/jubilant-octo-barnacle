import { Badge } from '@/components/ui/badge';
import { StatusBadge, TagBadge, TagList } from '@/components/badges';

export default {
  title: 'Components/Badge',
  component: Badge,
  args: { children: 'In progress' },
  argTypes: { variant: { control: 'select', options: ['secondary', 'default', 'destructive', 'outline'] } },
};

export const Default = {};
export const Status = { render: args => <StatusBadge {...args} /> };
export const Tag = { render: () => <TagBadge>amigurumi</TagBadge> };
export const Tags = { render: () => <TagList tags={['granny square', 'blanket', 'worsted']} /> };
