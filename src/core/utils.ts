import * as fs from 'fs';
import * as path from 'path';

export function cleanupTempDir(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

export function validateApiKey(apiKey: string | undefined): boolean {
  return !!apiKey && apiKey.startsWith('sk-');
}

export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}
