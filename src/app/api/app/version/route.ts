import { NextResponse } from 'next/server';

// Android app version config
// Update this when publishing a new release
const LATEST_VERSION = {
  versionCode: 1,
  versionName: '0.0.1-beta',
  minSupportedCode: 1,
  downloadUrl: 'https://tc.allapple.top/raw/f8745a14ecde',
  releaseNotes: '0.0.1-beta 初始开发版',
  releasedAt: new Date().toISOString(),
};

export async function GET() {
  return NextResponse.json(LATEST_VERSION);
}
