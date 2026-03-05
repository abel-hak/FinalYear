import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Smartphone, Copy, Check, ExternalLink } from 'lucide-react';

interface QRCodeDisplayProps {
  url: string;
  title?: string;
  className?: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  url,
  title = "Scan to access prototype",
  className
}) => {
  const [copied, setCopied] = React.useState(false);
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("text-center", className)}>
      <div className="inline-flex flex-col items-center p-8 rounded-2xl bg-card border border-border shadow-xl">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Smartphone className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </div>
        
        {/* QR Code */}
        <div className="p-4 rounded-xl bg-white mb-6">
          <QRCodeSVG
            value={url}
            size={200}
            level="H"
            includeMargin={false}
            fgColor="#1a1a2e"
            bgColor="#ffffff"
          />
        </div>
        
        {/* URL Display */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 border border-border mb-4 max-w-full overflow-hidden">
          <span className="text-sm text-muted-foreground truncate font-mono">
            {url}
          </span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="shrink-0 h-8 w-8"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="w-4 h-4 text-success" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        {/* Open in browser button */}
        <a href={url} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm">
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in Browser
          </Button>
        </a>
      </div>
    </div>
  );
};

export default QRCodeDisplay;
