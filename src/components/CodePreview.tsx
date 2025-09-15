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
  
  // React/JSX - Enhanced with ALL animation libraries
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
        border-top: 1px solid #f87171;
        max-height: 200px;
        overflow-y: auto;
      }
    </style>
    
    <!-- Core React -->
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    
    <!-- Styling Framework -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- 🎪 ANIMATION LIBRARIES -->
    <!-- Framer Motion - Professional React animations -->
    <script src="https://unpkg.com/framer-motion@10/dist/framer-motion.js"></script>
    
    <!-- React Spring - Physics-based animations -->
    <script src="https://unpkg.com/react-spring@9.7.3/dist/react-spring.umd.js"></script>
    
    <!-- GSAP - Timeline animations -->
    <script src="https://unpkg.com/gsap@3.12.2/dist/gsap.min.js"></script>
    <script src="https://unpkg.com/gsap@3.12.2/dist/ScrollTrigger.min.js"></script>
    
    <!-- Lottie React - After Effects animations -->
    <script src="https://unpkg.com/lottie-web@5.12.2/build/player/lottie.min.js"></script>
    
    <!-- 🎨 UI COMPONENT LIBRARIES -->
    <!-- Headless UI - Accessible components -->
    <script src="https://unpkg.com/@headlessui/react@1.7.17/dist/headlessui.umd.js"></script>
    
    <!-- React Hot Toast - Smooth notifications -->
    <script src="https://unpkg.com/react-hot-toast@2.4.1/dist/index.umd.js"></script>
    
    <!-- 🛠️ UTILITY LIBRARIES -->
    <script src="https://unpkg.com/clsx@2.0.0/dist/clsx.min.js"></script>
    <script src="https://unpkg.com/class-variance-authority@0.7.0/dist/index.umd.js"></script>
    
    <!-- 🎯 ICONS -->
    <script src="https://unpkg.com/lucide-react@0.263.1/dist/umd/lucide-react.js"></script>
    
    <!-- Enhanced Tailwind Configuration -->
    <script>
      tailwind.config = {
        theme: {
          extend: {
            animation: {
              'fade-in': 'fadeIn 0.5s ease-in-out',
              'fade-in-up': 'fadeInUp 0.6s ease-out',
              'slide-up': 'slideUp 0.5s ease-out',
              'slide-down': 'slideDown 0.5s ease-out',
              'scale-in': 'scaleIn 0.4s ease-out',
              'bounce-slow': 'bounce 2s infinite',
              'pulse-slow': 'pulse 3s infinite',
              'spin-slow': 'spin 3s linear infinite',
              'wiggle': 'wiggle 1s ease-in-out infinite',
              'float': 'float 6s ease-in-out infinite',
              'glow': 'glow 2s ease-in-out infinite alternate',
              'shimmer': 'shimmer 2s linear infinite',
              'morph': 'morph 4s ease-in-out infinite',
              'liquid': 'liquid 8s ease-in-out infinite',
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
              slideDown: {
                '0%': { transform: 'translateY(-100%)', opacity: '0' },
                '100%': { transform: 'translateY(0)', opacity: '1' },
              },
              scaleIn: {
                '0%': { transform: 'scale(0.8)', opacity: '0' },
                '100%': { transform: 'scale(1)', opacity: '1' },
              },
              wiggle: {
                '0%, 100%': { transform: 'rotate(-3deg)' },
                '50%': { transform: 'rotate(3deg)' },
              },
              float: {
                '0%, 100%': { transform: 'translateY(0px)' },
                '50%': { transform: 'translateY(-20px)' },
              },
              glow: {
                '0%': { boxShadow: '0 0 5px rgba(59, 130, 246, 0.5)' },
                '100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.8), 0 0 40px rgba(59, 130, 246, 0.4)' },
              },
              shimmer: {
                '0%': { backgroundPosition: '200% 0' },
                '100%': { backgroundPosition: '-200% 0' },
              },
              morph: {
                '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
                '50%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
              },
              liquid: {
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
            },
            backdropBlur: {
              'xs': '2px',
            },
            colors: {
              'glass': 'rgba(255, 255, 255, 0.1)',
              'glass-dark': 'rgba(0, 0, 0, 0.1)',
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
        // 🎪 Setup global animation libraries
        window.FramerMotion = window.FramerMotion || {};
        window.ReactSpring = window.ReactSpring || {};
        window.LucideReact = window.LucideReact || {};
        window.HeadlessUI = window.Headless || {};
        window.toast = window.toast || { toast: function() {} };
        window.clsx = window.clsx || function(...args) { 
          return args.filter(Boolean).join(' '); 
        };
        
        var SRC = ${JSON.stringify(escaped)};
        
        // 🔧 Transform imports to work with CDN globals
        SRC = SRC
          // Framer Motion imports
          .replace(/import\\s+\\{([^}]+)\\}\\s+from\\s+['"](framer-motion)['"]/g, 
            'const { $1 } = window.FramerMotion || {};')
          .replace(/import\\s+(\\w+)\\s+from\\s+['"](framer-motion)['"]/g,
            'const $1 = window.FramerMotion || {};')
          
          // React Spring imports  
          .replace(/import\\s+\\{([^}]+)\\}\\s+from\\s+['"](react-spring\\/web|react-spring)['"]/g,
            'const { $1 } = window.ReactSpring || {};')
          .replace(/import\\s+(\\w+)\\s+from\\s+['"](react-spring\\/web|react-spring)['"]/g,
            'const $1 = window.ReactSpring || {};')
          
          // Other libraries
          .replace(/import\\s+\\{([^}]+)\\}\\s+from\\s+['"](lucide-react)['"]/g,
            'const { $1 } = window.LucideReact || {};')
          .replace(/import\\s+\\{([^}]+)\\}\\s+from\\s+['"](clsx)['"]/g,
            'const { $1 } = { clsx: window.clsx };')
          .replace(/import\\s+\\{([^}]+)\\}\\s+from\\s+['"](@headlessui\\/react)['"]/g,
            'const { $1 } = window.HeadlessUI || {};')
          .replace(/import\\s+\\{([^}]+)\\}\\s+from\\s+['"](react-hot-toast)['"]/g,
            'const { $1 } = window.toast || {};');
        
        // 🚀 Compile with Babel
        var compiledJs = Babel.transform(SRC, { 
          presets: [
            ['env', { 
              modules: false, 
              loose: true,
              targets: { browsers: ['> 1%', 'last 2 versions'] }
            }], 
            'react', 
            'typescript'
          ],
          plugins: [
            'proposal-class-properties',
            'transform-object-rest-spread',
            'transform-optional-chaining',
            'transform-nullish-coalescing-operator'
          ]
        }).code;
        
        // 🎬 Execute the component
        var runner = \`(function(){
          try {
            const module = { exports: {} };
            const exports = module.exports;
            
            // 🎪 Make animation libraries available
            const motion = window.FramerMotion || {};
            const { useSpring, animated, useTransition, useChain, useSpringRef, config } = window.ReactSpring || {};
            const { AnimatePresence, useAnimation, useMotionValue, useTransform, useScroll } = window.FramerMotion || {};
            const { toast } = window.toast || { toast: function() {} };
            const gsap = window.gsap || {};
            
            // 🎯 Execute the compiled code
            \${compiledJs}
            
            // 📤 Export the component
            window.App = module.exports && (module.exports.default || module.exports.App) || window.App;
          } catch(e){ 
            window.showError('Compilation Error: ' + e.message + '\\n' + e.stack); 
            throw e;
          }
        })();\`;
        
        // 🎭 Run in React context
        (new Function('React', 'ReactDOM', runner))(window.React, window.ReactDOM);
        
        // 🚨 Validate component exists
        if (!window.App) {
          throw new Error('❌ No default export found. Make sure to export a default React component like:\\n\\nexport default function MyComponent() { return <div>Hello</div>; }');
        }
        
        // 🎨 Render the component
        var rootEl = document.getElementById('root');
        if (window.ReactDOM.createRoot) {
          var root = window.ReactDOM.createRoot(rootEl);
          root.render(window.React.createElement(window.App));
        } else {
          window.ReactDOM.render(window.React.createElement(window.App), rootEl);
        }
        
        // 🎉 Success message
        console.log('✅ Enhanced UI rendered successfully with animation support!');
        
      } catch(e) { 
        window.showError('Runtime Error: ' + e.message);
        console.error('💥 Enhanced Preview Error:', e);
      }
    </script>
  </body>
</html>`;
}

export default function CodePreview({ code, className }: Props) {
  const srcDoc = useMemo(() => 
    wrapIfNeeded(code ?? "<div style=\"padding:2rem;text-align:center;min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white\"><h1 style=\"font-size:2rem;margin-bottom:1rem\">🎨 Enhanced Preview Ready!</h1><p>Generate an application with framer-motion, react-spring, or advanced CSS animations</p></div>"), 
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
