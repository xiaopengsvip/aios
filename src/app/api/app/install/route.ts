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
  uninstalledAt?: string;
  updateCount: number;
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
      // Track version update
      const isUpdate = appVersion && appVersion !== existing.appVersion;
      existing.lastSeen = now;
      if (isUpdate) {
        existing.appVersion = appVersion;
        existing.updateCount = (existing.updateCount || 0) + 1;
      }
      existing.osVersion = osVersion || existing.osVersion;
      existing.ip = ip;
      existing.uninstalledAt = undefined; // Clear if re-installed
      await writeData(records);
      return NextResponse.json({ success: true, isNew: false, isUpdate });
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
      updateCount: 0,
    });
    await writeData(records);

    return NextResponse.json({ success: true, isNew: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/app/install - Record device uninstall
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { deviceId } = body;

    if (!deviceId) {
      return NextResponse.json({ error: 'Missing deviceId' }, { status: 400 });
    }

    const records = await readData();
    const existing = records.find(r => r.deviceId === deviceId);

    if (existing) {
      existing.uninstalledAt = new Date().toISOString();
      await writeData(records);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Device not found' }, { status: 404 });
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
