"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface CodeBlockProps {
  code: string;
  language?: string;
}

function highlight(code: string) {
  return code.split(/(\/\/[^\n]*|#[^\n]*|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b(?:const|let|var|function|return|if|else|async|await|import|from|class|type|interface|public|private)\b|\b\d+(?:\.\d+)?\b)/g)
    .map((part, index) => {
      if (/^(\/\/|#)/.test(part)) return <span className="text-waterloo" key={index}>{part}</span>;
      if (/^["'`]/.test(part)) return <span className="text-titlebg2" key={index}>{part}</span>;
      if (/^\b\d/.test(part)) return <span className="text-meta" key={index}>{part}</span>;
      if (/^\b(?:const|let|var|function|return|if|else|async|await|import|from|class|type|interface|public|private)\b$/.test(part)) return <span className="text-titlebg" key={index}>{part}</span>;
      return part;
    });
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="my-3 overflow-hidden rounded-lg border border-blacksection bg-blacksection text-white">
      <div className="flex items-center justify-between border-b border-strokedark px-3 py-2 text-xs text-socialicon">
        <span>{language || "code"}</span>
        <button onClick={copy} className="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-btndark" aria-label="Copy code">
          {copied ? <Check className="h-3.5 w-3.5 text-meta" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-xs leading-5"><code>{highlight(code)}</code></pre>
    </div>
  );
}