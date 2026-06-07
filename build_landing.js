import fs from 'fs';
import path from 'path';

// Paths
const htmlPath = './landing_page_hostinger.html';
const cssPath = './landing_output.css';

// Read files
let htmlContent = fs.readFileSync(htmlPath, 'utf8');
const compiledCss = fs.readFileSync(cssPath, 'utf8');

// Custom CSS styles that were in the HTML
const customCss = `
    body {
      background-color: #030407;
      background-image: 
        radial-gradient(circle at 10% 20%, rgba(129, 236, 255, 0.05) 0%, transparent 40%),
        radial-gradient(circle at 90% 80%, rgba(159, 142, 255, 0.04) 0%, transparent 40%),
        radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.02) 0%, transparent 50%);
      position: relative;
    }
    
    /* Noise texture overlay */
    body::before {
      content: "";
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      opacity: 0.025;
      z-index: 9999;
      pointer-events: none;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
    }
    
    .glass {
      background: rgba(8, 10, 13, 0.65);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);
    }
    
    /* Double-Bezel (Doppelrand) Nested Container Architecture */
    .bezel-outer {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      padding: 6px;
      border-radius: 2rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    }
    
    .bezel-inner {
      background: rgba(8, 10, 13, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.04);
      border-radius: calc(2rem - 6px);
      box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.08);
    }
    
    /* Awwwards Spring Transition curve */
    .spring-transition {
      transition: all 700ms cubic-bezier(0.32, 0.72, 0, 1);
    }
    
    .text-glow {
      text-shadow: 0 0 20px rgba(0, 227, 253, 0.4);
    }
    
    .text-glow-amethyst {
      text-shadow: 0 0 20px rgba(159, 142, 255, 0.3);
    }
    
    .hologram {
      position: relative;
      overflow: hidden;
    }
    
    .hologram::after {
      content: '';
      position: absolute;
      top: -50%; left: -50%; right: -50%; bottom: -50%;
      background: linear-gradient(
        135deg, 
        rgba(255, 255, 255, 0) 30%, 
        rgba(129, 236, 255, 0.12) 50%, 
        rgba(255, 255, 255, 0) 70%
      );
      transform: rotate(25deg);
      transition: all 0.6s cubic-bezier(0.32, 0.72, 0, 1);
      z-index: 10;
      pointer-events: none;
    }
    
    .hologram:hover::after {
      transform: translate(50%, 50%) rotate(25deg);
    }
    
    .glow-card-hover {
      transition: all 600ms cubic-bezier(0.32, 0.72, 0, 1);
    }
    
    .glow-card-hover:hover {
      border-color: rgba(129, 236, 255, 0.2);
      box-shadow: 0 0 40px rgba(129, 236, 255, 0.05);
      transform: translateY(-2px);
    }
`;

// Replace script and old style with single compiled style
const tailwindScriptRegex = /<script src="https:\/\/cdn.tailwindcss.com"><\/script>\s*<script>\s*tailwind.config = [\s\S]*?<\/script>/;
const styleRegex = /<style>[\s\S]*?<\/style>/;

// Replace tailwind CDN and config scripts with nothing (they are no longer needed)
htmlContent = htmlContent.replace(tailwindScriptRegex, '');

// Combine compiled CSS and custom CSS in a single style tag
const combinedStyleTag = `<style>\n${compiledCss}\n${customCss}\n</style>`;

// Replace old style tag with the new combined style tag
htmlContent = htmlContent.replace(styleRegex, combinedStyleTag);

// Write back
fs.writeFileSync(htmlPath, htmlContent, 'utf8');
console.log('Successfully compiled landing page with inline Tailwind CSS and custom styles!');
