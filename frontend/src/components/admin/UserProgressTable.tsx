import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { fetchAdminUsers, type AdminUserProgressDto } from "@/api/backend";
import { useToast } from "@/components/ui/use-toast";

function formatLastActive(iso: string | null): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

export const UserProgressTable = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUserProgressDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchAdminUsers()
      .then((data) => { if (!cancelled) setUsers(data); })
      .catch((e) => {
        if (!cancelled) {
          toast({ title: "Failed to load users", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [toast]);

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
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

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right">XP</TableHead>
                  <TableHead>Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const pct = user.total_quests > 0 ? (user.quests_completed / user.total_quests) * 100 : 0;
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {user.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{user.username}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>{user.quests_completed}/{user.total_quests} quests</span>
                            <span>{Math.round(pct)}%</span>
                          </div>
                          <Progress value={pct} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{user.xp_earned.toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatLastActive(user.last_active)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredUsers.map((user) => {
              const pct = user.total_quests > 0 ? (user.quests_completed / user.total_quests) * 100 : 0;
              return (
                <div key={user.id} className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.username}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span>{user.quests_completed}/{user.total_quests} ({Math.round(pct)}%)</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{user.xp_earned.toLocaleString()} XP</span>
                    <span className="text-muted-foreground">{formatLastActive(user.last_active)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {!loading && filteredUsers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>{searchQuery ? "No users match your search." : "No learners yet."}</p>
        </div>
      )}
    </div>
  );
};
