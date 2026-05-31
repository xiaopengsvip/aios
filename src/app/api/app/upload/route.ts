import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const VERSION_FILE = path.join(process.cwd(), 'data', 'app-versions.json');
const APK_DIR = path.join(process.cwd(), 'public', 'apks');

// Ensure directories exist
async function ensureDirs() {
  if (!existsSync(APK_DIR)) await mkdir(APK_DIR, { recursive: true });
  const dataDir = path.join(process.cwd(), 'data');
  if (!existsSync(dataDir)) await mkdir(dataDir, { recursive: true });
}

// Read version config
async function readVersions(): Promise<any> {
  try {
    const data = await readFile(VERSION_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {
      latest: { versionCode: 0, versionName: '0.0.0', downloadUrl: '', releaseNotes: '', releasedAt: '', minSupportedCode: 0 },
      history: []
    };
  }
}

// Write version config
async function writeVersions(data: any) {
  await writeFile(VERSION_FILE, JSON.stringify(data, null, 2));
}

// POST /api/app/upload - Upload new APK
export async function POST(req: NextRequest) {
  try {
    await ensureDirs();

    const formData = await req.formData();
    const file = formData.get('apk') as File | null;
    const versionName = formData.get('versionName') as string;
    const versionCode = parseInt(formData.get('versionCode') as string || '0');
    const releaseNotes = formData.get('releaseNotes') as string || '';
    const minSupportedCode = parseInt(formData.get('minSupportedCode') as string || '0');
    const apiKey = formData.get('apiKey') as string;

    // Simple auth check
    if (apiKey !== process.env.API_SERVER_KEY && apiKey !== 'aios-apk-upload-2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!file || !versionName || !versionCode) {
      return NextResponse.json({ error: 'Missing required fields: apk, versionName, versionCode' }, { status: 400 });
    }

    // Save APK file
    const filename = `aios-${versionName}-${versionCode}.apk`;
    const filePath = path.join(APK_DIR, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Build download URL
    const host = req.headers.get('host') || 'aios.vios.top';
    const proto = req.headers.get('x-forwarded-proto') || 'https';
    const downloadUrl = `${proto}://${host}/apks/${filename}`;

    // Update version config
    const versions = await readVersions();
    const newVersion = {
      versionCode,
      versionName,
      minSupportedCode: minSupportedCode || versionCode - 1,
      downloadUrl,
      releaseNotes,
      releasedAt: new Date().toISOString(),
      apkSize: buffer.length,
      filename,
    };

    // Archive current latest
    if (versions.latest.versionCode > 0) {
      versions.history.unshift(versions.latest);
    }

    versions.latest = newVersion;
    await writeVersions(versions);

    return NextResponse.json({
      success: true,
      message: `v${versionName} uploaded successfully`,
      version: newVersion,
    });
  } catch (error: any) {
    console.error('[APK Upload Error]', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}

// GET /api/app/upload - List versions (admin)
export async function GET() {
  try {
    await ensureDirs();
    const versions = await readVersions();
    return NextResponse.json(versions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
