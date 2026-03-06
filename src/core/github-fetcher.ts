import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export class GitHubFetcher {
  private octokit: Octokit;

  constructor(token?: string) {
    this.octokit = new Octokit({ auth: token });
  }

  async fetchRepo(owner: string, repo: string): Promise<string> {
    const tempDir = path.join(os.tmpdir(), `readme-gen-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    await this.downloadRepoContents(owner, repo, '', tempDir);
    
    return tempDir;
  }

  private async downloadRepoContents(owner: string, repo: string, dirPath: string, localPath: string): Promise<void> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path: dirPath,
      });

      if (!Array.isArray(data)) return;

      for (const item of data) {
        if (item.name === 'node_modules' || item.name === '.git') continue;

        const itemLocalPath = path.join(localPath, item.name);

        if (item.type === 'file' && item.download_url) {
          const response = await fetch(item.download_url);
          const content = await response.text();
          fs.writeFileSync(itemLocalPath, content);
        } else if (item.type === 'dir') {
          fs.mkdirSync(itemLocalPath, { recursive: true });
          await this.downloadRepoContents(owner, repo, item.path, itemLocalPath);
        }
      }
    } catch (error: any) {
      // Handle rate limiting and API errors gracefully
      if (error.status === 403) {
        throw new Error('GitHub API rate limit exceeded. Please provide a GITHUB_TOKEN.');
      }
      throw error;
    }
  }

  parseGitHubUrl(url: string): { owner: string; repo: string } | null {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);
    if (!match) return null;
    const repo = match[2].replace(/\.git$/, '').split('/')[0];
    return { owner: match[1], repo };
  }
}
