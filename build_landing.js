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
      background-color: #07090C;
      background-image: 
        radial-gradient(circle at 10% 20%, rgba(0, 229, 255, 0.04) 0%, transparent 45%),
        radial-gradient(circle at 90% 80%, rgba(159, 142, 255, 0.03) 0%, transparent 45%);
    }
    .glass {
      background: rgba(12, 14, 17, 0.6);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(129, 236, 255, 0.08);
    }
    .text-glow {
      text-shadow: 0 0 20px rgba(0, 227, 253, 0.4);
    }
    .text-glow-amethyst {
      text-shadow: 0 0 20px rgba(159, 142, 255, 0.4);
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
        rgba(129, 236, 255, 0.08) 50%, 
        rgba(255, 255, 255, 0) 70%
      );
      transform: rotate(25deg);
      transition: all 0.5s ease;
      z-index: 10;
      pointer-events: none;
    }
    .hologram:hover::after {
      transform: translate(50%, 50%) rotate(25deg);
    }
    .glow-card-hover {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .glow-card-hover:hover {
      border-color: rgba(159, 142, 255, 0.25);
      box-shadow: 0 0 30px rgba(159, 142, 255, 0.06);
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
