import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff,
  GripVertical,
  Search
} from "lucide-react";
import { motion, Reorder } from "framer-motion";

interface Quest {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  xp: number;
  isPublished: boolean;
  completions: number;
}

const initialQuests: Quest[] = [
  { id: '1', title: 'Hello World - Your First Program', difficulty: 'easy', xp: 100, isPublished: true, completions: 245 },
  { id: '2', title: 'Variable Vault', difficulty: 'easy', xp: 150, isPublished: true, completions: 198 },
  { id: '3', title: 'Loop Legend', difficulty: 'medium', xp: 200, isPublished: true, completions: 156 },
  { id: '4', title: 'Function Fortress', difficulty: 'medium', xp: 250, isPublished: true, completions: 134 },
  { id: '5', title: 'Array Adventure', difficulty: 'medium', xp: 300, isPublished: false, completions: 0 },
  { id: '6', title: 'Object Odyssey', difficulty: 'hard', xp: 400, isPublished: false, completions: 0 },
];

const difficultyColors = {
  easy: 'bg-green-500/10 text-green-600 border-green-500/20',
  medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  hard: 'bg-red-500/10 text-red-600 border-red-500/20',
};

export const ContentManagement = () => {
  const [quests, setQuests] = useState(initialQuests);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredQuests = quests.filter(quest =>
    quest.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const togglePublish = (id: string) => {
    setQuests(quests.map(q => 
      q.id === id ? { ...q, isPublished: !q.isPublished } : q
    ));
  };

  const deleteQuest = (id: string) => {
    setQuests(quests.filter(q => q.id !== id));
  };

  const duplicateQuest = (quest: Quest) => {
    const newQuest = {
      ...quest,
      id: Date.now().toString(),
      title: `${quest.title} (Copy)`,
      isPublished: false,
      completions: 0,
    };
    setQuests([...quests, newQuest]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search quests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Quest
        </Button>
      </div>

      <Reorder.Group axis="y" values={quests} onReorder={setQuests} className="space-y-3">
        {filteredQuests.map((quest) => (
          <Reorder.Item key={quest.id} value={quest}>
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className={`transition-all ${!quest.isPublished ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab active:cursor-grabbing" />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-medium truncate">{quest.title}</h3>
                        <Badge variant="outline" className={difficultyColors[quest.difficulty]}>
                          {quest.difficulty}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>⭐ {quest.xp} XP</span>
                        <span>👥 {quest.completions} completions</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {quest.isPublished ? (
                          <Eye className="w-4 h-4 text-green-500" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-muted-foreground" />
                        )}
                        <Switch
                          checked={quest.isPublished}
                          onCheckedChange={() => togglePublish(quest.id)}
                        />
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2">
                            <Pencil className="w-4 h-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="gap-2"
                            onClick={() => duplicateQuest(quest)}
                          >
                            <Copy className="w-4 h-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="gap-2 text-destructive focus:text-destructive"
                            onClick={() => deleteQuest(quest.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {filteredQuests.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No quests found matching your search.</p>
        </div>
      )}
    </div>
  );
};
