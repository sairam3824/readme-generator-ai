import { ProjectAnalysis, ReadmeOptions, FileNode } from './types';

export class PromptBuilder {
  build(analysis: ProjectAnalysis, options: ReadmeOptions): string {
    const sections = this.buildSectionsList(options);
    
    return `Generate a professional README.md file for the following project:

PROJECT DETAILS:
- Name: ${analysis.name}
- Description: ${analysis.description || 'Not provided'}
- Language: ${analysis.language}
- Framework: ${analysis.framework || 'None detected'}
- Package Manager: ${analysis.packageManager || 'None detected'}
- License: ${analysis.license || 'Not specified'}
- Has Tests: ${analysis.hasTests ? 'Yes' : 'No'}
- Has Documentation: ${analysis.hasDocs ? 'Yes' : 'No'}

DEPENDENCIES:
${Object.keys(analysis.dependencies).length > 0 ? Object.entries(analysis.dependencies).map(([k, v]) => `- ${k}: ${v}`).join('\n') : 'None'}

SCRIPTS:
${Object.keys(analysis.scripts).length > 0 ? Object.entries(analysis.scripts).map(([k, v]) => `- ${k}: ${v}`).join('\n') : 'None'}

ENTRY POINTS:
${analysis.entryPoints.length > 0 ? analysis.entryPoints.join(', ') : 'None detected'}

PROJECT STRUCTURE:
${this.formatStructure(analysis.structure)}

STYLE: ${options.style}

REQUIRED SECTIONS:
${sections.join('\n')}

Generate a complete, professional README.md with:
1. Clear project title and one-line description
2. Relevant badges (build, license, version)
3. Detailed overview explaining what the project does
4. Table of contents (if detailed/enterprise style)
5. Architecture diagram using Mermaid syntax (if applicable)
6. Prerequisites and installation instructions
7. Usage examples with code blocks
8. API documentation (if it's a library/API)
9. Environment variables table (if applicable)
10. Project structure tree
11. Contributing guidelines
12. License section

Make it engaging, professional, and developer-friendly. Use proper markdown formatting.`;
  }

  private buildSectionsList(options: ReadmeOptions): string[] {
    const sections: string[] = [];
    if (options.sections.badges) sections.push('- Badges');
    if (options.sections.toc) sections.push('- Table of Contents');
    if (options.sections.architecture) sections.push('- Architecture Diagram (Mermaid)');
    if (options.sections.installation) sections.push('- Installation');
    if (options.sections.usage) sections.push('- Usage Examples');
    if (options.sections.api) sections.push('- API Reference');
    if (options.sections.env) sections.push('- Environment Variables');
    if (options.sections.structure) sections.push('- Project Structure');
    if (options.sections.contributing) sections.push('- Contributing Guidelines');
    if (options.sections.license) sections.push('- License');
    return sections;
  }

  private formatStructure(node: FileNode, indent = 0, maxDepth = 3): string {
    if (indent > maxDepth) return '';
    
    const prefix = '  '.repeat(indent);
    let result = `${prefix}${node.name}\n`;
    
    if (node.children && indent < maxDepth) {
      const sortedChildren = [...node.children].sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'directory' ? -1 : 1;
      });
      
      for (const child of sortedChildren.slice(0, 20)) {
        result += this.formatStructure(child, indent + 1, maxDepth);
      }
    }
    
    return result;
  }
}
