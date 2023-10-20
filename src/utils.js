import fs from 'fs';
import { resolve } from 'path';

/**
 * Returns the size of a file.
 *
 * @param { string } filePath
 * @returns { Promise<number> } Returns the size of a file in bytes
 */
export async function getContentLength(filePath) {
  return fs.promises.stat(filePath).then(stat => stat.size);
}

/**
 * Reads all files recursively from a directory.
 *
 * @param { string } dir
 * @returns { Promise<string[]> } Returns a list of file paths
 */
export async function readFilesRecursively(dir) {
  const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map(dirent => {
      const res = resolve(dir, dirent.name);
      return dirent.isDirectory() ? readFilesRecursively(res) : res;
    })
  );
  return Array.prototype.concat(...files);
}
