import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Play, Code2, Bug, Lightbulb, Trophy } from 'lucide-react';

const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/20 blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent/20 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full bg-pink-500/10 blur-3xl animate-float" style={{ animationDelay: '4s' }} />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>
      
      <div className="container relative z-10 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <Badge variant="glass" className="mb-6 px-4 py-2 text-sm animate-fade-in">
            <Sparkles className="w-4 h-4 mr-2 text-gold" />
            Learn debugging through quests
          </Badge>
          
          {/* Main heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight animate-slide-up">
            Master the Art of
            <span className="block gradient-text mt-2">
              Debugging Code
            </span>
          </h1>
          
          {/* Subheading */}
          <p className="text-xl sm:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Fix broken code, earn XP, and unlock programming concepts. 
            Break free from tutorial hell with hands-on debugging quests.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/quests">
              <Button variant="hero" size="xl" className="group">
                <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Start Your Quest
              </Button>
            </Link>
          </div>
          
          {/* Feature pills */}
          <div className="flex flex-wrap items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <FeaturePill icon={<Bug className="w-4 h-4" />} text="Debug Real Errors" />
            <FeaturePill icon={<Lightbulb className="w-4 h-4" />} text="Progressive Hints" />
            <FeaturePill icon={<Trophy className="w-4 h-4" />} text="Earn Achievements" />
            <FeaturePill icon={<Code2 className="w-4 h-4" />} text="Python Focused" />
          </div>
        </div>
        
        {/* Floating code snippets */}
        <div className="hidden lg:block">
          <FloatingCode 
            code="def fix_bug():"
            className="absolute top-1/4 left-10 -rotate-6"
            delay="0s"
          />
          <FloatingCode 
            code="# Find the error"
            className="absolute top-1/3 right-16 rotate-3"
            delay="1s"
          />
          <FloatingCode 
            code="print('Success!')"
            className="absolute bottom-1/4 left-20 rotate-3"
            delay="2s"
          />
        </div>
      </div>
    </section>
  );
};

const FeaturePill: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border text-sm text-foreground">
    <span className="text-primary">{icon}</span>
    {text}
  </div>
);

const FloatingCode: React.FC<{ code: string; className?: string; delay?: string }> = ({ 
  code, 
  className,
  delay = '0s'
}) => (
  <div 
    className={`px-4 py-2 rounded-lg bg-code-bg border border-border font-mono text-sm text-code-keyword animate-float ${className}`}
    style={{ animationDelay: delay }}
  >
    {code}
  </div>
);

export default HeroSection;
