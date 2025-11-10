import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Download, Check } from 'lucide-react';

interface YAMLPreviewProps {
  yaml: string;
  onDeploy?: () => void;
}

export function YAMLPreview({ yaml, onDeploy }: YAMLPreviewProps) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(yaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleDownload = () => {
    const blob = new Blob([yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agent.yaml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-300">Generated Agent CRD</h3>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          {onDeploy && (
            <button
              onClick={onDeploy}
              className="flex items-center gap-2 px-4 py-1.5 text-sm bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors font-medium"
            >
              🚀 Deploy
            </button>
          )}
        </div>
      </div>
      
      <div className="rounded-xl overflow-hidden border border-slate-700">
        <SyntaxHighlighter
          language="yaml"
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: '#1e293b',
            fontSize: '0.875rem',
          }}
        >
          {yaml}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
