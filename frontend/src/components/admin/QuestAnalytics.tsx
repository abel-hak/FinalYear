import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
import { fetchAdminAnalytics, type AdminAnalyticsDto } from "@/api/backend";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const chartConfig = {
  completed: { label: "Completed", color: "hsl(var(--primary))" },
  failed: { label: "Failed", color: "hsl(var(--destructive))" },
  submissions: { label: "Submissions", color: "hsl(var(--primary))" },
  unique_users: { label: "Active Users", color: "hsl(var(--accent-foreground))" },
};

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "hsl(142, 76%, 36%)",
  Medium: "hsl(45, 93%, 47%)",
  Hard: "hsl(0, 84%, 60%)",
  Expert: "hsl(280, 70%, 50%)",
  Master: "hsl(38, 92%, 50%)",
};

export const QuestAnalytics = () => {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<AdminAnalyticsDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchAdminAnalytics()
      .then((data) => { if (!cancelled) setAnalytics(data); })
      .catch((e) => {
        if (!cancelled) {
          toast({ title: "Failed to load analytics", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [toast]);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-[350px] rounded-xl bg-card/50 backdrop-blur-xl border border-border/50 animate-pulse" />
        <div className="h-[350px] rounded-xl bg-card/50 backdrop-blur-xl border border-border/50 animate-pulse" />
        <div className="md:col-span-2 h-[350px] rounded-xl bg-card/50 backdrop-blur-xl border border-border/50 animate-pulse" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Failed to load analytics.</p>
      </div>
    );
  }

  const completionData = analytics.quest_completion.map((q) => {
    const total = q.completed + q.failed;
    const completedPct = total > 0 ? Math.round((q.completed / total) * 100) : 0;
    const failedPct = total > 0 ? Math.round((q.failed / total) * 100) : 0;
    return {
      name: q.quest_title,
      completed: completedPct,
      failed: failedPct,
      total,
    };
  }).sort((a, b) => a.completed - b.completed);

  const leastCompleteQuest = completionData[0];

  const totalDifficulty = analytics.difficulty_distribution.reduce((s, d) => s + d.count, 0);
  const difficultyData = analytics.difficulty_distribution.map((d) => ({
    name: d.label,
    value: totalDifficulty > 0 ? Math.round((d.count / totalDifficulty) * 100) : 0,
    color: DIFFICULTY_COLORS[d.label] ?? "hsl(var(--muted-foreground))",
  }));

  const weeklyData = analytics.weekly_activity.map((d) => ({
    day: d.day,
    submissions: d.submissions,
    users: d.unique_users,
  }));

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="relative overflow-hidden border-border/60 bg-slate-950/65 backdrop-blur-xl shadow-[0_22px_70px_-38px_rgba(2,6,23,0.95)] transition-all hover:-translate-y-0.5 hover:bg-slate-950/75 md:col-span-2">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_32%),radial-gradient(circle_at_top_right,rgba(244,63,94,0.11),transparent_28%),linear-gradient(135deg,rgba(15,23,42,0.92),rgba(15,23,42,0.72))]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-cyan-400/0 via-cyan-400/40 to-rose-400/0" />
        <CardHeader className="relative z-10 space-y-4 pb-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl text-slate-50">Quest Breakdown</CardTitle>
              <p className="mt-1 max-w-2xl text-sm text-slate-300">
                Sorted from lowest to highest completion rate for faster triage.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative z-10">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-100">Quest breakdown</p>
                <p className="text-xs text-slate-300">Sorted from lowest to highest completion rate for faster triage.</p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">{completionData.length} quests</div>
            </div>

            <ScrollArea className="h-[420px] pr-3">
              <div className="space-y-3">
                {completionData.map((quest) => (
                  <div key={quest.name} className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-50">{quest.name}</p>
                        <p className="mt-1 text-xs text-slate-300">{quest.completed}/{quest.total} completed</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-slate-50">{quest.completed}%</div>
                        <p className="text-[11px] text-slate-300">{quest.failed}% failed</p>
                      </div>
                    </div>
                    <Progress value={quest.completed} className="mt-3 h-2 bg-white/10" />
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-300">
                      <span>{quest.total} attempts</span>
                      <span>{quest.failed} failed</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* Difficulty Distribution */}
      <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-xl transition-all hover:bg-card/60">
        <CardHeader>
          <CardTitle className="text-lg">Quest Difficulty Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center">
            {difficultyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={difficultyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {difficultyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No quests yet</p>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {difficultyData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-muted-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Activity */}
      <Card className="md:col-span-2 bg-card/50 backdrop-blur-xl border-border/50 shadow-xl transition-all hover:bg-card/60">
        <CardHeader>
          <CardTitle className="text-lg">Weekly Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="submissions"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                  name="Submissions"
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="hsl(var(--accent-foreground))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--accent-foreground))" }}
                  name="Active Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};
