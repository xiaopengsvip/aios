import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'app-installs.json');

async function ensureDir() {
  const dir = path.dirname(DATA_FILE);
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
}

async function readData(): Promise<DeviceRecord[]> {
  try {
    return JSON.parse(await readFile(DATA_FILE, 'utf-8'));
  } catch { return []; }
}

async function writeData(records: DeviceRecord[]) {
  await ensureDir();
  await writeFile(DATA_FILE, JSON.stringify(records, null, 2));
}

interface DeviceRecord {
  deviceId: string;
  platform: 'android' | 'windows' | 'macos' | 'linux';
  appVersion: string;
  osVersion: string;
  deviceModel: string;
  firstSeen: string;
  lastSeen: string;
  ip: string;
}

// POST /api/app/install - Record device install
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deviceId, platform, appVersion, osVersion, deviceModel } = body;

    if (!deviceId || !platform) {
      return NextResponse.json({ error: 'Missing deviceId or platform' }, { status: 400 });
    }

    const records = await readData();
    const existing = records.find(r => r.deviceId === deviceId);
    const now = new Date().toISOString();
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

    if (existing) {
      // Update last seen
      existing.lastSeen = now;
      existing.appVersion = appVersion || existing.appVersion;
      existing.osVersion = osVersion || existing.osVersion;
      existing.ip = ip;
      await writeData(records);
      return NextResponse.json({ success: true, isNew: false });
    }

    // New device
    records.push({
      deviceId,
      platform: platform as any,
      appVersion: appVersion || 'unknown',
      osVersion: osVersion || 'unknown',
      deviceModel: deviceModel || 'unknown',
      firstSeen: now,
      lastSeen: now,
      ip,
    });
    await writeData(records);

    return NextResponse.json({ success: true, isNew: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/app/install - List all devices (admin)
export async function GET() {
  try {
    const records = await readData();
    return NextResponse.json({ total: records.length, devices: records });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
