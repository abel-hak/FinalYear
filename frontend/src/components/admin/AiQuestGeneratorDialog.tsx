import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles } from "lucide-react";
import { generateAdminQuestDraft, type AdminQuestAIDraftResponseDto } from "@/api/backend";
import { useToast } from "@/components/ui/use-toast";

export function AiQuestGeneratorDialog({
  open,
  onOpenChange,
  defaultDifficulty = 1,
  onDraft,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDifficulty?: number;
  onDraft: (draft: AdminQuestAIDraftResponseDto) => void;
}) {
  const { toast } = useToast();
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState(defaultDifficulty);
  const [bugType, setBugType] = useState("");
  const [extra, setExtra] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim() || !bugType.trim()) {
      toast({
        title: "Missing fields",
        description: "Please enter a topic and bug type.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const draft = await generateAdminQuestDraft({
        topic: topic.trim(),
        difficulty,
        bug_type: bugType.trim(),
        extra_instructions: extra.trim() ? extra.trim() : null,
      });
      onDraft(draft);
      toast({ title: "AI draft generated" });
      onOpenChange(false);
    } catch (e) {
      toast({
        title: "AI generation failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold" />
            Generate Quest with AI
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Topic</Label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. dictionaries, loops, slicing"
            />
          </div>
          <div className="grid gap-2">
            <Label>Difficulty (1–3)</Label>
            <Input
              type="number"
              min={1}
              max={3}
              value={difficulty}
              onChange={(e) => setDifficulty(parseInt(e.target.value, 10) || 1)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Bug type</Label>
            <Input
              value={bugType}
              onChange={(e) => setBugType(e.target.value)}
              placeholder="e.g. off-by-one, wrong key, wrong condition"
            />
          </div>
          <div className="grid gap-2">
            <Label>Extra instructions (optional)</Label>
            <Textarea
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              placeholder="Any constraints (keep it short)."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

