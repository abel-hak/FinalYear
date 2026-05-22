import React from "react";
import Header from "@/components/Header";
import QuestCard, { Quest } from "@/components/QuestCard";
import { Button } from "@/components/ui/button";
import ProgressBar from "@/components/ProgressBar";
import DailyActivityBanner from "@/components/DailyActivityBanner";
import { Filter, Sparkles, Trophy, SlidersHorizontal, X } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchProgress } from "@/api/backend";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const LANGUAGE_LABELS: Record<string, string> = {
  python: "Python",
  java: "Java",
  cpp: "C++",
  javascript: "JavaScript",
  typescript: "TypeScript",
  c: "C",
};

interface QuestWithLanguage extends Quest {
  language: string;
}

const Quests: React.FC = () => {
  const [filter, setFilter] = React.useState<string>("all");
  // empty array = no tag filter (show all). Allows selecting multiple tags.
  const [tagFilter, setTagFilter] = React.useState<string[]>([]);
  const [languageFilter, setLanguageFilter] = React.useState<string>("all");
  const [quests, setQuests] = React.useState<QuestWithLanguage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [lastActivityDate, setLastActivityDate] = React.useState<
    string | null | undefined
  >(undefined);
  const [totalPointsFromProgress, setTotalPointsFromProgress] =
    React.useState(0);
  const [dismissedBanner, setDismissedBanner] = React.useState(false);
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const progress = await fetchProgress();
        if (cancelled) return;
        const mapped: QuestWithLanguage[] = progress.quests.map((q) => {
          // Map backend status to frontend status
          const status =
            q.status === "completed"
              ? "completed"
              : q.status === "current"
                ? "in-progress"
                : "locked";
          // Rough difficulty & category mapping for UI only
          const difficulty: Quest["difficulty"] =
            q.level <= 1
              ? "beginner"
              : q.level === 2
                ? "intermediate"
                : "advanced";
          const language = (q.language ?? "python").toLowerCase();
          // Use xp_reward from API (custom XP values per quest), not derived from level
          return {
            id: q.id,
            title: q.title,
            description: q.description,
            difficulty,
            category: `Level ${q.level}`,
            status,
            xp: q.xp_reward ?? 50,
            estimatedTime: "5 min",
            tags: q.tags ?? [],
            language,
          };
        });
        setQuests(mapped);
        setLastActivityDate(progress.last_activity_date ?? null);
        setTotalPointsFromProgress(progress.total_points ?? 0);
        setError(null);
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message ?? "Failed to load quests");
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

  const completedCount = quests.filter((q) => q.status === "completed").length;
  // Use total_points from progress API (lifetime XP = quest XP + achievement XP)
  // This ensures consistency with the Achievements page
  const totalXP = totalPointsFromProgress;

  // Collect all languages and tags actually present in this learner's data
  // so the filter chips reflect what's seeded.
  const allLanguages = React.useMemo(() => {
    const set = new Set<string>();
    quests.forEach((q) => set.add(q.language));
    return Array.from(set).sort();
  }, [quests]);

  const allTags = React.useMemo(() => {
    const set = new Set<string>();
    quests.forEach((q) => (q.tags ?? []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [quests]);

  const filteredQuests = React.useMemo(() => {
    let result = quests;
    if (languageFilter !== "all")
      result = result.filter((q) => q.language === languageFilter);
    if (filter !== "all")
      result = result.filter((q) => q.difficulty === filter);
    // If one or more tags selected, show quests that have any of the selected tags
    if (tagFilter.length > 0)
      result = result.filter((q) =>
        (q.tags ?? []).some((t) => tagFilter.includes(t)),
      );
    return result;
  }, [quests, filter, tagFilter, languageFilter]);

  return (
    <div className="flex flex-col items-center min-h-screen bg-background">
      <style>{`
        @keyframes filtersButtonShine {
          0% {
            transform: translateX(-220%) skewX(-22deg);
            opacity: 0;
          }
          14% {
            opacity: 0.05;
          }
          26% {
            opacity: 0.95;
          }
          40% {
            opacity: 0.18;
          }
          55% {
            opacity: 0;
          }
          100% {
            transform: translateX(300%) skewX(-22deg);
            opacity: 0;
          }
        }

        .filters-shine {
          position: absolute;
          top: -70%;
          bottom: -70%;
          left: -55%;
          width: 62%;
          pointer-events: none;
          background: linear-gradient(
            115deg,
            transparent 0%,
            hsl(var(--foreground) / 0) 28%,
            hsl(var(--primary) / 0.22) 42%,
            hsl(var(--foreground) / 0.95) 50%,
            hsl(var(--primary) / 0.22) 58%,
            hsl(var(--foreground) / 0) 72%,
            transparent 100%
          );
          filter: blur(1px);
          box-shadow: 0 0 24px hsl(var(--primary) / 0.35);
          mix-blend-mode: screen;
          animation: filtersButtonShine 2.2s ease-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .filters-shine {
            animation: none;
            opacity: 0;
          }
        }
      `}</style>
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
        <div className="mb-8 rounded-2xl border border-primary/20 bg-card/60 p-6 shadow-[0_10px_30px_hsl(var(--primary)/0.12)] backdrop-blur-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-foreground sm:text-4xl">
                Quest Map
              </h1>
              <p className="max-w-2xl text-muted-foreground">
                Choose your next debugging challenge and build momentum with
                focused practice.
              </p>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-primary/25 bg-gradient-to-br from-primary/15 via-primary/8 to-transparent px-4 py-3">
                <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <Trophy className="h-4 w-4 text-success" />
                  Completed
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {completedCount}/{quests.length || 0}
                </div>
              </div>

              <div className="rounded-xl border border-[hsl(var(--accent)/0.3)] bg-gradient-to-br from-[hsl(var(--accent)/0.18)] via-[hsl(var(--accent)/0.08)] to-transparent px-4 py-3">
                <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-gold" />
                  Total XP
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {totalXP}
                </div>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-6 rounded-xl border border-primary/20 bg-gradient-to-r from-secondary/45 via-secondary/25 to-background/60 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-foreground sm:text-base">
                Overall Progress
              </span>
              <span className="text-xs text-muted-foreground sm:text-sm">
                {quests.length > 0
                  ? `${Math.round((completedCount / quests.length) * 100)}% complete`
                  : "0% complete"}
              </span>
            </div>
            <ProgressBar
              value={completedCount}
              max={quests.length || 1}
              size="lg"
              variant="success"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 rounded-2xl border border-primary/20 bg-card/60 p-5 backdrop-blur-sm sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Quest Filters
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Refine the quest list by difficulty or concept.
              </p>
            </div>

            <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="relative isolate w-full gap-2 overflow-hidden border-primary/30 bg-background/60 md:w-auto"
                >
                  <span aria-hidden className="filters-shine" />
                  <Filter className="relative z-10 h-4 w-4" />
                  <span className="relative z-10">Open filters</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl border-border bg-background/95 backdrop-blur-xl sm:rounded-2xl">
                <DialogHeader className="text-left">
                  <DialogTitle className="text-foreground">
                    Filter quests
                  </DialogTitle>
                  <DialogDescription>
                    Choose difficulty and concept filters to narrow down the
                    quest list.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  <div className="max-h-[60vh] overflow-y-auto pr-2">
                    <div className="rounded-xl border border-border bg-card/70 p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">
                            Language
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Pick a programming language to focus on.
                          </p>
                        </div>
                        {languageFilter !== "all" && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-2 text-muted-foreground"
                            onClick={() => setLanguageFilter("all")}
                          >
                            <X className="h-3.5 w-3.5" />
                            Clear
                          </Button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={
                            languageFilter === "all" ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setLanguageFilter("all")}
                        >
                          All
                        </Button>
                        {allLanguages.map((lang) => (
                          <Button
                            key={lang}
                            variant={
                              languageFilter === lang ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setLanguageFilter(lang)}
                          >
                            {LANGUAGE_LABELS[lang] ?? lang}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card/70 p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">
                            Difficulty
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Select a difficulty level.
                          </p>
                        </div>
                        {filter !== "all" && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-2 text-muted-foreground"
                            onClick={() => setFilter("all")}
                          >
                            <X className="h-3.5 w-3.5" />
                            Clear
                          </Button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {["all", "beginner", "intermediate", "advanced"].map(
                          (level) => (
                            <Button
                              key={level}
                              variant={filter === level ? "default" : "outline"}
                              size="sm"
                              onClick={() => setFilter(level)}
                              className="capitalize"
                            >
                              {level}
                            </Button>
                          ),
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card/70 p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">
                            Concepts
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Filter quests by topic tags.
                          </p>
                        </div>
                        {tagFilter.length > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-2 text-muted-foreground"
                            onClick={() => setTagFilter([])}
                          >
                            <X className="h-3.5 w-3.5" />
                            Clear
                          </Button>
                        )}
                      </div>

                      {allTags.length > 0 ? (
                        <div className="flex max-h-56 flex-wrap gap-2 overflow-y-auto pr-1">
                          <Button
                            variant={
                              tagFilter.length === 0 ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setTagFilter([])}
                          >
                            All
                          </Button>
                          {allTags.map((tag) => (
                            <Button
                              key={tag}
                              variant={
                                tagFilter.includes(tag) ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() =>
                                setTagFilter((prev) =>
                                  prev.includes(tag)
                                    ? prev.filter((t) => t !== tag)
                                    : [...prev, tag],
                                )
                              }
                            >
                              {tag}
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No concept tags available yet.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <DialogFooter className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-between">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setFilter("all");
                      setTagFilter([]);
                      setLanguageFilter("all");
                    }}
                  >
                    Reset all filters
                  </Button>
                  <Button onClick={() => setFiltersOpen(false)}>
                    Apply filters
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Active
            </span>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-border bg-background/60 px-3 py-1 text-xs text-muted-foreground">
                Language:{" "}
                <span className="font-medium text-foreground">
                  {languageFilter === "all"
                    ? "All"
                    : (LANGUAGE_LABELS[languageFilter] ?? languageFilter)}
                </span>
              </span>
              <span className="rounded-full border border-border bg-background/60 px-3 py-1 text-xs text-muted-foreground">
                Difficulty:{" "}
                <span className="font-medium text-foreground capitalize">
                  {filter}
                </span>
              </span>
              <span className="rounded-full border border-border bg-background/60 px-3 py-1 text-xs text-muted-foreground">
                Concept:{" "}
                <span className="font-medium text-foreground">
                  {tagFilter.length === 0 ? "All" : tagFilter.join(", ")}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Quest Grid */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-56 rounded-3xl border border-border bg-card/70 p-5 animate-pulse"
              >
                <div className="flex h-full flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="h-6 w-24 rounded-full bg-muted/70" />
                      <div className="h-10 w-14 rounded-2xl bg-muted/70" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-5 w-3/4 rounded-full bg-muted/70" />
                      <div className="h-5 w-2/3 rounded-full bg-muted/70" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 w-full rounded-full bg-muted/70" />
                    <div className="h-4 w-5/6 rounded-full bg-muted/70" />
                    <div className="flex flex-wrap gap-2">
                      <div className="h-6 w-16 rounded-full bg-muted/70" />
                      <div className="h-6 w-20 rounded-full bg-muted/70" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="text-red-500 text-sm text-center">{error}</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredQuests.map((quest) => {
              const card = <QuestCard quest={quest} />;

              return (
                <div key={quest.id} className="h-full">
                  {quest.status !== "locked" ? (
                    <Link to={`/quest/${quest.id}`} className="block h-full">
                      {card}
                    </Link>
                  ) : (
                    <div className="h-full">{card}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Quests;
