import * as fs from 'fs';
import * as path from 'path';
import { ProjectAnalysis, FileNode } from './types';

const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '__pycache__']);
const IGNORE_FILES = new Set(['.DS_Store', 'package-lock.json', 'yarn.lock']);

export class DirectoryAnalyzer {
  async analyze(dirPath: string): Promise<ProjectAnalysis> {
    const structure = this.scanDirectory(dirPath);
    const language = this.detectLanguage(dirPath);
    const framework = this.detectFramework(dirPath);
    const packageManager = this.detectPackageManager(dirPath);
    const { dependencies, devDependencies, scripts, name, description } = this.parseDependencies(dirPath, language);
    const entryPoints = this.detectEntryPoints(dirPath);
    const license = this.detectLicense(dirPath);
    const hasTests = this.hasTestFiles(structure);
    const hasDocs = this.hasDocsFolder(structure);

    return {
      name: name || path.basename(dirPath),
      description,
      language,
      framework,
      packageManager,
      dependencies,
      devDependencies,
      structure,
      entryPoints,
      license,
      scripts,
      hasTests,
      hasDocs,
    };
  }

  private scanDirectory(dirPath: string, relativePath = '', depth = 0, maxDepth = 5): FileNode {
    const fullPath = relativePath ? path.join(dirPath, relativePath) : dirPath;
    const name = relativePath ? path.basename(relativePath) : path.basename(dirPath);
    
    if (!fs.existsSync(fullPath)) {
      return { name, type: 'directory', children: [], path: relativePath };
    }

    const stats = fs.statSync(fullPath);
    
    if (stats.isFile()) {
      return { name, type: 'file', path: relativePath };
    }

    // Prevent infinite recursion
    if (depth >= maxDepth) {
      return { name, type: 'directory', children: [], path: relativePath };
    }

    const children: FileNode[] = [];
    const entries = fs.readdirSync(fullPath);

    for (const entry of entries) {
      if (IGNORE_DIRS.has(entry) || IGNORE_FILES.has(entry)) continue;
      
      const childRelativePath = relativePath ? path.join(relativePath, entry) : entry;
      
      try {
        children.push(this.scanDirectory(dirPath, childRelativePath, depth + 1, maxDepth));
      } catch (err) {
        // Skip inaccessible files
      }
    }

    return { name, type: 'directory', children, path: relativePath };
  }

  private detectLanguage(dirPath: string): string {
    if (fs.existsSync(path.join(dirPath, 'package.json'))) return 'JavaScript/TypeScript';
    if (fs.existsSync(path.join(dirPath, 'requirements.txt')) || fs.existsSync(path.join(dirPath, 'setup.py'))) return 'Python';
    if (fs.existsSync(path.join(dirPath, 'go.mod'))) return 'Go';
    if (fs.existsSync(path.join(dirPath, 'Cargo.toml'))) return 'Rust';
    if (fs.existsSync(path.join(dirPath, 'pom.xml')) || fs.existsSync(path.join(dirPath, 'build.gradle'))) return 'Java';
    return 'Unknown';
  }

  private detectFramework(dirPath: string): string | undefined {
    const pkgPath = path.join(dirPath, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        
        if (deps.next) return 'Next.js';
        if (deps.react) return 'React';
        if (deps.vue) return 'Vue';
        if (deps.express) return 'Express';
        if (deps['@nestjs/core']) return 'NestJS';
      } catch (err) {
        // Invalid JSON, skip
      }
    }
    return undefined;
  }

  private detectPackageManager(dirPath: string): string | undefined {
    if (fs.existsSync(path.join(dirPath, 'package-lock.json'))) return 'npm';
    if (fs.existsSync(path.join(dirPath, 'yarn.lock'))) return 'yarn';
    if (fs.existsSync(path.join(dirPath, 'pnpm-lock.yaml'))) return 'pnpm';
    if (fs.existsSync(path.join(dirPath, 'requirements.txt'))) return 'pip';
    if (fs.existsSync(path.join(dirPath, 'Cargo.toml'))) return 'cargo';
    if (fs.existsSync(path.join(dirPath, 'go.mod'))) return 'go';
    return undefined;
  }

  private parseDependencies(dirPath: string, language: string) {
    let dependencies: Record<string, string> = {};
    let devDependencies: Record<string, string> = {};
    let scripts: Record<string, string> = {};
    let name = '';
    let description = '';

    if (language === 'JavaScript/TypeScript') {
      const pkgPath = path.join(dirPath, 'package.json');
      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
          dependencies = pkg.dependencies || {};
          devDependencies = pkg.devDependencies || {};
          scripts = pkg.scripts || {};
          name = pkg.name || '';
          description = pkg.description || '';
        } catch (err) {
          // Invalid JSON, skip
        }
      }
    } else if (language === 'Python') {
      const reqPath = path.join(dirPath, 'requirements.txt');
      if (fs.existsSync(reqPath)) {
        try {
          const content = fs.readFileSync(reqPath, 'utf-8');
          content.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
              const [pkg] = trimmed.split(/[=<>]/);
              dependencies[pkg.trim()] = trimmed;
            }
          });
        } catch (err) {
          // Skip
        }
      }
    }

    return { dependencies, devDependencies, scripts, name, description };
  }

  private detectEntryPoints(dirPath: string): string[] {
    const entryPoints: string[] = [];
    
    const candidates = ['index.js', 'index.ts', 'main.js', 'main.ts', 'app.js', 'app.ts', 'server.js', 'main.py', 'app.py', 'main.go'];
    
    for (const candidate of candidates) {
      if (fs.existsSync(path.join(dirPath, candidate))) {
        entryPoints.push(candidate);
      }
    }

    return entryPoints;
  }

  private detectLicense(dirPath: string): string | undefined {
    const licenseFiles = ['LICENSE', 'LICENSE.md', 'LICENSE.txt'];
    
    for (const file of licenseFiles) {
      const licensePath = path.join(dirPath, file);
      if (fs.existsSync(licensePath)) {
        try {
          const content = fs.readFileSync(licensePath, 'utf-8');
          if (content.includes('MIT')) return 'MIT';
          if (content.includes('Apache')) return 'Apache-2.0';
          if (content.includes('GPL')) return 'GPL-3.0';
          return 'Custom';
        } catch (err) {
          // Skip unreadable files
        }
      }
    }
    
    return undefined;
  }

  private hasTestFiles(node: FileNode): boolean {
    if (node.type === 'file' && (node.name.includes('.test.') || node.name.includes('.spec.'))) {
      return true;
    }
    if (node.children) {
      return node.children.some(child => this.hasTestFiles(child));
    }
    return false;
  }

  private hasDocsFolder(node: FileNode): boolean {
    if (node.type === 'directory' && (node.name === 'docs' || node.name === 'documentation')) {
      return true;
    }
    if (node.children) {
      return node.children.some(child => this.hasDocsFolder(child));
    }
    return false;
  }
}
