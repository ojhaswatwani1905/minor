import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jsonDir = path.join(__dirname, '../json');

export const readJson = async (filename) => {
  const filePath = path.join(jsonDir, `${filename}.json`);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      if (!data || !data.trim()) {
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, 50));
          continue;
        }
        return [];
      }
      return JSON.parse(data);
    } catch (error) {
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 50));
        continue;
      }
      console.error(`Error reading ${filename}.json:`, error.message);
      return [];
    }
  }
  return [];
};

export const writeJson = async (filename, data) => {
  try {
    const filePath = path.join(jsonDir, `${filename}.json`);
    const tmpPath = path.join(jsonDir, `${filename}.${Date.now()}.${Math.random().toString(36).slice(2, 6)}.tmp`);
    const content = JSON.stringify(data, null, 2);
    await fs.writeFile(tmpPath, content, 'utf8');
    await fs.rename(tmpPath, filePath);
    return true;
  } catch (error) {
    console.error(`Error writing ${filename}.json:`, error.message);
    throw error;
  }
};
