const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      if (file === 'node_modules' || file === '.next') continue;
      walk(full);
    } else if (file === 'page.tsx' || file === 'route.ts' || file === 'route.tsx') {
      let content = fs.readFileSync(full, 'utf8');

      // Remove any previously added export const dynamic line
      content = content.replace(/^export const dynamic = 'force-dynamic';\n/gm, '');

      // Skip if already has dynamic export
      if (content.includes("export const dynamic")) {
        fs.writeFileSync(full, content);
        console.log('Skipped (already has dynamic):', full);
        continue;
      }

      // Skip 'use client' pages - they don't need force-dynamic
      if (content.includes("'use client'") || content.includes('"use client"')) {
        fs.writeFileSync(full, content);
        console.log('Skipped (use client):', full);
        continue;
      }

      // Add to server components and API routes
      content = "export const dynamic = 'force-dynamic';\n" + content;
      fs.writeFileSync(full, content);
      console.log('Patched:', full);
    }
  }
}

walk(path.join(__dirname, 'src'));
console.log('Done.');
