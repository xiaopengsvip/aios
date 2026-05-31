import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

const VERSION_FILE = path.join(process.cwd(), 'data', 'app-versions.json');

// Default fallback if no version file exists
const DEFAULT_VERSION = {
  versionCode: 1,
  versionName: '0.0.1-beta',
  minSupportedCode: 1,
  downloadUrl: 'https://tc.allapple.top/raw/f8745a14ecde',
  releaseNotes: '0.0.1-beta 初始开发版',
  releasedAt: new Date().toISOString(),
};

export async function GET() {
  try {
    const data = await readFile(VERSION_FILE, 'utf-8');
    const versions = JSON.parse(data);
    return NextResponse.json(versions.latest);
  } catch {
    // Fallback to default
    return NextResponse.json(DEFAULT_VERSION);
  }
}
