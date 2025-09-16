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
  
  // Sanitize incoming code more thoroughly
  function sanitize(code: string): string {
    return code
      .replace(/```[\w-]*\n?/g, "")
      .replace(/```/g, "")
      .replace(/\uFEFF/g, "") // BOM
      .replace(/[\u200B-\u200D\u2060\u00A0]/g, " ") // Various unicode spaces
      .replace(/[""'']/g, '"') // Normalize quotes
      .replace(/…/g, '...') // Fix ellipsis
      .replace(/–/g, '-') // Fix en-dash
      .replace(/—/g, '--') // Fix em-dash
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
    </style>
  </head>
  <body>
    ${sanitized}
  </body>
</html>`;
  }
  
  // React/JSX - Enhanced with working animation libraries
  // Remove ALL import/export statements BEFORE processing
  const preProcessed = sanitized
    .split('\n')
    .filter(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('import ')) {
        console.log('🔥 Filtering out import:', trimmed);
        return false;
      }
      if (trimmed.startsWith('export ')) {
        console.log('🔥 Filtering out export:', trimmed);
        return false;
      }
      return true;
    })
    .map(line => {
      // Handle export default on same line as function/component
      if (line.includes('export default ')) {
        console.log('🔥 Converting export default:', line);
        return line.replace('export default ', '');
      }
      return line;
    })
    .join('\n');
  
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
        border-top: 1px solid #f87171;
        max-height: 200px;
        overflow-y: auto;
      }

      /* Custom animations for when framer-motion is not available */
      @keyframes liquidMove {
        0%, 100% { 
          border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
          transform: translate(0px, 0px) scale(1);
        }
        33% { 
          border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
          transform: translate(30px, -50px) scale(1.1);
        }
        66% { 
          border-radius: 40% 30% 60% 70% / 40% 60% 50% 30%;
          transform: translate(-20px, 20px) scale(0.9);
        }
      }

      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes staggerIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-20px); }
      }

      @keyframes rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      @keyframes morph {
        0%, 100% { 
          border-radius: 40% 60% 70% 30% / 60% 40% 30% 70%; 
        }
        50% { 
          border-radius: 70% 30% 40% 60% / 30% 70% 60% 40%; 
        }
      }

      .animate-liquid { animation: liquidMove 8s ease-in-out infinite; }
      .animate-fade-in-up { animation: fadeInUp 0.6s ease-out; }
      .animate-stagger { animation: staggerIn 0.6s ease-out; }
      .animate-float { animation: float 3s ease-in-out infinite; }
      .animate-rotate { animation: rotate 2s linear infinite; }
      .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
      .animate-morph { animation: morph 4s ease-in-out infinite; }
    </style>
    
    <!-- Core React -->
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    
    <!-- Styling Framework -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Enhanced Tailwind Configuration -->
    <script>
      tailwind.config = {
        theme: {
          extend: {
            animation: {
              'fade-in': 'fadeIn 0.5s ease-in-out',
              'fade-in-up': 'fadeInUp 0.6s ease-out',
              'slide-up': 'slideUp 0.5s ease-out',
              'stagger': 'staggerIn 0.6s ease-out',
              'float': 'float 3s ease-in-out infinite',
              'liquid': 'liquidMove 8s ease-in-out infinite',
              'rotate': 'rotate 2s linear infinite',
              'morph': 'morph 4s ease-in-out infinite',
            },
            keyframes: {
              fadeIn: {
                '0%': { opacity: '0' },
                '100%': { opacity: '1' },
              },
              fadeInUp: {
                '0%': { opacity: '0', transform: 'translateY(30px)' },
                '100%': { opacity: '1', transform: 'translateY(0)' },
              },
              slideUp: {
                '0%': { transform: 'translateY(100%)', opacity: '0' },
                '100%': { transform: 'translateY(0)', opacity: '1' },
              },
              staggerIn: {
                '0%': { opacity: '0', transform: 'translateY(20px)' },
                '100%': { opacity: '1', transform: 'translateY(0)' },
              },
              float: {
                '0%, 100%': { transform: 'translateY(0px)' },
                '50%': { transform: 'translateY(-20px)' },
              },
              liquidMove: {
                '0%, 100%': { 
                  borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
                  transform: 'translate(0px, 0px) scale(1)'
                },
                '33%': { 
                  borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%',
                  transform: 'translate(30px, -50px) scale(1.1)'
                },
                '66%': { 
                  borderRadius: '40% 30% 60% 70% / 40% 60% 50% 30%',
                  transform: 'translate(-20px, 20px) scale(0.9)'
                },
              },
              morph: {
                '0%, 100%': { 
                  borderRadius: '40% 60% 70% 30% / 60% 40% 30% 70%' 
                },
                '50%': { 
                  borderRadius: '70% 30% 40% 60% / 30% 70% 60% 40%' 
                },
              },
            }
          },
        },
      };
    </script>

    <!-- Error Handling Setup -->
    <script>
      window.showError = function(err){
        var el = document.getElementById('errors');
        if(el) { 
          el.style.display = 'block'; 
          var errorMsg = String(err && err.stack || err);
          el.innerHTML = '<strong>🚨 Animation Error:</strong><br>' + 
                         errorMsg.replace(/\\n/g, '<br>').substring(0, 1000) + 
                         (errorMsg.length > 1000 ? '...' : '');
        }
        console.error('Preview Error:', err);
      };
      
      window.onerror = function(msg, src, line, col, err){ 
        showError(err || msg); 
      };
      
      window.addEventListener('unhandledrejection', function(e) { 
        showError(e.reason); 
      });
    </script>
  </head>
  <body>
    <div id="root"></div>
    <div id="errors"></div>
    
    <script type="text/babel">
      // Create fallback motion library for framer-motion imports
      const motion = {
        div: function(props) {
          const className = props.className || '';
          const style = props.style || {};
          const children = props.children;
          
          // Add animation classes based on props
          let animationClass = '';
          if (props.animate) {
            if (props.animate.opacity !== undefined || props.animate.y !== undefined) {
              animationClass = ' animate-fade-in-up';
            }
          }
          if (props.whileHover) {
            animationClass += ' hover:scale-105 transition-transform duration-300';
          }
          if (props.variants === 'containerVariants') {
            animationClass += ' animate-fade-in-up';
          }
          
          return React.createElement('div', {
            className: className + animationClass,
            style: style,
            onMouseEnter: props.onHoverStart,
            onMouseLeave: props.onHoverEnd
          }, children);
        },
        span: function(props) {
          const className = props.className || '';
          const style = props.style || {};
          if (props.variants === 'letterVariants') {
            const delay = (props.custom || 0) * 0.05;
            style.animationDelay = delay + 's';
            return React.createElement('span', {
              className: className + ' animate-stagger',
              style: style
            }, props.children);
          }
          return React.createElement('span', {
            className: className,
            style: style
          }, props.children);
        },
        p: function(props) {
          return React.createElement('p', {
            className: props.className,
            style: props.style
          }, props.children);
        },
        button: function(props) {
          return React.createElement('button', {
            className: props.className,
            style: props.style,
            onClick: props.onClick
          }, props.children);
        }
      };
      
      const AnimatePresence = function(props) {
        return props.children;
      };
      
      const useAnimation = function() {
        return {
          start: function() { return Promise.resolve(); }
        };
      };

      const animated = {
        div: function(props) {
          return React.createElement('div', props, props.children);
        },
        button: function(props) {
          return React.createElement('button', props, props.children);
        }
      };

      const useSpring = function(config) {
        return config.to || config;
      };

      // Add icon replacements
      const LucideFurniture = () => React.createElement("div", {className: "w-6 h-6 bg-blue-500 rounded flex items-center justify-center text-white text-xs"}, "🪑");
      const ChevronDown = () => React.createElement("div", {className: "w-4 h-4 bg-gray-500 rounded flex items-center justify-center text-white text-xs"}, "⬇");
      const Star = () => React.createElement("div", {className: "w-4 h-4 bg-yellow-500 rounded flex items-center justify-center text-white text-xs"}, "⭐");
      const Heart = () => React.createElement("div", {className: "w-4 h-4 bg-red-500 rounded flex items-center justify-center text-white text-xs"}, "❤");
      const ShoppingCart = () => React.createElement("div", {className: "w-4 h-4 bg-green-500 rounded flex items-center justify-center text-white text-xs"}, "🛒");
      const Menu = () => React.createElement("div", {className: "w-4 h-4 bg-gray-500 rounded flex items-center justify-center text-white text-xs"}, "☰");
      const Search = () => React.createElement("div", {className: "w-4 h-4 bg-gray-500 rounded flex items-center justify-center text-white text-xs"}, "🔍");
      const User = () => React.createElement("div", {className: "w-4 h-4 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs"}, "👤");
      const XMarkIcon = () => React.createElement("div", {className: "w-4 h-4 bg-red-500 rounded flex items-center justify-center text-white text-xs"}, "✕");
      const Dialog = ({ open, onClose, children }) => open ? React.createElement("div", {className: "fixed inset-0 z-50 bg-black/50 flex items-center justify-center", onClick: onClose}, React.createElement("div", {className: "bg-white rounded-lg p-6 max-w-md mx-4", onClick: e => e.stopPropagation()}, children)) : null;

      // Your component code starts here
      ${preProcessed}
      
      // Auto-detect and render the main component
      let MainComponent;
      
      if (typeof App !== 'undefined') {
        MainComponent = App;
      } else if (typeof Component !== 'undefined') {
        MainComponent = Component;
      } else if (typeof FurnitureApp !== 'undefined') {
        MainComponent = FurnitureApp;
      } else if (typeof HomePage !== 'undefined') {
        MainComponent = HomePage;
      } else if (typeof LoadingScreen !== 'undefined') {
        MainComponent = LoadingScreen;
      } else {
        // Try to find any component-like function
        const componentNames = Object.keys(window).filter(key => 
          typeof window[key] === 'function' && 
          key[0] === key[0].toUpperCase() && 
          key !== 'React' && key !== 'ReactDOM'
        );
        
        if (componentNames.length > 0) {
          MainComponent = window[componentNames[0]];
        } else {
          MainComponent = () => React.createElement('div', {
            style: { padding: '2rem', textAlign: 'center', color: 'red' }
          }, 'No React component found to render');
        }
      }
      
      // Render the component
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(MainComponent));
    </script>
  </body>
</html>`;
}

export default function CodePreview({ code, className }: Props) {
  const srcDoc = useMemo(() => 
    wrapIfNeeded(code ?? "<div style=\"padding:2rem;text-align:center;min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white\"><h1 style=\"font-size:2rem;margin-bottom:1rem\">🎨 Enhanced Preview Ready!</h1><p>Generate an application with framer-motion or CSS animations</p></div>"), 
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
