import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jsonDir = path.join(__dirname, '../json');

export const readJson = async (filename) => {
  try {
    const filePath = path.join(jsonDir, `${filename}.json`);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}.json:`, error.message);
    return [];
  }
};

export const writeJson = async (filename, data) => {
  try {
    const filePath = path.join(jsonDir, `${filename}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing ${filename}.json:`, error.message);
    throw error;
  }
};
