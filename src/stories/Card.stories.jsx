import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export default {
  title: 'Components/Card',
  component: Card,
};

export const ProjectCard = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Sunburst blanket</CardTitle>
        <CardDescription>24 of 48 squares</CardDescription>
      </CardHeader>
      <CardContent><Progress value={50} aria-label="Progress" /></CardContent>
      <CardFooter><Button size="sm" variant="outline">Open</Button></CardFooter>
    </Card>
  ),
};
