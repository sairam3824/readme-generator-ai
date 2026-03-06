interface SectionToggleProps {
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
  onChange: (sections: {
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
  }) => void;
}

export function SectionToggle({ sections, onChange }: SectionToggleProps) {
  type SectionKey = keyof SectionToggleProps['sections'];

  const sectionLabels: Record<SectionKey, string> = {
    badges: 'Badges',
    toc: 'Table of Contents',
    architecture: 'Architecture Diagram',
    installation: 'Installation',
    usage: 'Usage Examples',
    api: 'API Reference',
    env: 'Environment Variables',
    structure: 'Project Structure',
    contributing: 'Contributing',
    license: 'License',
  };

  const toggleSection = (key: SectionKey) => {
    onChange({ ...sections, [key]: !sections[key] });
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Sections to Include
      </label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {(Object.entries(sectionLabels) as [SectionKey, string][]).map(([key, label]) => (
          <label key={key} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={sections[key]}
              onChange={() => toggleSection(key)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
