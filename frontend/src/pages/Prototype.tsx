import React from 'react';
import Header from '@/components/Header';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Smartphone, 
  Monitor, 
  Layout, 
  Layers,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Prototype: React.FC = () => {
  // Get the current URL for the QR code
  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://codequest.app';
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <Badge variant="accent" className="mb-4">
            <Layout className="w-3.5 h-3.5 mr-1" />
            Prototype View
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            CodeQuest UI Prototype
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore the user interface design for CodeQuest. Scan the QR code to access on mobile, 
            or browse the different screens below.
          </p>
        </div>
        
        {/* QR Code Section */}
        <div className="mb-16">
          <QRCodeDisplay 
            url={currentUrl}
            title="Quick Access QR Code"
          />
        </div>
        
        {/* Screen Showcase */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
            Key Screens
          </h2>
          
          <Tabs defaultValue="home" className="w-full">
            <TabsList className="grid w-full max-w-xl mx-auto grid-cols-4 mb-8">
              <TabsTrigger value="home">Home</TabsTrigger>
              <TabsTrigger value="quests">Quests</TabsTrigger>
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="success">Success</TabsTrigger>
            </TabsList>
            
            <TabsContent value="home" className="space-y-4">
              <ScreenCard
                title="Landing Page"
                description="Hero section with animated elements, feature highlights, and call-to-action buttons to start learning."
                features={['Animated background effects', 'Featured quests showcase', 'Statistics display', 'Responsive design']}
                link="/"
              />
            </TabsContent>
            
            <TabsContent value="quests" className="space-y-4">
              <ScreenCard
                title="Quest Map"
                description="Browse all available quests with filtering options, progress tracking, and visual status indicators."
                features={['Difficulty filters', 'Progress bar', 'XP tracking', 'Status badges']}
                link="/quests"
              />
            </TabsContent>
            
            <TabsContent value="editor" className="space-y-4">
              <ScreenCard
                title="Code Editor"
                description="Interactive code editing interface with syntax highlighting, error indicators, and hint system."
                features={['Syntax highlighting', 'Error line highlighting', 'Progressive hints', 'Run/Reset buttons']}
                link="/quest/1"
              />
            </TabsContent>
            
            <TabsContent value="success" className="space-y-4">
              <ScreenCard
                title="Success State"
                description="Celebration screen when a quest is completed, with concept explanation unlocking."
                features={['Success animation', 'Output display', 'Knowledge Scroll unlock', 'Concept deep-dive']}
                link="/quest/1"
              />
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Design System Preview */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
            Design System
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Colors */}
            <div className="p-6 rounded-xl bg-card border border-border">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Color Palette
              </h3>
              <div className="space-y-3">
                <ColorSwatch color="bg-primary" label="Primary" />
                <ColorSwatch color="bg-accent" label="Accent" />
                <ColorSwatch color="bg-success" label="Success" />
                <ColorSwatch color="bg-warning" label="Warning" />
                <ColorSwatch color="bg-destructive" label="Destructive" />
                <ColorSwatch color="bg-gradient-to-r from-amber-400 to-yellow-500" label="Gold" />
              </div>
            </div>
            
            {/* Buttons */}
            <div className="p-6 rounded-xl bg-card border border-border">
              <h3 className="font-semibold text-foreground mb-4">Button Variants</h3>
              <div className="space-y-3">
                <Button variant="hero" size="sm" className="w-full">Hero Button</Button>
                <Button variant="default" size="sm" className="w-full">Primary</Button>
                <Button variant="outline" size="sm" className="w-full">Outline</Button>
                <Button variant="gold" size="sm" className="w-full">Gold</Button>
                <Button variant="glass" size="sm" className="w-full">Glass</Button>
              </div>
            </div>
            
            {/* Badges */}
            <div className="p-6 rounded-xl bg-card border border-border">
              <h3 className="font-semibold text-foreground mb-4">Badge Variants</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">Default</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="gold">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Gold
                </Badge>
                <Badge variant="accent">Accent</Badge>
                <Badge variant="glass">Glass</Badge>
              </div>
            </div>
          </div>
        </section>
        
        {/* Quick Links */}
        <section className="text-center">
          <h2 className="text-xl font-bold text-foreground mb-6">
            Explore the Prototype
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/">
              <Button variant="outline">
                <Monitor className="w-4 h-4 mr-2" />
                Home Page
              </Button>
            </Link>
            <Link to="/quests">
              <Button variant="outline">
                Quest Map
              </Button>
            </Link>
            <Link to="/quest/1">
              <Button variant="hero">
                Try a Quest
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

const ScreenCard: React.FC<{
  title: string;
  description: string;
  features: string[];
  link: string;
}> = ({ title, description, features, link }) => (
  <div className="p-6 rounded-xl bg-card border border-border">
    <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
    <p className="text-muted-foreground mb-4">{description}</p>
    <ul className="space-y-2 mb-6">
      {features.map((feature, i) => (
        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          {feature}
        </li>
      ))}
    </ul>
    <Link to={link}>
      <Button variant="outline" className="w-full group">
        View Screen
        <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
      </Button>
    </Link>
  </div>
);

const ColorSwatch: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div className="flex items-center gap-3">
    <div className={`w-8 h-8 rounded-lg ${color}`} />
    <span className="text-sm text-muted-foreground">{label}</span>
  </div>
);

export default Prototype;
