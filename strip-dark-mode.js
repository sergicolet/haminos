const fs = require('fs');
const path = require('path');

const files = [
    'app/page.tsx',
    'app/login/page.tsx',
    'app/layout.tsx'
];

files.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        // Regex to match "dark:" followed by any non-whitespace, non-quote character
        // We replace it with nothing, effectively removing it.
        // We also handle cases where it might be at the start of the string or preceded by space.

        // This regex finds 'dark:' followed by word chars, dashes, etc until a space or quote
        const regex = /dark:[a-zA-Z0-9-\/\[\].#]+/g;

        const newContent = content.replace(regex, '');

        fs.writeFileSync(filePath, newContent);
        console.log(`Processed ${file}`);
    } else {
        console.log(`File not found: ${file}`);
    }
});
