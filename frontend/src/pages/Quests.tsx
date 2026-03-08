import React from 'react';
import Header from '@/components/Header';
import QuestCard, { Quest } from '@/components/QuestCard';
import { Button } from '@/components/ui/button';
import ProgressBar from '@/components/ProgressBar';
import DailyActivityBanner from '@/components/DailyActivityBanner';
import { Filter, Sparkles, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchProgress } from '@/api/backend';

const Quests: React.FC = () => {
  const [filter, setFilter] = React.useState<string>('all');
  const [tagFilter, setTagFilter] = React.useState<string>('all');
  const [quests, setQuests] = React.useState<Quest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [lastActivityDate, setLastActivityDate] = React.useState<string | null | undefined>(undefined);
  const [dismissedBanner, setDismissedBanner] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const progress = await fetchProgress();
        if (cancelled) return;
        const mapped: Quest[] = progress.quests.map((q) => {
          // Map backend status to frontend status
          const status =
            q.status === 'completed'
              ? 'completed'
              : q.status === 'current'
              ? 'in-progress'
              : 'locked';
          // Rough difficulty & category mapping for UI only
          const difficulty: Quest['difficulty'] =
            q.level <= 1 ? 'beginner' : q.level === 2 ? 'intermediate' : 'advanced';
          return {
            id: q.id,
            title: q.title,
            description: q.description,
            difficulty,
            category: `Level ${q.level}`,
            status,
            xp: 50,
            estimatedTime: '5 min',
            tags: q.tags ?? [],
          };
        });
        setQuests(mapped);
        setLastActivityDate(progress.last_activity_date ?? null);
        setError(null);
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message ?? 'Failed to load quests');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const completedCount = quests.filter((q) => q.status === 'completed').length;
  const totalXP = quests.filter((q) => q.status === 'completed').reduce((sum, q) => sum + q.xp, 0);

  // Collect all unique tags for filter options
  const allTags = React.useMemo(() => {
    const set = new Set<string>();
    quests.forEach((q) => (q.tags ?? []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [quests]);

  const filteredQuests = React.useMemo(() => {
    let result = quests;
    if (filter !== 'all') result = result.filter((q) => q.difficulty === filter);
    if (tagFilter !== 'all') result = result.filter((q) => (q.tags ?? []).includes(tagFilter));
    return result;
  }, [quests, filter, tagFilter]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        {/* Daily activity reminder (US-013) */}
        {!dismissedBanner && lastActivityDate !== undefined && (
          <div className="mb-6">
            <DailyActivityBanner
              lastActivityDate={lastActivityDate}
              onDismiss={() => setDismissedBanner(true)}
            />
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
              Quest Map
            </h1>
            <p className="text-muted-foreground">
              Choose your next debugging challenge and level up your skills
            </p>
          </div>
          
          {/* Stats cards */}
          <div className="flex gap-4">
            <div className="px-4 py-3 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Trophy className="w-4 h-4 text-success" />
                Completed
              </div>
              <div className="text-2xl font-bold text-foreground">
                {completedCount}/{quests.length || 0}
              </div>
            </div>
            <div className="px-4 py-3 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Sparkles className="w-4 h-4 text-gold" />
                Total XP
              </div>
              <div className="text-2xl font-bold text-foreground">
                {totalXP}
              </div>
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mb-8 p-6 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-foreground">Overall Progress</span>
            <span className="text-sm text-muted-foreground">
              {completedCount} of {quests.length || 0} quests completed
            </span>
          </div>
          <ProgressBar
            value={completedCount}
            max={quests.length || 1}
            size="lg"
            variant="success"
          />
        </div>
        
        {/* Filters */}
        <div className="space-y-4 mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="w-4 h-4" />
              Difficulty:
            </div>
            {['all', 'beginner', 'intermediate', 'advanced'].map((level) => (
              <Button
                key={level}
                variant={filter === level ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(level)}
                className="capitalize"
              >
                {level}
              </Button>
            ))}
          </div>
          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Concepts:</span>
              <Button
                variant={tagFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTagFilter('all')}
              >
                All
              </Button>
              {allTags.map((tag) => (
                <Button
                  key={tag}
                  variant={tagFilter === tag ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTagFilter(tag)}
                >
                  {tag}
                </Button>
              ))}
            </div>
          )}
        </div>
        
        {/* Quest Grid */}
        {loading ? (
          <p className="text-muted-foreground">Loading quests...</p>
        ) : error ? (
          <p className="text-red-500 text-sm">{error}</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredQuests.map((quest) => (
              <Link
                key={quest.id}
                to={quest.status !== 'locked' ? `/quest/${quest.id}` : '#'}
              >
                <QuestCard quest={quest} />
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Quests;
