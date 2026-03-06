import { NextRequest, NextResponse } from 'next/server';
import { DirectoryAnalyzer } from '@/core/analyzer';
import { ReadmeGenerator } from '@/core/generator';
import { GitHubFetcher } from '@/core/github-fetcher';
import { RateLimiter } from '@/core/rate-limiter';
import { cleanupTempDir } from '@/core/utils';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const limiter = new RateLimiter(20, 60_000);

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  let tempDir: string | null = null;

  try {
    const allowed = await limiter.checkLimit();
    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please retry in a moment.',
          retryAfterMs: limiter.getWaitTime(),
        },
        { status: 429, headers: CORS_HEADERS }
      );
    }

    const { githubUrl, style, sections } = await request.json();

    if (!githubUrl) {
      return NextResponse.json(
        { error: 'GitHub URL is required' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    // Fetch repository
    const fetcher = new GitHubFetcher(process.env.GITHUB_TOKEN);
    const parsed = fetcher.parseGitHubUrl(githubUrl);

    if (!parsed) {
      return NextResponse.json(
        { error: 'Invalid GitHub URL' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    tempDir = await fetcher.fetchRepo(parsed.owner, parsed.repo);

    // Analyze
    const analyzer = new DirectoryAnalyzer();
    const analysis = await analyzer.analyze(tempDir);

    // Generate README
    const generator = new ReadmeGenerator(apiKey);
    const readme = await generator.generate(analysis, { style, sections });

    return NextResponse.json({ readme }, { headers: CORS_HEADERS });
  } catch (error: any) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate README' },
      { status: 500, headers: CORS_HEADERS }
    );
  } finally {
    // Cleanup temp directory
    if (tempDir) {
      try {
        cleanupTempDir(tempDir);
      } catch (err) {
        console.error('Failed to cleanup temp directory:', err);
      }
    }
  }
}
