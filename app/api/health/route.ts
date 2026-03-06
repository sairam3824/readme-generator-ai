import { NextResponse } from 'next/server';

export async function GET() {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const hasGitHub = !!process.env.GITHUB_TOKEN;

  return NextResponse.json({
    status: 'ok',
    config: {
      openai: hasOpenAI,
      model: openaiModel,
      github: hasGitHub,
    },
  });
}
