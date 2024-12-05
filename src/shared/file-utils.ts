import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url"; 
import { writeToPath } from "fast-csv";

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getFilePath(file_name: string): { file_path: string, folder_path: string, file_exists: boolean } { 
  const folder_path = path.resolve(process.cwd(), ".output");
  const file_path = path.resolve(folder_path, file_name); 
  const file_exists = fs.existsSync(file_path);  
  return { file_path, folder_path, file_exists };
}

export function writeToFileSync(data: any, file_name: string): string {
  const { file_path, folder_path } = getFilePath(file_name);
 
  // create output folder if it doesn't exist
  if (!fs.existsSync(folder_path)) {
    fs.mkdirSync(folder_path);
  }

  // save data to a JSON file
  fs.writeFileSync(file_path, JSON.stringify(data, null, 2));

  console.log(`Data saved to ${file_path}`);

  return file_path;
}

export function readJsonFile<T>(file_name: string): T | null {
  const { file_path } = getFilePath(file_name);

  if (!fs.existsSync(file_path)) {
    console.error(`File not found: ${file_path}`);
    return null;
  }

  const fileContent = fs.readFileSync(file_path, 'utf-8');
  try {
    const data: T = JSON.parse(fileContent);
    return data;
  } catch (error) {
    console.error(`Error parsing JSON from file: ${file_path}`, error);
    return null;
  }
}

export function appendToFile(file_name: string, data: any) {
  const { file_path, folder_path } = getFilePath(file_name);
  
  // create output folder if it doesn't exist
  if (!fs.existsSync(folder_path)) {
    fs.mkdirSync(folder_path);
  }

  const json_data = JSON.stringify(data);
  fs.appendFileSync(file_path, `${json_data}\n`);

  return file_path;
}

export function writeToCsv(data: any[], file_name: string): string {
  const { file_path, folder_path } = getFilePath(file_name);
  
  // create output folder if it doesn't exist
  if (!fs.existsSync(folder_path)) {
    fs.mkdirSync(folder_path);
  }

  writeToPath(file_path, data, { headers: true })
    .on('error', err => console.error(err))
    .on('finish', () => console.log(`CSV saved to ${file_path}`));

  return file_path;
}