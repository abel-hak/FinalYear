import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, ChevronRight, ChevronDown, Code2, Lightbulb, ExternalLink, Bookmark, BookmarkCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAggregatedResources, getBestUrlForConcept } from '@/lib/conceptResources';

interface CodeExample {
  title: string;
  code: string;
  explanation: string;
}

interface ConceptSection {
  title: string;
  content: string;
  codeExamples?: CodeExample[];
}

interface KnowledgeScrollProps {
  concept: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  sections: ConceptSection[];
  relatedConcepts?: string[];
  onClose?: () => void;
}

const KnowledgeScroll: React.FC<KnowledgeScrollProps> = ({
  concept,
  title,
  description,
  difficulty,
  sections,
  relatedConcepts = [],
  onClose
}) => {
  const [expandedSections, setExpandedSections] = useState<number[]>([0]);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const openConceptLink = (label: string) => {
    const url = getBestUrlForConcept(label);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const resources = getAggregatedResources(relatedConcepts);

  const toggleSection = (index: number) => {
    setExpandedSections(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const difficultyColors = {
    beginner: 'bg-success/20 text-success border-success/30',
    intermediate: 'bg-warning/20 text-warning border-warning/30',
    advanced: 'bg-destructive/20 text-destructive border-destructive/30'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/20 to-accent/10 p-6 border-b border-border">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              className="p-3 rounded-xl bg-primary/20"
              whileHover={{ rotate: 10, scale: 1.1 }}
            >
              <Book className="w-6 h-6 text-primary" />
            </motion.div>
            <div>
              <Badge variant="outline" className="mb-2 text-xs">
                {concept}
              </Badge>
              <h2 className="text-2xl font-bold text-foreground">{title}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsBookmarked(!isBookmarked)}
              className="hover:bg-gold/20"
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-5 h-5 text-gold" />
              ) : (
                <Bookmark className="w-5 h-5" />
              )}
            </Button>
            <Badge className={difficultyColors[difficulty]}>
              {difficulty}
            </Badge>
          </div>
        </div>
        <p className="text-muted-foreground">{description}</p>
      </div>

      {/* Content */}
      <ScrollArea className="h-[500px]">
        <div className="p-6 space-y-4">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border border-border rounded-xl overflow-hidden"
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(index)}
                className="w-full flex items-center justify-between p-4 bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                    {index + 1}
                  </div>
                  <span className="font-semibold text-foreground">{section.title}</span>
                </div>
                <motion.div
                  animate={{ rotate: expandedSections.includes(index) ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </motion.div>
              </button>

              {/* Section Content */}
              <AnimatePresence>
                {expandedSections.includes(index) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="p-4 space-y-4">
                      <p className="text-muted-foreground leading-relaxed">
                        {section.content}
                      </p>

                      {/* Code Examples */}
                      {section.codeExamples && section.codeExamples.map((example, exIndex) => (
                        <motion.div
                          key={exIndex}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 * exIndex }}
                          className="rounded-xl overflow-hidden border border-border"
                        >
                          <div className="flex items-center justify-between px-4 py-2 bg-code-bg border-b border-border">
                            <div className="flex items-center gap-2">
                              <Code2 className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium text-foreground">{example.title}</span>
                            </div>
                            <div className="flex gap-1">
                              <div className="w-3 h-3 rounded-full bg-destructive/60" />
                              <div className="w-3 h-3 rounded-full bg-warning/60" />
                              <div className="w-3 h-3 rounded-full bg-success/60" />
                            </div>
                          </div>
                          <pre className="p-4 bg-code-bg overflow-x-auto">
                            <code className="text-sm font-mono text-code-syntax-string">
                              {example.code}
                            </code>
                          </pre>
                          <div className="p-3 bg-secondary/30 flex items-start gap-2">
                            <Lightbulb className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-muted-foreground">{example.explanation}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}

          {/* Related Concepts */}
          {relatedConcepts.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 p-4 rounded-xl bg-accent/10 border border-accent/30"
            >
              <h3 className="text-sm font-semibold text-accent mb-3 flex items-center gap-2">
                <ChevronRight className="w-4 h-4" />
                Related Concepts
              </h3>
              <div className="flex flex-wrap gap-2">
                {relatedConcepts.map((concept, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openConceptLink(concept)}
                    className="px-3 py-1.5 rounded-lg bg-accent/20 text-accent text-sm hover:bg-accent/30 transition-colors flex items-center gap-1"
                  >
                    {concept}
                    <ExternalLink className="w-3 h-3" />
                  </motion.button>
                ))}
              </div>

              {resources.length > 0 && (
                <div className="mt-4 border-t border-accent/20 pt-3 space-y-2">
                  <div className="text-xs font-semibold text-accent/90">Resources</div>
                  <ul className="space-y-1">
                    {resources.slice(0, 6).map((r) => (
                      <li key={r.url} className="text-xs">
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-accent hover:underline"
                        >
                          {r.label}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        {r.source && (
                          <span className="ml-2 text-muted-foreground">({r.source})</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border bg-secondary/20 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lightbulb className="w-4 h-4 text-gold" />
          <span>Practice this concept in quests to master it!</span>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default KnowledgeScroll;
