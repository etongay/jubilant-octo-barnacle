import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default {
  title: 'Components/Dialog',
  component: Dialog,
};

export const Confirm = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild><Button variant="destructive">Delete project</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete “Sunburst blanket”?</DialogTitle>
          <DialogDescription>Its counters and notes go with it. This can’t be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button variant="destructive">Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
