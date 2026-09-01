import { useEffect, useState } from 'react';
import { db } from '@/lib/db.js';
import { announce } from '@/lib/announce.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Plus } from '@/lib/icons.jsx';
import ProjectDialog from './ProjectDialog.jsx';

export const STATUS_LABELS = {
  planned: 'Planned', 'in-progress': 'In progress', finished: 'Finished',
  hibernating: 'Hibernating', frogged: 'Frogged',
};

export default function ProjectsView({ navigate }) {
  const [projects, setProjects] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    db.getAll('projects').then(list => setProjects(list.sort((a, b) => b.updatedAt - a.updatedAt)));
  }, []);

  const onCreate = async (fields) => {
    const saved = await db.put('projects', {
      ...fields,
      counters: [
        { id: crypto.randomUUID(), name: 'Rows', value: 0, target: null },
        { id: crypto.randomUUID(), name: 'Stitches', value: 0, target: null },
      ],
      yarnIds: [],
      notes: '',
    });
    announce('Project saved');
    navigate('project-detail', saved.id);
  };

  return (
    <section aria-labelledby="projects-heading">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 id="projects-heading" className="text-xl font-bold">Projects</h2>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus aria-hidden="true" /> New project
        </Button>
      </div>

      {projects.length === 0 && (
        <p className="py-10 text-center italic text-muted-foreground">
          No projects yet. Cast on your first one with “New project”.
        </p>
      )}

      <ul aria-label="Your projects" className="grid list-none gap-3 p-0">
        {projects.map(p => {
          const rows = (p.counters || []).find(c => /row/i.test(c.name));
          const progress = rows?.target ? Math.min(100, Math.round((rows.value / rows.target) * 100)) : null;
          return (
            <li key={p.id}>
              <Card className="py-0">
                <button
                  type="button"
                  onClick={() => navigate('project-detail', p.id)}
                  className="w-full rounded-xl text-left"
                >
                  <CardContent className="px-4 py-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold">{p.name}</span>
                      <Badge>{STATUS_LABELS[p.status]}</Badge>
                    </div>
                    {rows && (
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {rows.value}{rows.target ? ` of ${rows.target}` : ''} rows
                      </p>
                    )}
                    {progress !== null && (
                      <Progress value={progress} aria-label="Row progress" className="mt-2" />
                    )}
                  </CardContent>
                </button>
              </Card>
            </li>
          );
        })}
      </ul>

      <ProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} onSave={onCreate} />
    </section>
  );
}
