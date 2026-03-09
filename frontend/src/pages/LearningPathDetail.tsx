import React from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '@/components/Header';
import { Check, Lock, ChevronRight, BookOpen, ExternalLink } from 'lucide-react';
import { fetchLearningPathDetail, type LearningPathDetailDto, type LearningPathQuestItemDto } from '@/api/backend';
import { getAggregatedResources, getBestUrlForConcept } from '@/lib/conceptResources';

const LearningPathDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [path, setPath] = React.useState<LearningPathDetailDto | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const data = await fetchLearningPathDetail(id);
        if (!cancelled) {
          setPath(data);
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message ?? 'Failed to load path');
          setPath(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  const completedCount = path?.quests.filter((q) => q.status === 'completed').length ?? 0;
  const isLocked = path && path.is_unlocked === false;
  const allTags = React.useMemo(() => {
    const set = new Set<string>();
    (path?.quests ?? []).forEach((q) => (q.tags ?? []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [path]);
  const resources = React.useMemo(() => getAggregatedResources(allTags), [allTags]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : !path ? (
          <p className="text-muted-foreground">Path not found.</p>
        ) : (
          <>
            <div className="mb-8">
              <Link to="/learning-paths" className="text-sm text-muted-foreground hover:text-primary mb-4 inline-block">
                ← Back to paths
              </Link>
              {isLocked && path.unlock_hint && (
                <div className="mb-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
                  <strong>Locked:</strong> {path.unlock_hint}
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                      Level {path.level}
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                      {path.title}
                    </h1>
                  </div>
                  <p className="text-muted-foreground">
                    {completedCount} of {path.quests.length} completed
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground max-w-2xl">
                {path.description}
              </p>
            </div>

            {(allTags.length > 0 || resources.length > 0) && (
              <div className="mb-8 p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <h2 className="font-semibold text-foreground">Learn the concepts</h2>
                  <span className="text-xs text-muted-foreground">
                    {allTags.length} topic{allTags.length === 1 ? "" : "s"}
                  </span>
                </div>

                {allTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {allTags.slice(0, 12).map((tag) => (
                      <button
                        key={tag}
                        onClick={() => window.open(getBestUrlForConcept(tag), "_blank", "noopener,noreferrer")}
                        className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm hover:bg-primary/15 transition-colors inline-flex items-center gap-1"
                      >
                        {tag}
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                )}

                {resources.length > 0 && (
                  <div className="mt-4 border-t border-border pt-3">
                    <div className="text-xs font-semibold text-muted-foreground mb-2">Curated resources</div>
                    <ul className="space-y-1">
                      {resources.slice(0, 6).map((r) => (
                        <li key={r.url} className="text-xs">
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            {r.label}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          {r.source && <span className="ml-2 text-muted-foreground">({r.source})</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              {path.quests.map((quest, idx) => (
                <QuestStep key={quest.id} quest={quest} index={idx + 1} pathLocked={isLocked} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

const QuestStep: React.FC<{
  quest: LearningPathQuestItemDto;
  index: number;
  pathLocked?: boolean;
}> = ({ quest, index, pathLocked }) => {
  const canAccess = quest.status !== 'locked' && !pathLocked;
  const isCompleted = quest.status === 'completed';

  return (
    <Link to={canAccess ? `/quest/${quest.id}` : '#'}>
      <div
        className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
          canAccess
            ? 'bg-card border-border hover:border-primary/50'
            : 'bg-muted/30 border-border opacity-75 cursor-not-allowed'
        }`}
      >
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            isCompleted ? 'bg-success/20 text-success' : 'bg-muted'
          }`}
        >
          {isCompleted ? <Check className="w-5 h-5" /> : <span className="font-bold text-sm">{index}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground">{quest.title}</h3>
          <p className="text-sm text-muted-foreground truncate">{quest.description}</p>
          {quest.tags && quest.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {quest.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        {canAccess ? (
          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
        ) : (
          <Lock className="w-5 h-5 text-muted-foreground shrink-0" />
        )}
      </div>
    </Link>
  );
};

export default LearningPathDetail;
