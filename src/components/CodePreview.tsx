"use client";

import React, { useMemo } from "react";

type Props = {
  code?: string | null;
  className?: string;
};

function wrapIfNeeded(source: string): string {
  const hasHtml = /<html[\s>]/i.test(source);
  if (hasHtml) {
    // If it's already HTML, inject our fixes
    let html = source;
    
    // Ensure viewport meta tag exists
    if (!html.includes('name="viewport"')) {
      html = html.replace('<head>', '<head>\n    <meta name="viewport" content="width=device-width,initial-scale=1">');
    }
    
    // Inject our CSS fixes right after <head> or before </head>
    const cssInjection = `
    <style>
      /* Force full page layout */
      html, body { 
        margin: 0; 
        padding: 0; 
        width: 100%; 
        min-height: 100vh; 
        height: 100%;
        box-sizing: border-box;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      *, *::before, *::after { 
        box-sizing: border-box; 
      }
      body { 
        background: #ffffff;
        color: #000000;
        line-height: 1.6;
      }
      /* Ensure all major containers fill the viewport */
      body > div, body > main, body > section {
        min-height: 100vh;
      }
    </style>`;
    
    if (html.includes('</head>')) {
      html = html.replace('</head>', cssInjection + '\n  </head>');
    } else {
      html = html.replace('<head>', '<head>' + cssInjection);
    }
    
    return html;
  }
  
  // Sanitize incoming code
  function sanitize(code: string): string {
    return code
      .replace(/```[\w-]*\n?/g, "")
      .replace(/```/g, "")
      .replace(/\uFEFF/g, "")
      .replace(/[\u200B-\u200D\u2060\u00A0]/g, " ")
      .trim();
  }
  
  const sanitized = sanitize(source);
  
  // Detect if it's JSX/React or HTML
  const looksLikeJSX = /\bReact\b|useState|export\s+default/.test(sanitized);
  const looksLikeHtmlOnly = /<(div|main|section|header|footer|body|html)[\s>]/i.test(sanitized) && !/\bexport\b|\bimport\b/.test(sanitized);
  
  if (!looksLikeJSX || looksLikeHtmlOnly) {
    // Plain HTML - wrap with full page structure
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Generated UI</title>
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        min-height: 100vh;
        height: 100%;
        box-sizing: border-box;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #ffffff;
        color: #000000;
        line-height: 1.6;
      }
      *, *::before, *::after {
        box-sizing: border-box;
      }
      /* Ensure content fills viewport */
      body > * {
        min-height: 100vh;
      }
      /* Common utility classes */
      .container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
      .text-center { text-align: center; }
      .text-white { color: white; }
      .bg-dark { background: #1a1a1a; }
      .bg-light { background: #f8f9fa; }
      .p-4 { padding: 1rem; }
      .mt-4 { margin-top: 1rem; }
      .mb-4 { margin-bottom: 1rem; }
      .btn { 
        display: inline-block; 
        padding: 0.5rem 1rem; 
        background: #007bff; 
        color: white; 
        text-decoration: none; 
        border-radius: 4px; 
        border: none;
        cursor: pointer;
      }
      .btn:hover { background: #0056b3; }
      .grid { display: grid; gap: 1rem; }
      .flex { display: flex; }
      .items-center { align-items: center; }
      .justify-center { justify-content: center; }
    </style>
  </head>
  <body>
    ${sanitized}
  </body>
</html>`;
  }
  
  // React/JSX - wrap with React setup
  const escaped = sanitized.replace(/<\/(script)>/gi, "<\\/$1>");
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Generated UI</title>
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        min-height: 100vh;
        height: 100%;
        box-sizing: border-box;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #ffffff;
        color: #000000;
      }
      *, *::before, *::after {
        box-sizing: border-box;
      }
      #root {
        width: 100%;
        min-height: 100vh;
        height: 100%;
      }
      #errors {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: #fee2e2;
        color: #991b1b;
        padding: 8px 12px;
        font: 12px/1.4 monospace;
        display: none;
        z-index: 1000;
      }
    </style>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      window.showError = function(err){
        var el = document.getElementById('errors');
        if(el) { el.style.display='block'; el.textContent = String(err && err.stack || err); }
      };
      window.onerror = function(msg, src, line, col, err){ showError(err||msg); };
      console.error = function(){ 
        showError([].slice.call(arguments).join(' ')); 
      };
    </script>
  </head>
  <body>
    <div id="root"></div>
    <div id="errors"></div>
    <script>
      try {
        var SRC = ${JSON.stringify(escaped)};
        var compiledJs = Babel.transform(SRC, { 
          presets: [['env', { modules: 'commonjs' }], 'react', 'typescript'] 
        }).code;
        
        var runner = \`(function(){
          try {
            const module = { exports: {} };
            const exports = module.exports;
            \${compiledJs}
            window.App = module.exports && (module.exports.default || module.exports.App) || window.App;
          } catch(e){ window.showError(e); }
        })();\`;
        
        (new Function('React', 'ReactDOM', runner))(window.React, window.ReactDOM);
        
        if (!window.App) throw new Error('No default export found. Export a default component.');
        
        var rootEl = document.getElementById('root');
        if (window.ReactDOM.createRoot) {
          var root = window.ReactDOM.createRoot(rootEl);
          root.render(window.React.createElement(window.App));
        } else {
          window.ReactDOM.render(window.React.createElement(window.App), rootEl);
        }
      } catch(e) { 
        window.showError(e); 
      }
    </script>
  </body>
</html>`;
}

export default function CodePreview({ code, className }: Props) {
  const srcDoc = useMemo(() => 
    wrapIfNeeded(code ?? "<div style=\"padding:2rem;text-align:center;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f8f9fa\"><h1>No code yet</h1><p>Generate an application to see it here.</p></div>"), 
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
        maxWidth: '100%'
      }}
      sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
    />
  );
}
