import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { Badge } from '@/components/ui/badge';
import ProgressBar from '@/components/ProgressBar';
import { 
  Trophy, 
  Sparkles, 
  Bug, 
  Code2, 
  Zap, 
  Target,
  Star,
  Flame,
  Shield,
  CheckCircle2,
  BookOpen,
  Lock
} from 'lucide-react';
import { fetchAchievements, type AchievementDto } from '@/api/backend';
import { toast } from '@/components/ui/sonner';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  xp: number;
  unlocked: boolean;
  progress?: { current: number; max: number };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const ICONS: Record<string, React.ReactNode> = {
  bug: <Bug className="w-6 h-6" />,
  target: <Target className="w-6 h-6" />,
  trophy: <Trophy className="w-6 h-6" />,
  star: <Star className="w-6 h-6" />,
  code: <Code2 className="w-6 h-6" />,
  zap: <Zap className="w-6 h-6" />,
  sparkles: <Sparkles className="w-6 h-6" />,
  flame: <Flame className="w-6 h-6" />,
  shield: <Shield className="w-6 h-6" />,
  check: <CheckCircle2 className="w-6 h-6" />,
  book: <BookOpen className="w-6 h-6" />,
};

const STORAGE_KEY = "codequest_unlocked_achievements_v1";

function mapDto(dto: AchievementDto): Achievement {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    icon: ICONS[dto.icon_key] ?? <Trophy className="w-6 h-6" />,
    xp: dto.xp,
    unlocked: dto.unlocked,
    rarity: dto.rarity,
    progress: dto.progress ? { current: dto.progress.current, max: dto.progress.max } : undefined,
  };
}

const rarityColors = {
  common: 'from-gray-400 to-gray-500',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-amber-400 to-yellow-500'
};

const rarityLabels = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary'
};

const Achievements: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked" | "in_progress">("all");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchAchievements();
        const list = data.map(mapDto);
        setAchievements(list);

        // Toast newly unlocked achievements (compared to last seen).
        const prev = new Set<string>(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"));
        const nowUnlocked = list.filter((a) => a.unlocked).map((a) => a.id);
        const newlyUnlocked = list.filter((a) => a.unlocked && !prev.has(a.id));
        if (newlyUnlocked.length > 0) {
          newlyUnlocked.slice(0, 3).forEach((a) => {
            toast(`Achievement unlocked: ${a.title}`, {
              description: a.description,
            });
          });
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nowUnlocked));

        setError(null);
      } catch (e) {
        console.error(e);
        setError('Could not load achievements. Make sure you are logged in as a learner.');
        setAchievements([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalXPFromAchievements = achievements.filter((a) => a.unlocked).reduce((sum, a) => sum + a.xp, 0);
  const filtered = achievements.filter((a) => {
    if (filter === "all") return true;
    if (filter === "unlocked") return a.unlocked;
    if (filter === "locked") return !a.unlocked;
    // in_progress: has progress and not unlocked
    return !a.unlocked && !!a.progress && a.progress.current > 0;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
              Achievements
            </h1>
            <p className="text-muted-foreground">
              Unlock achievements as you complete quests and master debugging
            </p>
          </div>
          
          {/* Stats */}
          <div className="flex gap-4">
            <div className="px-5 py-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Trophy className="w-4 h-4 text-primary" />
                Unlocked
              </div>
              <div className="text-2xl font-bold text-foreground">
                {unlockedCount}<span className="text-base font-normal text-muted-foreground">/{achievements.length || 0}</span>
              </div>
              <ProgressBar value={unlockedCount} max={achievements.length || 1} size="sm" variant="gold" />
            </div>
            <div className="px-5 py-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border border-amber-500/20">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                XP Earned
              </div>
              <div className="text-2xl font-bold text-foreground">
                {totalXPFromAchievements}
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <p className="text-muted-foreground mb-4">Loading achievements from your progress...</p>
        )}
        {error && !loading && (
          <p className="text-sm text-red-400 mb-4">{error}</p>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            ["all", "All"],
            ["unlocked", "Unlocked"],
            ["in_progress", "In progress"],
            ["locked", "Locked"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                filter === key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        
        {/* Achievement Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>
      </main>
    </div>
  );
};

const AchievementCard: React.FC<{ achievement: Achievement }> = ({ achievement }) => {
  const { unlocked, rarity, progress } = achievement;
  
  return (
    <div className={`relative p-6 rounded-xl border transition-all duration-300 ${
      unlocked 
        ? 'bg-card border-border hover:border-primary/50' 
        : 'bg-secondary/30 border-border/50 opacity-70'
    }`}>
      {/* Rarity indicator */}
      <div className="absolute top-4 right-4">
        <Badge 
          variant="glass" 
          className={`text-xs bg-gradient-to-r ${rarityColors[rarity]} text-white border-0`}
        >
          {rarityLabels[rarity]}
        </Badge>
      </div>
      
      {/* Icon */}
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${
        unlocked 
          ? `bg-gradient-to-br ${rarityColors[rarity]} text-white shadow-lg`
          : `bg-gradient-to-br ${rarityColors[rarity]} text-white/40 shadow`
      }`}>
        {achievement.icon}
      </div>
      
      {/* Content */}
      <h3 className="text-lg font-bold text-foreground mb-1">
        {achievement.title}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {achievement.description}
      </p>
      
      {/* Progress or XP */}
      {progress && !unlocked ? (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{progress.current}/{progress.max}</span>
          </div>
          <ProgressBar value={progress.current} max={progress.max} size="sm" />
        </div>
      ) : (
        <Badge variant={unlocked ? 'gold' : 'outline'} className="flex items-center gap-1 w-fit">
          <Sparkles className="w-3 h-3" />
          {achievement.xp} XP
        </Badge>
      )}
      
      {/* Unlocked indicator */}
      {unlocked && (
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-success flex items-center justify-center shadow-lg">
          <Sparkles className="w-4 h-4 text-success-foreground" />
        </div>
      )}
    </div>
  );
};

export default Achievements;
