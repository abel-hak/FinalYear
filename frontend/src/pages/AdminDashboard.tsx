import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  BarChart3, 
  FileText, 
  Trophy,
  Target,
  Loader2,
  BookOpen
} from "lucide-react";
import Header from "@/components/Header";
import { UserProgressTable } from "@/components/admin/UserProgressTable";
import { QuestAnalytics } from "@/components/admin/QuestAnalytics";
import { ContentManagement } from "@/components/admin/ContentManagement";
import { PathManagement } from "@/components/admin/PathManagement";
import { fetchAdminStats, type AdminStatsDto } from "@/api/backend";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [stats, setStats] = useState<AdminStatsDto | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchAdminStats()
      .then((data) => { if (!cancelled) setStats(data); })
      .catch(() => { if (!cancelled) setStats(null); })
      .finally(() => { if (!cancelled) setStatsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const statCards = stats
    ? [
        { label: 'Total Users', value: stats.total_users.toLocaleString(), icon: Users, color: 'from-blue-500/20 to-cyan-500/20 text-cyan-400 border-cyan-500/30' },
        { label: 'Quests Completed', value: stats.quests_completed.toLocaleString(), icon: Trophy, color: 'from-amber-500/20 to-yellow-500/20 text-yellow-400 border-yellow-500/30' },
        { label: 'Total Quests', value: stats.total_quests.toLocaleString(), icon: FileText, color: 'from-emerald-500/20 to-green-500/20 text-green-400 border-green-500/30' },
        { label: 'Completion Rate', value: `${stats.completion_rate_pct}%`, icon: Target, color: 'from-purple-500/20 to-pink-500/20 text-pink-400 border-pink-500/30' },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-pink-500/5 rounded-full blur-[120px]" />
      </div>

      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Monitor learner progress and manage content
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statsLoading ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              statCards.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`relative overflow-hidden border ${stat.color.split(' ').find(c => c.startsWith('border-')) || 'border-border'} bg-card/50 backdrop-blur-xl hover:-translate-y-1 transition-all duration-300`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.color.split(' ').filter(c => c.startsWith('from-') || c.startsWith('to-')).join(' ')} opacity-50`} />
                    <CardContent className="p-6 relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-xl bg-background/50 backdrop-blur-sm border border-white/5`}>
                          <stat.icon className={`w-6 h-6 ${stat.color.split(' ').find(c => c.startsWith('text-') && !c.includes('/')) || ''}`} />
                        </div>
                      </div>
                      <div>
                        <p className="text-3xl font-bold tracking-tight text-white mb-1">{stat.value}</p>
                        <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-2xl grid-cols-4">
              <TabsTrigger value="users" className="gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger value="content" className="gap-2">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Quests</span>
              </TabsTrigger>
              <TabsTrigger value="paths" className="gap-2">
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Paths</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4 focus-visible:outline-none">
              <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-xl">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4 text-foreground">User Progress</h2>
                  <UserProgressTable />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4 focus-visible:outline-none">
              <QuestAnalytics />
            </TabsContent>

            <TabsContent value="content" className="space-y-4 focus-visible:outline-none">
              <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-xl">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-foreground">
                    <FileText className="w-5 h-5 text-primary" />
                    Quest Management
                  </h2>
                  <ContentManagement />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="paths" className="space-y-4 focus-visible:outline-none">
              <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-xl">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-foreground">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Learning Paths
                  </h2>
                  <PathManagement />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
};

export default AdminDashboard;
