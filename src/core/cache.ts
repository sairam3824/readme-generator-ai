import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

const CACHE_DIR_NAME = '.readme-gen-cache';

export class Cache {
  private cacheDir: string | null;

  constructor() {
    this.cacheDir = this.resolveCacheDir();
  }

  private resolveCacheDir(): string | null {
    const configuredPath = process.env.README_GEN_CACHE_DIR;
    const candidates = [
      configuredPath,
      path.join(os.homedir(), CACHE_DIR_NAME),
      path.join(os.tmpdir(), CACHE_DIR_NAME),
    ].filter((candidate): candidate is string => !!candidate);

    for (const candidate of candidates) {
      try {
        fs.mkdirSync(candidate, { recursive: true });
        return candidate;
      } catch (err) {
        // Try next candidate path.
      }
    }

    return null;
  }

  private getKey(input: string): string {
    return crypto.createHash('md5').update(input).digest('hex');
  }

  get(key: string): string | null {
    if (!this.cacheDir) return null;

    const cacheKey = this.getKey(key);
    const cachePath = path.join(this.cacheDir, `${cacheKey}.json`);
    
    if (fs.existsSync(cachePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
        const age = Date.now() - data.timestamp;
        
        // Cache expires after 24 hours
        if (age < 24 * 60 * 60 * 1000) {
          return data.content;
        }
      } catch (err) {
        // Invalid cache, ignore
      }
    }
    
    return null;
  }

  set(key: string, content: string): void {
    if (!this.cacheDir) return;

    try {
      const cacheKey = this.getKey(key);
      const cachePath = path.join(this.cacheDir, `${cacheKey}.json`);
      
      fs.writeFileSync(cachePath, JSON.stringify({
        content,
        timestamp: Date.now(),
      }));
    } catch (err) {
      // Silently fail if cache write fails
      console.error('Cache write failed:', err);
    }
  }

  clear(): void {
    if (!this.cacheDir) return;

    try {
      if (fs.existsSync(this.cacheDir)) {
        fs.rmSync(this.cacheDir, { recursive: true, force: true });
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }
    } catch (err) {
      console.error('Cache clear failed:', err);
    }
  }
}
