import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  BookOpen,
  Loader2,
  GripVertical,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  fetchAdminLearningPaths,
  createAdminLearningPath,
  updateAdminLearningPath,
  deleteAdminLearningPath,
  fetchAdminPathQuests,
  fetchAdminQuests,
  removeQuestFromPath,
  type AdminLearningPathDto,
  type AdminPathQuestDto,
  type AdminQuestDto,
} from "@/api/backend";
import { useToast } from "@/components/ui/use-toast";

export const PathManagement = () => {
  const { toast } = useToast();
  const [paths, setPaths] = useState<AdminLearningPathDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit" | "assign">("create");
  const [editingPath, setEditingPath] = useState<AdminLearningPathDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminLearningPathDto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedPathId, setExpandedPathId] = useState<string | null>(null);
  const [pathQuests, setPathQuests] = useState<Record<string, AdminPathQuestDto[]>>({});

  const loadPaths = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminLearningPaths();
      setPaths(data);
    } catch (e) {
      toast({
        title: "Failed to load paths",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPaths();
  }, [loadPaths]);

  const loadPathQuests = async (pathId: string) => {
    try {
      const data = await fetchAdminPathQuests(pathId);
      setPathQuests((prev) => ({ ...prev, [pathId]: data }));
    } catch {
      setPathQuests((prev) => ({ ...prev, [pathId]: [] }));
    }
  };

  const handleExpand = (pathId: string) => {
    if (expandedPathId === pathId) {
      setExpandedPathId(null);
    } else {
      setExpandedPathId(pathId);
      loadPathQuests(pathId);
    }
  };

  const handleCreate = () => {
    setEditingPath(null);
    setEditorMode("create");
    setEditorOpen(true);
  };

  const handleEdit = (path: AdminLearningPathDto) => {
    setEditingPath(path);
    setEditorMode("edit");
    setEditorOpen(true);
  };

  const handleAssignCreator = (path: AdminLearningPathDto) => {
    setEditingPath(path);
    setEditorMode("assign");
    setEditorOpen(true);
  };

  const handleSavePath = async (data: {
    title: string;
    description: string;
    level: number;
    order_rank: number;
    language: string;
    checkpoint_quest_id?: string | null;
    creator_email?: string | null;
  }): Promise<boolean> => {
    try {
      if (editingPath) {
        await updateAdminLearningPath(editingPath.id, data);
        toast({ title: "Path updated" });
      } else {
        await createAdminLearningPath(data);
        toast({ title: "Path created" });
      }
      setEditorOpen(false);
      setEditingPath(null);
      await loadPaths();
      return true;
    } catch (e) {
      toast({
        title: "Failed to save",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAdminLearningPath(deleteTarget.id);
      setPaths((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast({ title: "Path deleted" });
      setDeleteTarget(null);
    } catch (e) {
      toast({
        title: "Failed to delete",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleRemoveQuest = async (pathId: string, questId: string) => {
    try {
      await removeQuestFromPath(pathId, questId);
      loadPathQuests(pathId);
      loadPaths();
      toast({ title: "Quest removed from path" });
    } catch (e) {
      toast({
        title: "Failed to remove quest",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const nextOrderRank = paths.length > 0 ? Math.max(...paths.map((p) => p.order_rank)) + 1 : 1;

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          Create and manage learning paths. Assign quests inside each path, and invite a creator by email when a path needs an owner.
        </p>
        <Button className="gap-2" onClick={handleCreate}>
          <Plus className="w-4 h-4" />
          Add Path
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[88px] w-full rounded-xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {paths.map((path) => (
            <motion.div key={path.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="hover:border-primary/40 transition-colors bg-secondary/10 hover:bg-secondary/20 group">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => handleExpand(path.id)}
                    >
                      <GripVertical className="w-4 h-4" />
                    </Button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">{path.title}</h3>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          Level {path.level}
                        </Badge>
                        <Badge variant="outline" className="bg-secondary/40 text-foreground border-border">
                          {(path.language ?? "python").toUpperCase()}
                        </Badge>
                          <Badge
                            variant="outline"
                            className={path.creator_user_id ? "bg-emerald-500/10 text-emerald-200 border-emerald-500/20" : "bg-muted/40 text-muted-foreground border-border"}
                          >
                            {path.creator_email ? `Creator: ${path.creator_email}` : path.creator_user_id ? "Creator assigned" : "No creator"}
                          </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{path.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{path.quest_count} quests</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2" onClick={() => handleEdit(path)}>
                          <Pencil className="w-4 h-4" />
                          Edit details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget(path)}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" size="sm" onClick={() => handleAssignCreator(path)}>
                      <BookOpen className="w-4 h-4 mr-1" />
                      Assign creator
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleExpand(path.id)}>
                      {expandedPathId === path.id ? "Hide quests" : "Open quests"}
                    </Button>
                  </div>

                  {expandedPathId === path.id && (
                    <div className="mt-4 pt-4 border-t border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Quests in path</span>
                        <span className="text-xs text-muted-foreground">Create quests inside the path editor or remove them here.</span>
                      </div>
                      <div className="space-y-2">
                        {(pathQuests[path.id] ?? []).length === 0 ? (
                          <p className="text-sm text-muted-foreground py-2">
                            No quests yet. Add quests to build this path.
                          </p>
                        ) : (
                          (pathQuests[path.id] ?? []).map((pq) => (
                            <div
                              key={pq.id}
                              className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50"
                            >
                              <div>
                                <span className="font-medium">{pq.quest_title}</span>
                                <span className="text-sm text-muted-foreground ml-2">(Level {pq.quest_level})</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={() => handleRemoveQuest(path.id, pq.quest_id)}
                              >
                                Remove
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && paths.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No learning paths yet. Create your first path!</p>
        </div>
      )}

      <PathEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        path={editingPath}
        mode={editorMode}
        nextOrderRank={nextOrderRank}
        onSave={handleSavePath}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete path?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete &quot;{deleteTarget?.title}&quot; and remove all quest assignments. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const LANGUAGE_OPTIONS: { value: string; label: string }[] = [
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
];

const PathEditorDialog = ({
  open,
  onOpenChange,
  path,
  mode,
  nextOrderRank,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  path: AdminLearningPathDto | null;
  mode: "create" | "edit" | "assign";
  nextOrderRank: number;
  onSave: (data: {
    title: string;
    description: string;
    level: number;
    order_rank: number;
    language: string;
    checkpoint_quest_id?: string | null;
    creator_email?: string | null;
  }) => Promise<boolean>;
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState(1);
  const [orderRank, setOrderRank] = useState(1);
  const [language, setLanguage] = useState<string>("python");
  const [creatorEmail, setCreatorEmail] = useState("");
  const [checkpointQuest, setCheckpointQuest] = useState<string | null>(null);
  const [allQuests, setAllQuests] = useState<AdminQuestDto[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(path?.title ?? "");
      setDescription(path?.description ?? "");
      setLevel(path?.level ?? 1);
      setOrderRank(path?.order_rank ?? nextOrderRank);
      setLanguage(path?.language ?? "python");
      setCreatorEmail(path?.creator_email ?? "");
      setCheckpointQuest(path?.checkpoint_quest_id ?? null);
      fetchAdminQuests().then((q) => setAllQuests(q.filter((x) => !x.is_deleted))).catch(() => setAllQuests([]));
    }
  }, [open, path, nextOrderRank]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const saved = await onSave({
        title,
        description,
        level,
        order_rank: orderRank,
        language,
        checkpoint_quest_id: checkpointQuest ?? null,
        creator_email: creatorEmail.trim() || null,
      });
      if (saved) {
        onOpenChange(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "assign" ? "Assign creator" : path ? "Edit path" : "Create path"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "assign" && path && (
            <div className="rounded-lg border border-border/70 bg-muted/30 p-4 space-y-1">
              <p className="text-sm font-medium text-foreground">{path.title}</p>
              <p className="text-xs text-muted-foreground">
                {path.description}
              </p>
              <p className="text-xs text-muted-foreground">
                Level {path.level} · {(path.language ?? "python").toUpperCase()}
              </p>
            </div>
          )}

          {mode !== "assign" && (
            <>
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Python Basics"
              required
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this path"
              required
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Level</label>
              <Select value={String(level)} onValueChange={(v) => setLevel(Number(v))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Beginner</SelectItem>
                  <SelectItem value="2">2 - Intermediate</SelectItem>
                  <SelectItem value="3">3 - Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Order</label>
              <Input
                type="number"
                min={1}
                value={orderRank}
                onChange={(e) => setOrderRank(Number(e.target.value) || 1)}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Language</label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Quests in a path should match this language. Progression is independent per language.
            </p>
          </div>
            </>
          )}
          <div>
            <label className="text-sm font-medium">Creator email</label>
            <Input
              type="email"
              value={creatorEmail}
              onChange={(e) => setCreatorEmail(e.target.value)}
              placeholder="creator@example.com"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave blank to keep the current creator assignment. Enter an email to invite or replace the pending creator invite for this learning path.
            </p>
          </div>
          {mode !== "assign" && (
          <div>
            <label className="text-sm font-medium">Checkpoint quest (optional)</label>
            <Select value={checkpointQuest ?? ""} onValueChange={(v) => setCheckpointQuest(v || null)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {allQuests
                  .filter((q) => !q.is_deleted)
                  .map((q) => (
                    <SelectItem key={q.id} value={q.id}>
                      {q.title} (Level {q.level})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">Optional quest that, when solved, unlocks this path.</p>
          </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : path ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
