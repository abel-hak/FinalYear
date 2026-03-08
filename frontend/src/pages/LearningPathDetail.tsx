import React from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '@/components/Header';
import { Check, Lock, ChevronRight, BookOpen } from 'lucide-react';
import { fetchLearningPathDetail, type LearningPathDetailDto, type LearningPathQuestItemDto } from '@/api/backend';

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

            <div className="space-y-3">
              {path.quests.map((quest, idx) => (
                <QuestStep key={quest.id} quest={quest} index={idx + 1} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

const QuestStep: React.FC<{ quest: LearningPathQuestItemDto; index: number }> = ({ quest, index }) => {
  const canAccess = quest.status !== 'locked';
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
