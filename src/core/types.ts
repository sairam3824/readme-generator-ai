export interface ProjectAnalysis {
  name: string;
  description?: string;
  language: string;
  framework?: string;
  packageManager?: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  structure: FileNode;
  entryPoints: string[];
  license?: string;
  scripts: Record<string, string>;
  hasTests: boolean;
  hasDocs: boolean;
}

export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  path: string;
}

export interface ReadmeOptions {
  style: 'minimal' | 'detailed' | 'enterprise';
  sections: {
    badges: boolean;
    toc: boolean;
    architecture: boolean;
    installation: boolean;
    usage: boolean;
    api: boolean;
    env: boolean;
    structure: boolean;
    contributing: boolean;
    license: boolean;
  };
}
