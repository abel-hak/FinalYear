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
  Lock
} from 'lucide-react';
import { fetchProgress } from '@/api/backend';

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

const buildAchievements = (
  completedCount: number,
  totalQuests: number,
  totalXP: number
): Achievement[] => {
  return [
    {
      id: 'first-quest',
      title: 'First Fix',
      description: 'Complete your first debugging quest',
      icon: <Bug className="w-6 h-6" />,
      xp: 50,
      unlocked: completedCount >= 1,
      rarity: 'common',
      progress: { current: Math.min(completedCount, 1), max: 1 },
    },
    {
      id: 'three-quests',
      title: 'Quest Trio',
      description: 'Complete 3 debugging quests',
      icon: <Target className="w-6 h-6" />,
      xp: 150,
      unlocked: completedCount >= 3,
      rarity: 'rare',
      progress: { current: Math.min(completedCount, 3), max: 3 },
    },
    {
      id: 'all-quests',
      title: 'Python Path Complete',
      description: 'Complete all available quests',
      icon: <Code2 className="w-6 h-6" />,
      xp: 300,
      unlocked: totalQuests > 0 && completedCount === totalQuests,
      rarity: 'epic',
      progress: { current: completedCount, max: totalQuests || 1 },
    },
    {
      id: 'xp-collector',
      title: 'XP Collector',
      description: 'Earn at least 30 XP',
      icon: <Zap className="w-6 h-6" />,
      xp: 100,
      unlocked: totalXP >= 30,
      rarity: 'rare',
      progress: { current: Math.min(totalXP, 30), max: 30 },
    },
  ];
};

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

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const progress = await fetchProgress();
        const completed = progress.quests.filter((q) => q.status === 'completed').length;
        const list = buildAchievements(completed, progress.quests.length, progress.total_points);
        setAchievements(list);
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
            <div className="px-4 py-3 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Trophy className="w-4 h-4 text-gold" />
                Unlocked
              </div>
              <div className="text-2xl font-bold text-foreground">
                {unlockedCount}/{achievements.length || 0}
              </div>
            </div>
            <div className="px-4 py-3 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Sparkles className="w-4 h-4 text-gold" />
                XP (from achievements)
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
        
        {/* Achievement Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map((achievement) => (
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
          : 'bg-muted text-muted-foreground'
      }`}>
        {unlocked ? achievement.icon : <Lock className="w-6 h-6" />}
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
