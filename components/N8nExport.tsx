import React from 'react';
import { generateN8nPayload } from '../services/geminiService';
import { Copy, Terminal } from 'lucide-react';

interface N8nExportProps {
  prompt: string;
  isOpen: boolean;
  onClose: () => void;
}

const N8nExport: React.FC<N8nExportProps> = ({ prompt, isOpen, onClose }) => {
  if (!isOpen) return null;

  const payload = generateN8nPayload("...", prompt);
  const jsonString = JSON.stringify(payload, null, 2);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonString);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-800/50">
          <div className="flex items-center gap-2 text-emerald-400">
            <Terminal size={20} />
            <h3 className="font-semibold text-white">n8n / API Configuration</h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            ✕
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-zinc-300 text-sm">
            Use this JSON payload in an n8n <strong>HTTP Request</strong> node to automate this generation. 
            Replace <code className="bg-zinc-800 px-1 rounded text-emerald-400">YOUR_API_KEY</code> and <code className="bg-zinc-800 px-1 rounded text-emerald-400">[BASE64_IMAGE_STRING]</code> with actual values.
          </p>
          
          <div className="relative group">
            <pre className="bg-black/50 p-4 rounded-lg text-xs md:text-sm text-zinc-300 font-mono overflow-auto max-h-96 border border-zinc-800">
              {jsonString}
            </pre>
            <button 
              onClick={copyToClipboard}
              className="absolute top-2 right-2 p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all border border-zinc-600"
              title="Copy to clipboard"
            >
              <Copy size={16} />
            </button>
          </div>
          
          <div className="bg-blue-900/20 border border-blue-900/50 p-3 rounded-lg flex gap-3 items-start">
             <div className="mt-1 text-blue-400">ℹ</div>
             <div className="text-sm text-blue-200">
               <span className="font-bold">Model:</span> gemini-2.5-flash-image<br/>
               This model is optimized for image editing and generation ("Nano Banana").
             </div>
          </div>
        </div>
        
        <div className="p-4 bg-zinc-800/50 border-t border-zinc-800 flex justify-end">
           <button onClick={onClose} className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-white font-medium transition-colors">
             Close
           </button>
        </div>
      </div>
    </div>
  );
};

export default N8nExport;
