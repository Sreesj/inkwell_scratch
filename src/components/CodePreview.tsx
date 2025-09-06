"use client";

import React, { useMemo } from "react";

type Props = {
  code?: string | null;
  className?: string;
};

function wrapIfNeeded(source: string): string {
  const hasHtml = /<html[\s>]/i.test(source);
  if (hasHtml) return source;
  
  // Sanitize incoming code: strip code fences/markdown, BOM/zero-width spaces
  function sanitize(code: string): string {
    const s = code
      .replace(/```[\w-]*\n?/g, "")
      .replace(/```/g, "")
      .replace(/\uFEFF/g, "")
      .replace(/[\u200B-\u200D\u2060\u00A0]/g, " ")
      .trim();
    return s;
  }
  
  const sanitized = sanitize(source);
  
  // Detect HTML-only; bypass Babel
  const looksLikeJSX = /\bReact\b|useState|export\s+default|<\w+/.test(sanitized);
  const looksLikeHtmlOnly = /<(div|main|section|header|footer|body|html)[\s>]/i.test(sanitized) && !/\bexport\b|\bimport\b/.test(sanitized);
  
  if (!looksLikeJSX || looksLikeHtmlOnly) {
    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <style>
      html, body {
        margin: 0;
        padding: 0;
        font-family: system-ui;
        width: 100%;
        height: 100vh;
        overflow-x: hidden;
        box-sizing: border-box;
      }
      *, *::before, *::after {
        box-sizing: border-box;
      }
      body > * {
        max-width: 100vw;
      }
    </style>
  </head>
  <body>${sanitized}</body>
</html>`;
  }
  
  const escaped = sanitized.replace(/<\/(script)>/gi, "<\\/$1>");
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        font-family: system-ui;
        width: 100%;
        height: 100vh;
        overflow-x: hidden;
        box-sizing: border-box;
      }
      *, *::before, *::after {
        box-sizing: border-box;
      }
      #root {
        width: 100%;
        height: 100vh;
        overflow-x: hidden;
      }
      #root > * {
        max-width: 100vw;
      }
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
          console.log('[Preview][pre]', SRC.slice(0,200));
          var compiledJs = Babel.transform(SRC, { presets: [['env',{ modules:'commonjs' }], 'react', 'typescript'] }).code;
          console.log('[Preview][post]', compiledJs.slice(0,200));
          var runner = "(function(){\n  try {\n    const module = { exports: {} };\n    const exports = module.exports;\n" +
            compiledJs +
            "\n    window.App = module.exports && (module.exports.default || module.exports.App) || window.App;\n  } catch(e){ window.showError(e); }\n})();\n";
          if (/\bexport\b|\bimport\b/.test(compiledJs)) {
            console.warn('[Preview] Residual export/import after transform');
          }
          (new Function('React','ReactDOM', runner))(window.React, window.ReactDOM);
          if (!window.App) throw new Error('No default export found. Export a default component named App.');
          var rootEl = document.getElementById('root');
          if (window.ReactDOM.createRoot) {
            var root = window.ReactDOM.createRoot(rootEl);
            root.render(window.React.createElement(window.App));
          } else {
            window.ReactDOM.render(window.React.createElement(window.App), rootEl);
          }
        } catch(e) { window.showError(e); }
      })();
    </script>
  </body>
</html>`;
}

export default function CodePreview({ code, className }: Props) {
  const srcDoc = useMemo(() => 
    wrapIfNeeded(code ?? "<div style=\"padding:16px;font-family:system-ui\">No code yet.</div>"), 
    [code]
  );
  
  return (
    <iframe
      className={className ?? "w-full h-full"}
      srcDoc={srcDoc}
      style={{ 
        border: 'none',
        width: '100%',
        height: '100%',
        maxWidth: '100%',
        overflow: 'hidden'
      }}
      sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
    />
  );
}
