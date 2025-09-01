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
  // Preprocess TS/TSX exports to expose a global App when possible
  function preprocess(code: string){
    try{
      // export default function App() { ... }
      code = code.replace(/export\s+default\s+function\s+(\w+)/, 'function $1');
      // export default class App ...
      code = code.replace(/export\s+default\s+class\s+(\w+)/, 'class $1');
      // export default App;
      code = code.replace(/export\s+default\s+(\w+)\s*;?/, 'window.App = $1;');
      // If we declared function App but no window.App, attach it
      if (/function\s+App\s*\(/.test(code) && !/window\.App\s*=/.test(code)) {
        code += '\nwindow.App = App;';
      }
    }catch(_: unknown){}
    return code;
  }
  const preprocessed = preprocess(source);
  const escaped = preprocessed.replace(/<\/(script)>/gi, "<\\/$1>");
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
    <script>
      (function(){
        try {
          var SRC = ${JSON.stringify(escaped)};
          var toCompile = SRC + "\n;window.__render = function(){ try { var Comp = (typeof window.App !== 'undefined' && window.App) || (typeof App !== 'undefined' && App) || null; if(!Comp){ Comp = function(){ return React.createElement('div', {style:{padding:16}}, 'Rendered code'); }; } var root = ReactDOM.createRoot(document.getElementById('root')); root.render(React.createElement(Comp)); } catch(e){ showError(e); } }";
          var compiled = Babel.transform(toCompile, { presets: ['typescript','react'] }).code;
          // eslint-disable-next-line no-new-func
          (new Function('React','ReactDOM', compiled))(window.React, window.ReactDOM);
          if (typeof window.__render === 'function') window.__render();
        } catch(e) { showError(e); }
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

