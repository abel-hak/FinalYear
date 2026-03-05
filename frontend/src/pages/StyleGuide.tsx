import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Check, X, AlertTriangle, Info, Star, Zap, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

const StyleGuide = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold">CodeQuest Style Guide</h1>
            <p className="text-muted-foreground">Design system documentation for Figma</p>
          </div>
        </div>

        {/* Color Palette */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold border-b pb-2">Color Palette</h2>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Core Colors</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <ColorSwatch name="Background" className="bg-background" textClass="text-foreground" />
              <ColorSwatch name="Foreground" className="bg-foreground" textClass="text-background" />
              <ColorSwatch name="Primary" className="bg-primary" textClass="text-primary-foreground" />
              <ColorSwatch name="Secondary" className="bg-secondary" textClass="text-secondary-foreground" />
              <ColorSwatch name="Muted" className="bg-muted" textClass="text-muted-foreground" />
              <ColorSwatch name="Accent" className="bg-accent" textClass="text-accent-foreground" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Semantic Colors</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <ColorSwatch name="Success" className="bg-success" textClass="text-success-foreground" />
              <ColorSwatch name="Warning" className="bg-warning" textClass="text-warning-foreground" />
              <ColorSwatch name="Destructive" className="bg-destructive" textClass="text-destructive-foreground" />
              <ColorSwatch name="Gold" className="bg-gold" textClass="text-gold-foreground" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">UI Colors</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <ColorSwatch name="Card" className="bg-card" textClass="text-card-foreground" />
              <ColorSwatch name="Popover" className="bg-popover" textClass="text-popover-foreground" />
              <ColorSwatch name="Border" className="bg-border" textClass="text-foreground" />
              <ColorSwatch name="Input" className="bg-input" textClass="text-foreground" />
              <ColorSwatch name="Ring" className="bg-ring" textClass="text-background" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Code Editor Colors</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <ColorSwatch name="Code BG" className="bg-code-bg" textClass="text-foreground" />
              <ColorSwatch name="Code Line" className="bg-code-line" textClass="text-foreground" />
              <ColorSwatch name="Keyword" className="bg-code-keyword" textClass="text-background" />
              <ColorSwatch name="String" className="bg-code-string" textClass="text-background" />
              <ColorSwatch name="Function" className="bg-code-function" textClass="text-background" />
              <ColorSwatch name="Comment" className="bg-code-comment" textClass="text-background" />
            </div>
          </div>
        </section>

        <Separator />

        {/* Typography */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold border-b pb-2">Typography</h2>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Font: Space Grotesk (sans-serif)</p>
              <h1 className="text-5xl font-bold">Heading 1 - 48px Bold</h1>
              <h2 className="text-4xl font-bold">Heading 2 - 36px Bold</h2>
              <h3 className="text-3xl font-bold">Heading 3 - 30px Bold</h3>
              <h4 className="text-2xl font-semibold">Heading 4 - 24px Semibold</h4>
              <h5 className="text-xl font-semibold">Heading 5 - 20px Semibold</h5>
              <h6 className="text-lg font-medium">Heading 6 - 18px Medium</h6>
            </div>
            
            <div className="space-y-2">
              <p className="text-base">Body - 16px Regular</p>
              <p className="text-sm">Small - 14px Regular</p>
              <p className="text-xs">Extra Small - 12px Regular</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Font: JetBrains Mono (monospace)</p>
              <code className="font-mono text-lg block">Code Text - Monospace</code>
              <pre className="font-mono text-sm bg-code-bg p-4 rounded-lg">
{`function debugCode() {
  const bug = findBug();
  return fixBug(bug);
}`}
              </pre>
            </div>
          </div>
        </section>

        <Separator />

        {/* Buttons */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold border-b pb-2">Buttons</h2>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Variants</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="default">Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="hero">Hero</Button>
                <Button variant="success">Success</Button>
                <Button variant="gold">Gold</Button>
                <Button variant="accent">Accent</Button>
                <Button variant="glass">Glass</Button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Sizes</h3>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="xl">Extra Large</Button>
                <Button size="icon"><Star className="w-4 h-4" /></Button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">With Icons</h3>
              <div className="flex flex-wrap gap-4">
                <Button><Zap className="w-4 h-4 mr-2" /> Start Quest</Button>
                <Button variant="success"><Check className="w-4 h-4 mr-2" /> Complete</Button>
                <Button variant="destructive"><X className="w-4 h-4 mr-2" /> Cancel</Button>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Badges */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold border-b pb-2">Badges</h2>
          
          <div className="flex flex-wrap gap-4">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Custom Badges</h3>
            <div className="flex flex-wrap gap-4">
              <Badge className="bg-success text-success-foreground">Success</Badge>
              <Badge className="bg-warning text-warning-foreground">Warning</Badge>
              <Badge className="bg-gold text-gold-foreground">Gold</Badge>
              <Badge className="bg-primary/20 text-primary border border-primary/30">Easy</Badge>
              <Badge className="bg-warning/20 text-warning border border-warning/30">Medium</Badge>
              <Badge className="bg-destructive/20 text-destructive border border-destructive/30">Hard</Badge>
            </div>
          </div>
        </section>

        <Separator />

        {/* Cards */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold border-b pb-2">Cards</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Default Card</CardTitle>
                <CardDescription>Standard card component</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Card content goes here</p>
              </CardContent>
            </Card>

            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-primary">Primary Card</CardTitle>
                <CardDescription>Highlighted card style</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Used for featured content</p>
              </CardContent>
            </Card>

            <Card className="border-success/30 bg-success/5">
              <CardHeader>
                <CardTitle className="text-success">Success Card</CardTitle>
                <CardDescription>Success state card</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Quest completed!</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Quest Card Style</h3>
            <div className="quest-card p-6 rounded-xl max-w-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">Sample Quest</h4>
                  <p className="text-sm text-muted-foreground">Debug the loop</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Badge className="bg-primary/20 text-primary">Easy</Badge>
                <span className="text-sm font-medium text-gold">+100 XP</span>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Form Elements */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold border-b pb-2">Form Elements</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Input</label>
                <Input placeholder="Enter text..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Disabled Input</label>
                <Input placeholder="Disabled" disabled />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Checkbox id="check1" />
                <label htmlFor="check1" className="text-sm">Checkbox</label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox id="check2" checked />
                <label htmlFor="check2" className="text-sm">Checked</label>
              </div>
              <div className="flex items-center gap-3">
                <Switch />
                <span className="text-sm">Switch</span>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Progress Bars */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold border-b pb-2">Progress Bars</h2>
          
          <div className="space-y-4 max-w-md">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>25% Complete</span>
                <span>25%</span>
              </div>
              <Progress value={25} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>50% Complete</span>
                <span>50%</span>
              </div>
              <Progress value={50} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>75% Complete</span>
                <span>75%</span>
              </div>
              <Progress value={75} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>100% Complete</span>
                <span>100%</span>
              </div>
              <Progress value={100} />
            </div>
          </div>
        </section>

        <Separator />

        {/* Avatars */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold border-b pb-2">Avatars</h2>
          
          <div className="flex flex-wrap items-center gap-4">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">SM</AvatarFallback>
            </Avatar>
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-primary/10 text-primary text-sm">MD</AvatarFallback>
            </Avatar>
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-primary/10 text-primary">LG</AvatarFallback>
            </Avatar>
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-primary/10 text-primary text-lg">XL</AvatarFallback>
            </Avatar>
          </div>
        </section>

        <Separator />

        {/* Tabs */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold border-b pb-2">Tabs</h2>
          
          <Tabs defaultValue="tab1" className="max-w-md">
            <TabsList>
              <TabsTrigger value="tab1">Tab 1</TabsTrigger>
              <TabsTrigger value="tab2">Tab 2</TabsTrigger>
              <TabsTrigger value="tab3">Tab 3</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1" className="p-4 border rounded-lg mt-2">
              Tab 1 content
            </TabsContent>
            <TabsContent value="tab2" className="p-4 border rounded-lg mt-2">
              Tab 2 content
            </TabsContent>
            <TabsContent value="tab3" className="p-4 border rounded-lg mt-2">
              Tab 3 content
            </TabsContent>
          </Tabs>
        </section>

        <Separator />

        {/* Alert Cards */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold border-b pb-2">Alert Cards</h2>
          
          <div className="space-y-4 max-w-lg">
            <div className="hint-card p-4 rounded-lg flex items-start gap-3">
              <Info className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Hint Card</p>
                <p className="text-sm text-muted-foreground">This is a helpful hint for the user.</p>
              </div>
            </div>

            <div className="success-card p-4 rounded-lg flex items-start gap-3">
              <Check className="w-5 h-5 text-success mt-0.5" />
              <div>
                <p className="font-medium text-success">Success Card</p>
                <p className="text-sm text-muted-foreground">Great job! You completed the task.</p>
              </div>
            </div>

            <div className="error-card p-4 rounded-lg flex items-start gap-3">
              <X className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Error Card</p>
                <p className="text-sm text-muted-foreground">Something went wrong. Try again.</p>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-warning/30 bg-warning/10 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
              <div>
                <p className="font-medium text-warning">Warning Card</p>
                <p className="text-sm text-muted-foreground">Be careful with this action.</p>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Spacing Reference */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold border-b pb-2">Spacing Scale</h2>
          
          <div className="space-y-2">
            {[1, 2, 3, 4, 6, 8, 12, 16].map((size) => (
              <div key={size} className="flex items-center gap-4">
                <span className="w-12 text-sm text-muted-foreground">{size * 4}px</span>
                <div className={`bg-primary h-4`} style={{ width: `${size * 16}px` }} />
                <span className="text-sm font-mono">space-{size}</span>
              </div>
            ))}
          </div>
        </section>

        <Separator />

        {/* Border Radius */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold border-b pb-2">Border Radius</h2>
          
          <div className="flex flex-wrap gap-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-sm mb-2" />
              <span className="text-sm">sm</span>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-md mb-2" />
              <span className="text-sm">md</span>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-lg mb-2" />
              <span className="text-sm">lg</span>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-xl mb-2" />
              <span className="text-sm">xl</span>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full mb-2" />
              <span className="text-sm">full</span>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-8 text-muted-foreground">
          <p>CodeQuest Design System v1.0</p>
        </footer>
      </div>
    </div>
  );
};

interface ColorSwatchProps {
  name: string;
  className: string;
  textClass: string;
}

const ColorSwatch = ({ name, className, textClass }: ColorSwatchProps) => (
  <div className="space-y-2">
    <div className={`w-full h-20 rounded-lg ${className} flex items-end p-2 border`}>
      <span className={`text-xs font-medium ${textClass}`}>{name}</span>
    </div>
  </div>
);

export default StyleGuide;
