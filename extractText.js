import { createWorker } from "tesseract.js";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputFile = path.join(__dirname, "src/fileList.json");
const fileList = JSON.parse(readFileSync(outputFile, "utf-8"));

async function processImages() {
  console.log("Starting OCR process...");
  const worker = await createWorker("hun");

  const years = Object.keys(fileList);
  let processedCount = 0;

  for (const year of years) {
    const releases = Object.keys(fileList[year]);
    for (const release of releases) {
      const entries = fileList[year][release];
      for (const entry of entries) {
        if (entry.text) {
          console.log(`Skipping ${entry.image} (already processed)`);
          continue;
        }

        const imagePath = path.join(__dirname, "public", entry.image);
        console.log(`[${++processedCount}] Processing ${entry.image}...`);

        try {
          const {
            data: { text },
          } = await worker.recognize(imagePath);
          entry.text = text;

          // Save progress every 5 images to avoid losing all work if interrupted
          if (processedCount % 5 === 0) {
            writeFileSync(outputFile, JSON.stringify(fileList, null, 2));
            console.log("Progress saved.");
          }
        } catch (error) {
          console.error(`Error processing ${imagePath}:`, error);
        }
      }
    }
  }

  // Final save
  writeFileSync(outputFile, JSON.stringify(fileList, null, 2));
  await worker.terminate();
  console.log("OCR process completed successfully.");
}

processImages().catch((err) => {
  console.error("Fatal error during OCR:", err);
  process.exit(1);
});
