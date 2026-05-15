import React from 'react';
import Header from '@/components/Header';
import { BookOpen, ChevronRight, Lock, Zap, Code2, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchLearningPaths, type LearningPathSummaryDto } from '@/api/backend';
import ProgressBar from '@/components/ProgressBar';
import { Button } from '@/components/ui/button';

const levelGradients: Record<number, string> = {
  1: 'from-emerald-500 to-teal-500',
  2: 'from-blue-500 to-indigo-500',
  3: 'from-purple-500 to-pink-500',
};

const levelIcons: Record<number, React.ReactNode> = {
  1: <BookOpen className="w-6 h-6 text-white" />,
  2: <Zap className="w-6 h-6 text-white" />,
  3: <Star className="w-6 h-6 text-white" />,
};

const levelLabels: Record<number, string> = {
  1: 'Beginner',
  2: 'Intermediate',
  3: 'Advanced',
};

const LANGUAGE_LABELS: Record<string, string> = {
  python: 'Python',
  java: 'Java',
  cpp: 'C++',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  c: 'C',
};

const LearningPaths: React.FC = () => {
  const [paths, setPaths] = React.useState<LearningPathSummaryDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [languageFilter, setLanguageFilter] = React.useState<string>('all');

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

  const allLanguages = React.useMemo(() => {
    const set = new Set<string>();
    paths.forEach((p) => set.add((p.language ?? 'python').toLowerCase()));
    return Array.from(set).sort();
  }, [paths]);

  const filteredPaths = React.useMemo(() => {
    if (languageFilter === 'all') return paths;
    return paths.filter(
      (p) => (p.language ?? 'python').toLowerCase() === languageFilter,
    );
  }, [paths, languageFilter]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Learning Paths
          </h1>
          <p className="text-muted-foreground">
            Curated sequences of quests for specific goals. Each language progresses on its own — complete the previous level in a language to unlock the next.
          </p>
        </div>

        {!loading && allLanguages.length > 1 && (
          <div className="mb-8 flex flex-wrap items-center gap-2 rounded-2xl border border-primary/20 bg-card/60 p-4 backdrop-blur-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground mr-2">
              Language
            </span>
            <Button
              variant={languageFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLanguageFilter('all')}
            >
              All
            </Button>
            {allLanguages.map((lang) => (
              <Button
                key={lang}
                variant={languageFilter === lang ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLanguageFilter(lang)}
              >
                {LANGUAGE_LABELS[lang] ?? lang}
              </Button>
            ))}
          </div>
        )}

        {loading ? (
          /* Skeleton loaders */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-2xl bg-card border border-border animate-pulse" />
            ))}
          </div>
        ) : filteredPaths.length === 0 ? (
          <div className="p-12 rounded-2xl bg-card border border-border text-center text-muted-foreground">
            <Code2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>
              {paths.length === 0
                ? 'No learning paths yet. Check back later!'
                : 'No paths match this language filter.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPaths.map((path) => {
              const unlocked = path.unlocked !== false;
              const gradient = levelGradients[path.level] ?? levelGradients[1];
              const icon = levelIcons[path.level] ?? levelIcons[1];
              const label = levelLabels[path.level] ?? `Level ${path.level}`;
              const progress = (path as any).completed_count ?? 0;
              const total = path.quest_count ?? 0;
              const checkpointQuest = path.checkpoint_quest_info;

              const card = (
                <div
                  className={`group relative rounded-2xl border overflow-hidden transition-all duration-300 ${
                    unlocked
                      ? 'bg-card border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5'
                      : 'bg-card/50 border-border/50 opacity-60'
                  }`}
                >
                  {/* Gradient header bar */}
                  <div className={`h-1.5 bg-gradient-to-r ${gradient} ${!unlocked ? 'opacity-40' : ''}`} />

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${!unlocked ? 'opacity-50' : ''}`}>
                          {unlocked ? icon : <Lock className="w-6 h-6 text-white/70" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gradient-to-r ${gradient} text-white`}>
                              {label}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                              {LANGUAGE_LABELS[(path.language ?? 'python').toLowerCase()] ?? path.language}
                            </span>
                            {!unlocked && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/20">
                                Locked
                              </span>
                            )}
                          </div>
                          <h2 className={`text-lg font-bold transition-colors ${unlocked ? 'text-foreground group-hover:text-primary' : 'text-muted-foreground'}`}>
                            {path.title}
                          </h2>
                        </div>
                      </div>

                      {unlocked && (
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all mt-1 shrink-0" />
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {path.description}
                    </p>

                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-2 gap-3">
                      <span>{path.quest_count} quests</span>
                      {unlocked && total > 0 && (
                        <span className="text-xs">{progress}/{total} completed</span>
                      )}
                    </div>

                    {unlocked && total > 0 ? (
                      <ProgressBar value={progress} max={total} size="sm" variant="success" />
                    ) : !unlocked ? (
                      <div className="space-y-3">
                        <p className="text-xs text-amber-500 font-medium">
                          Complete Level {path.level - 1} of{' '}
                          {LANGUAGE_LABELS[(path.language ?? 'python').toLowerCase()] ??
                            path.language}{' '}
                          to unlock
                        </p>

                        {checkpointQuest ? (
                          <Link to={`/quest/${checkpointQuest.id}`} className="inline-flex">
                            <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
                              Solve checkpoint
                            </Button>
                          </Link>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              );

              return unlocked ? (
                <Link key={path.id} to={`/learning-paths/${path.id}`}>
                  {card}
                </Link>
              ) : (
                <div key={path.id} className="cursor-default">
                  {card}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default LearningPaths;
