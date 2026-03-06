'use client';

import { useState } from 'react';
import { Preview } from './components/Preview';
import { SectionToggle } from './components/SectionToggle';

export default function Home() {
  const [githubUrl, setGithubUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [readme, setReadme] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [style, setStyle] = useState<'minimal' | 'detailed' | 'enterprise'>('detailed');
  const [sections, setSections] = useState({
    badges: true,
    toc: true,
    architecture: true,
    installation: true,
    usage: true,
    api: true,
    env: true,
    structure: true,
    contributing: true,
    license: true,
  });

  const handleGenerate = async () => {
    if (!githubUrl.trim()) {
      setError('Please enter a GitHub URL');
      return;
    }

    setLoading(true);
    setError('');
    setReadme('');
    setProgress('Fetching repository...');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubUrl, style, sections }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate README');
      }

      setProgress('');
      setReadme(data.readme);
    } catch (err: any) {
      setError(err.message);
      setProgress('');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([readme], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'README.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(readme);
    alert('Copied to clipboard!');
  };

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            README Generator AI
          </h1>
          <p className="text-xl text-gray-600">
            Auto-generate professional READMEs for any GitHub repository
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GitHub Repository URL
            </label>
            <input
              type="text"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username/repo"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Style
            </label>
            <div className="flex gap-4">
              {(['minimal', 'detailed', 'enterprise'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  disabled={loading}
                  className={`px-6 py-2 rounded-lg font-medium transition ${
                    style === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <SectionToggle sections={sections} onChange={setSections} />

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Generating...' : 'Generate README'}
          </button>

          {progress && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-center">
              {progress}
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
        </div>

        {readme && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Preview</h2>
              <div className="flex gap-3">
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  Copy to Clipboard
                </button>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Download .md
                </button>
              </div>
            </div>
            <div className="border-t pt-6">
              <Preview content={readme} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
