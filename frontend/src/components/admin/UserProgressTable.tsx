import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface UserProgress {
  id: string;
  name: string;
  email: string;
  questsCompleted: number;
  totalQuests: number;
  xpEarned: number;
  streak: number;
  lastActive: string;
  trend: 'up' | 'down' | 'stable';
}

const mockUsers: UserProgress[] = [
  { id: '1', name: 'Alex Chen', email: 'alex@example.com', questsCompleted: 12, totalQuests: 20, xpEarned: 2400, streak: 7, lastActive: '2 hours ago', trend: 'up' },
  { id: '2', name: 'Sarah Kim', email: 'sarah@example.com', questsCompleted: 8, totalQuests: 20, xpEarned: 1600, streak: 3, lastActive: '1 day ago', trend: 'stable' },
  { id: '3', name: 'Mike Johnson', email: 'mike@example.com', questsCompleted: 15, totalQuests: 20, xpEarned: 3200, streak: 14, lastActive: '30 min ago', trend: 'up' },
  { id: '4', name: 'Emma Davis', email: 'emma@example.com', questsCompleted: 5, totalQuests: 20, xpEarned: 900, streak: 0, lastActive: '5 days ago', trend: 'down' },
  { id: '5', name: 'James Wilson', email: 'james@example.com', questsCompleted: 18, totalQuests: 20, xpEarned: 4100, streak: 21, lastActive: '1 hour ago', trend: 'up' },
  { id: '6', name: 'Lisa Park', email: 'lisa@example.com', questsCompleted: 10, totalQuests: 20, xpEarned: 2000, streak: 5, lastActive: '4 hours ago', trend: 'stable' },
];

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
  if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
};

export const UserProgressTable = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredUsers = mockUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {/* Desktop Table View */}
      <div className="hidden md:block rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead className="text-right">XP</TableHead>
              <TableHead className="text-center">Streak</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="text-center">Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{user.questsCompleted}/{user.totalQuests} quests</span>
                      <span>{Math.round((user.questsCompleted / user.totalQuests) * 100)}%</span>
                    </div>
                    <Progress value={(user.questsCompleted / user.totalQuests) * 100} className="h-2" />
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">{user.xpEarned.toLocaleString()}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={user.streak > 7 ? "default" : user.streak > 0 ? "secondary" : "outline"}>
                    🔥 {user.streak}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{user.lastActive}</TableCell>
                <TableCell className="text-center">
                  <TrendIcon trend={user.trend} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredUsers.map((user) => (
          <div key={user.id} className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <TrendIcon trend={user.trend} />
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span>{user.questsCompleted}/{user.totalQuests} ({Math.round((user.questsCompleted / user.totalQuests) * 100)}%)</span>
              </div>
              <Progress value={(user.questsCompleted / user.totalQuests) * 100} className="h-2" />
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="font-medium">{user.xpEarned.toLocaleString()} XP</span>
                <Badge variant={user.streak > 7 ? "default" : user.streak > 0 ? "secondary" : "outline"}>
                  🔥 {user.streak}
                </Badge>
              </div>
              <span className="text-muted-foreground">{user.lastActive}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
