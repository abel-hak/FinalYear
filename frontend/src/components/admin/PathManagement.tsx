import { useState, useEffect } from "react";
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
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  fetchAdminLearningPaths,
  createAdminLearningPath,
  updateAdminLearningPath,
  deleteAdminLearningPath,
  fetchAdminPathQuests,
  addQuestToPath,
  removeQuestFromPath,
  fetchAdminQuests,
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
  const [editingPath, setEditingPath] = useState<AdminLearningPathDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminLearningPathDto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedPathId, setExpandedPathId] = useState<string | null>(null);
  const [pathQuests, setPathQuests] = useState<Record<string, AdminPathQuestDto[]>>({});
  const [addQuestPathId, setAddQuestPathId] = useState<string | null>(null);
  const [availableQuests, setAvailableQuests] = useState<AdminQuestDto[]>([]);

  const loadPaths = async () => {
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
  };

  useEffect(() => {
    loadPaths();
  }, []);

  useEffect(() => {
    if (addQuestPathId) {
      fetchAdminQuests()
        .then((q) => setAvailableQuests(q.filter((x) => !x.is_deleted)))
        .catch(() => setAvailableQuests([]));
    }
  }, [addQuestPathId]);

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
    setEditorOpen(true);
  };

  const handleEdit = (path: AdminLearningPathDto) => {
    setEditingPath(path);
    setEditorOpen(true);
  };

  const handleSavePath = async (data: {
    title: string;
    description: string;
    level: number;
    order_rank: number;
  }) => {
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
      loadPaths();
    } catch (e) {
      toast({
        title: "Failed to save",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
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

  const handleAddQuest = async (pathId: string, questId: string) => {
    try {
      await addQuestToPath(pathId, questId);
      loadPathQuests(pathId);
      loadPaths();
      setAddQuestPathId(null);
      toast({ title: "Quest added to path" });
    } catch (e) {
      toast({
        title: "Failed to add quest",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
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
          Create and manage learning paths. Assign quests to each path for level-by-level progression.
        </p>
        <Button className="gap-2" onClick={handleCreate}>
          <Plus className="w-4 h-4" />
          Add Path
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3">
          {paths.map((path) => (
            <motion.div key={path.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
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
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-medium truncate">{path.title}</h3>
                        <Badge variant="outline" className="bg-primary/10 text-primary">
                          Level {path.level}
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
                          Edit
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
                    <Button variant="outline" size="sm" onClick={() => handleExpand(path.id)}>
                      {expandedPathId === path.id ? "Hide" : "Manage quests"}
                    </Button>
                  </div>

                  {expandedPathId === path.id && (
                    <div className="mt-4 pt-4 border-t border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Quests in path</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAddQuestPathId(addQuestPathId === path.id ? null : path.id)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add quest
                        </Button>
                      </div>
                      {addQuestPathId === path.id && (
                        <div className="flex gap-2 items-center flex-wrap">
                          <Select
                            onValueChange={(questId) => {
                              handleAddQuest(path.id, questId);
                            }}
                          >
                            <SelectTrigger className="w-[280px]">
                              <SelectValue placeholder="Select a quest to add..." />
                            </SelectTrigger>
                            <SelectContent>
                              {availableQuests
                                .filter((q) => !(pathQuests[path.id] ?? []).some((pq) => pq.quest_id === q.id))
                                .map((q) => (
                                  <SelectItem key={q.id} value={q.id}>
                                    {q.title} (Level {q.level})
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="icon" onClick={() => setAddQuestPathId(null)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
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

const PathEditorDialog = ({
  open,
  onOpenChange,
  path,
  nextOrderRank,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  path: AdminLearningPathDto | null;
  nextOrderRank: number;
  onSave: (data: { title: string; description: string; level: number; order_rank: number }) => void;
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState(1);
  const [orderRank, setOrderRank] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(path?.title ?? "");
      setDescription(path?.description ?? "");
      setLevel(path?.level ?? 1);
      setOrderRank(path?.order_rank ?? nextOrderRank);
    }
  }, [open, path, nextOrderRank]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ title, description, level, order_rank: orderRank });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{path ? "Edit path" : "Create path"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
