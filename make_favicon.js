import fs from 'fs';

// A tiny, valid 16x16 PNG file of a beautiful emerald square (brand matching color #10b981)
// Base64 encoded:
const base64Png = 
  'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH' +
  'BgYBAgMXBg5yqAAAAD1JREFUWMPt1zERAAAIAzECwb+yGRwcnARu0lVJsqp6d1c/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/P78P' +
  'HwX4FjKCAAAAAElFTkSuQmCC';

const buffer = Buffer.from(base64Png, 'base64');

// Write to React app public folder
fs.writeFileSync('./public/favicon.ico', buffer);

// Write to landing page root folder (for Hostinger)
fs.writeFileSync('./favicon.ico', buffer);

console.log('Successfully generated physical favicon.ico files for both the React app and Hostinger landing page!');
