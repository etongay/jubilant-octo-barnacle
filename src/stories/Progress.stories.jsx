import { Progress } from '@/components/ui/progress';

export default {
  title: 'Components/Progress',
  component: Progress,
  args: { value: 60, 'aria-label': 'Rows complete' },
  argTypes: { value: { control: { type: 'range', min: 0, max: 100 } } },
  decorators: [Story => <div className="w-72"><Story /></div>],
};

export const Default = {};
export const Empty = { args: { value: 0 } };
export const Complete = { args: { value: 100 } };
