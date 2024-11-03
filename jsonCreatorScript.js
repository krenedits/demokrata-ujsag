import { readdirSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory containing the images, relative to this script's location
const imagesDir = path.join(__dirname, 'public/images');
const outputFile = path.join(__dirname, 'public/fileList.json');

const result = {};

// Read each year folder in images directory
readdirSync(imagesDir, { withFileTypes: true }).forEach((yearDir) => {
    if (yearDir.isDirectory()) {
        const year = yearDir.name;
        const yearPath = path.join(imagesDir, year);

        // Initialize an array for each year in the result object
        result[year] = {};

        // List all files in the year directory
        const files = readdirSync(yearPath);

        // Process each file in the year directory
        files.forEach((file) => {
            if (!file.endsWith('.jpg')) {
                return;
            }
            const [date, suffix] = file.split('_');
            const dateOnly = date.replace('.jpg', ''); // Strip .jpg for clean date key
            const release = dateOnly.split('-')[1];

            // If the release hasn't been added yet, add it to the result object
            if (!result[year][release]) {
                result[year][release] = [];
            }

            if (
                !result[year][release].find((entry) => entry.date === dateOnly)
            ) {
                // Initialize the object if this date hasn't been added yet
                result[year][release].push({
                    date: dateOnly,
                    image: `/images/${year}/${dateOnly}.jpg`,
                });
            }

            // If a `_k` version exists, add it to the entry
            if (suffix && suffix.trim() === 'k.jpg') {
                const entry = result[year][release].find(
                    (entry) => entry.date === dateOnly
                );
                entry.image_k = `/images/${year}/${date}_k.jpg`;
            }
        });
    }
});

// Write the output to file
writeFileSync(outputFile, JSON.stringify(result, null, 2));
console.log('File list generated in fileList.json');
