"use client";

import React, { useMemo } from "react";

type Props = {
  code?: string | null;
  className?: string;
};

function wrapIfNeeded(source: string): string {
  const hasHtml = /<html[\s>]/i.test(source);
  if (hasHtml) return source;
  // Detect JSX/TSX (React) and run it via Babel + UMD React in sandbox
  const looksLikeJSX = /\bReact\b|useState|export\s+default|<\w+/.test(source);
  if (!looksLikeJSX) {
    return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><style>html,body{margin:0;padding:0;font-family:system-ui}</style></head><body>${source}</body></html>`;
  }
  const escaped = source.replace(/<\/(script)>/gi, "<\\/$1>");
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <style>
      html,body{margin:0;padding:0;font-family:system-ui}
      #errors{position:fixed;inset:auto 0 0 0;background:#fee2e2;color:#991b1b;padding:8px 12px;font:12px/1.4 monospace;display:none}
    </style>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script>
      (function(){
        const origError = console.error;
        window.showError = function(err){
          var el = document.getElementById('errors');
          if(!el) return; el.style.display='block'; el.textContent = String(err && err.stack || err);
        };
        window.onerror = function(msg, src, line, col, err){ showError(err||msg); };
        console.error = function(){ showError([].slice.call(arguments).join(' ')); origError.apply(console, arguments); };
      })();
    </script>
  </head>
  <body>
    <div id="root"></div>
    <div id="errors"></div>
    <script type="text/babel" data-presets="typescript,react">
      ${escaped}
      ;(function(){
        try {
          var Comp = (typeof App !== 'undefined' && App) || (typeof Default !== 'undefined' && Default) || null;
          if(!Comp){
            // Try to guess a component by looking for the first upper-cased identifier
            Comp = () => React.createElement('div', {style:{padding:16}}, 'Rendered code');
          }
          var root = ReactDOM.createRoot(document.getElementById('root'));
          root.render(React.createElement(Comp));
        } catch(e){ showError(e); }
      })();
    </script>
  </body>
</html>`;
}

export default function CodePreview({ code, className }: Props) {
  const srcDoc = useMemo(() => wrapIfNeeded(code ?? "<div style=\"padding:16px;font-family:system-ui\">No code yet.</div>"), [code]);
  return (
    <iframe
      className={className ?? "w-full h-full"}
      srcDoc={srcDoc}
      sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
    />
  );
}

