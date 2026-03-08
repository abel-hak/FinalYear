import React from 'react';
import Header from '@/components/Header';
import { BookOpen, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchLearningPaths, type LearningPathSummaryDto } from '@/api/backend';

const LearningPaths: React.FC = () => {
  const [paths, setPaths] = React.useState<LearningPathSummaryDto[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchLearningPaths();
        if (!cancelled) setPaths(data);
      } catch {
        if (!cancelled) setPaths([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Learning Paths
          </h1>
          <p className="text-muted-foreground">
            Curated sequences of quests for specific goals. Follow a path to build skills step by step.
          </p>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading paths...</p>
        ) : paths.length === 0 ? (
          <div className="p-8 rounded-xl bg-card border border-border text-center text-muted-foreground">
            No learning paths yet. Check back later!
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {paths.map((path) => (
              <Link key={path.id} to={`/learning-paths/${path.id}`}>
                <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                            Level {path.level}
                          </span>
                          <h2 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {path.title}
                          </h2>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {path.quest_count} quests
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {path.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default LearningPaths;
