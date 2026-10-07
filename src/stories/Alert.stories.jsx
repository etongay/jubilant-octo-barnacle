import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default {
  title: 'Components/Alert',
  component: Alert,
  args: { variant: 'default' },
  argTypes: { variant: { control: 'select', options: ['default', 'info', 'success', 'warning', 'error'] } },
  render: args => (
    <Alert {...args} className="w-96">
      <AlertTitle>Yarn running low</AlertTitle>
      <AlertDescription>About 40 m of Cream left — enough for two more squares.</AlertDescription>
    </Alert>
  ),
};

export const Default = {};
export const Info = { args: { variant: 'info' } };
export const Success = { args: { variant: 'success' } };
export const Warning = { args: { variant: 'warning' } };
export const Error = { args: { variant: 'error', role: 'alert' } };
