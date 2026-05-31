import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

const VERSION_FILE = path.join(process.cwd(), 'data', 'app-versions.json');

// Default fallback if no version file exists
const DEFAULT_VERSION = {
  versionCode: 1,
  versionName: '0.0.1',
  minSupportedCode: 1,
  downloadUrl: 'https://aios.vios.top/apks/aios-0.0.1-1.apk',
  desktopDownloadUrl: 'https://github.com/xiaopengsvip/aios/releases/latest',
  desktopVersion: '0.0.1',
  releaseNotes: '0.0.1 初始开发版',
  releasedAt: new Date().toISOString(),
};

export async function GET(req: NextRequest) {
  try {
    const data = await readFile(VERSION_FILE, 'utf-8');
    const versions = JSON.parse(data);
    const latest = versions.latest;

    // Platform-aware response
    const platform = req.nextUrl.searchParams.get('platform');

    if (platform === 'desktop' || platform === 'windows') {
      return NextResponse.json({
        versionCode: latest.versionCode,
        versionName: latest.desktopVersion || latest.versionName,
        minSupportedCode: latest.minSupportedCode,
        downloadUrl: latest.desktopDownloadUrl || 'https://github.com/xiaopengsvip/aios/releases/latest',
        releaseNotes: latest.releaseNotes,
        releasedAt: latest.releasedAt,
      });
    }

    // Default: return full info with all platforms
    return NextResponse.json({
      versionCode: latest.versionCode,
      versionName: latest.versionName,
      minSupportedCode: latest.minSupportedCode,
      downloadUrl: latest.downloadUrl,
      desktopDownloadUrl: latest.desktopDownloadUrl || 'https://github.com/xiaopengsvip/aios/releases/latest',
      desktopVersion: latest.desktopVersion || latest.versionName,
      releaseNotes: latest.releaseNotes,
      releasedAt: latest.releasedAt,
      apkSize: latest.apkSize,
      filename: latest.filename,
    });
  } catch {
    return NextResponse.json(DEFAULT_VERSION);
  }
}
