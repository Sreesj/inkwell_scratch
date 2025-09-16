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
  // CRITICAL: Remove ALL import statements BEFORE processing
  const preProcessed = sanitized
    .split('\n')
    .filter(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('import ')) {
        console.log('🔥 Filtering out import:', trimmed);
        return false;
      }
      return true;
    })
    .join('\n');
  
  // FIXED: Proper string escaping for embedding in script tag
  function escapeForScript(str: string): string {
    return str
      .replace(/\\/g, '\\\\')    // Escape backslashes first
      .replace(/`/g, '\\`')      // Escape backticks
      .replace(/\$/g, '\\$')     // Escape dollar signs (template literals)
      .replace(/\r?\n/g, '\\n')  // Convert newlines to escaped newlines
      .replace(/\r/g, '\\r')     // Convert carriage returns
      .replace(/\t/g, '\\t')     // Convert tabs
      .replace(/'/g, "\\'")      // Escape single quotes
      .replace(/"/g, '\\"');     // Escape double quotes
  }
  
  const escapedCode = escapeForScript(preProcessed);
  
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
    
    <script>
      try {
        // Use the properly escaped code string
        var SRC = "${escapedCode}";
        
        // Create fallback motion library for framer-motion imports
        var createMotion = function() {
          return {
            div: function(props) {
              var className = props.className || '';
              var style = props.style || {};
              var children = props.children;
              
              // Add animation classes based on props
              if (props.animate) {
                if (props.animate.opacity !== undefined || props.animate.y !== undefined) {
                  className += ' animate-fade-in-up';
                }
              }
              if (props.whileHover) {
                className += ' hover:scale-105 transition-transform duration-300';
              }
              if (props.variants === 'containerVariants') {
                className += ' animate-fade-in-up';
              }
              
              return React.createElement('div', {
                className: className,
                style: style,
                onMouseEnter: props.onHoverStart,
                onMouseLeave: props.onHoverEnd
              }, children);
            },
            span: function(props) {
              var className = props.className || '';
              var style = props.style || {};
              if (props.variants === 'letterVariants') {
                className += ' animate-stagger';
                style.animationDelay = (props.custom || 0) * 0.05 + 's';
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
        };
        
        var createAnimatePresence = function() {
          return function AnimatePresence(props) {
            return props.children;
          };
        };
        
        var createUseAnimation = function() {
          return function useAnimation() {
            return {
              start: function() { return Promise.resolve(); }
            };
          };
        };

        var createAnimated = function() {
          return {
            div: function(props) {
              return React.createElement('div', props, props.children);
            },
            button: function(props) {
              return React.createElement('button', props, props.children);
            }
          };
        };

        var createUseSpring = function() {
          return function useSpring(config) {
            return config.to || config;
          };
        };

        console.log('Processing code with length:', SRC.length);
        
        // Add our replacement imports at the very beginning
        var replacementCode = [
          '// Auto-generated replacements for imports',
          'const React = window.React;',
          'const { useState, useEffect, useRef, useCallback, useMemo } = React;',
          '',
          '// Animation library replacements',
          'const motion = createMotion();',
          'const AnimatePresence = createAnimatePresence();', 
          'const useAnimation = createUseAnimation();',
          'const useSpring = createUseSpring();',
          'const animated = createAnimated();',
          '',
          '// Icon replacements',
          'const LucideFurniture = () => React.createElement("div", {className: "w-6 h-6 bg-blue-500 rounded flex items-center justify-center text-white text-xs"}, "🪑");',
          'const ChevronDown = () => React.createElement("div", {className: "w-4 h-4 bg-gray-500 rounded flex items-center justify-center text-white text-xs"}, "⬇");',
          'const Star = () => React.createElement("div", {className: "w-4 h-4 bg-yellow-500 rounded flex items-center justify-center text-white text-xs"}, "⭐");',
          'const Heart = () => React.createElement("div", {className: "w-4 h-4 bg-red-500 rounded flex items-center justify-center text-white text-xs"}, "❤");',
          'const ShoppingCart = () => React.createElement("div", {className: "w-4 h-4 bg-green-500 rounded flex items-center justify-center text-white text-xs"}, "🛒");',
          'const Menu = () => React.createElement("div", {className: "w-4 h-4 bg-gray-500 rounded flex items-center justify-center text-white text-xs"}, "☰");',
          'const Search = () => React.createElement("div", {className: "w-4 h-4 bg-gray-500 rounded flex items-center justify-center text-white text-xs"}, "🔍");',
          'const User = () => React.createElement("div", {className: "w-4 h-4 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs"}, "👤");',
          '',
          '// Start of original component code',
          SRC
        ].join('\\n');
        
        console.log('Final code length:', replacementCode.length);
        
        // Compile with Babel - with better error reporting
        var compiledJs;
        try {
          compiledJs = Babel.transform(replacementCode, {
            presets: ['react'],
            plugins: []
          }).code;
          console.log('✅ Babel compilation successful');
        } catch (babelError) {
          console.error('❌ Babel compilation failed');
          console.error('Error:', babelError.message);
          console.error('Error location:', babelError.loc);
          
          window.showError('Code compilation failed: ' + babelError.message + '\\n\\nCheck console for details');
          throw babelError;
        }
        
        // Execute the component
        var runner = \`(function(){
          try {
            const module = { exports: {} };
            const exports = module.exports;
            
            // Provide all fallback functions
            const createMotion = \${createMotion.toString()};
            const createAnimatePresence = \${createAnimatePresence.toString()};
            const createUseAnimation = \${createUseAnimation.toString()};
            const createAnimated = \${createAnimated.toString()};
            const createUseSpring = \${createUseSpring.toString()};
            
            \${compiledJs}
            
            window.App = module.exports && (module.exports.default || module.exports.App) || window.App;
          } catch(e){ 
            window.showError('Component Error: ' + e.message + '\\n' + e.stack); 
            throw e;
          }
        })();\`;
        
        // Run in React context
        (new Function('React', 'ReactDOM', runner))(window.React, window.ReactDOM);
        
        // Validate component exists
        if (!window.App) {
          throw new Error('❌ No default export found. Make sure to export a default React component.');
        }
        
        // Render the component
        var rootEl = document.getElementById('root');
        if (window.ReactDOM.createRoot) {
          var root = window.ReactDOM.createRoot(rootEl);
          root.render(window.React.createElement(window.App));
        } else {
          window.ReactDOM.render(window.React.createElement(window.App), rootEl);
        }
        
        console.log('✅ Component rendered successfully with animation fallbacks!');
        
      } catch(e) { 
        window.showError('Runtime Error: ' + e.message);
        console.error('💥 Preview Error:', e);
      }
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
