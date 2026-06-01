import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'app-installs.json');

interface DeviceRecord {
  deviceId: string;
  platform: string;
  appVersion: string;
  osVersion: string;
  deviceModel: string;
  firstSeen: string;
  lastSeen: string;
  ip: string;
  uninstalledAt?: string;
  updateCount: number;
}

export async function GET() {
  try {
    let records: DeviceRecord[] = [];
    try {
      records = JSON.parse(await readFile(DATA_FILE, 'utf-8'));
    } catch { return NextResponse.json(emptyStats()); }

    const total = records.length;

    // ── 按平台分组 ──
    const byPlatform: Record<string, number> = {};
    // ── 按系统版本分组 ──
    const byOsVersion: Record<string, number> = {};
    // ── 按设备型号分组 ──
    const byDeviceModel: Record<string, number> = {};
    // ── 按应用版本分组 ──
    const byAppVersion: Record<string, number> = {};
    // ── 每日新增 ──
    const dailyNew: Record<string, number> = {};
    // ── 按平台+设备型号交叉分组 ──
    const platformDevices: Record<string, Record<string, number>> = {};

    for (const r of records) {
      byPlatform[r.platform] = (byPlatform[r.platform] || 0) + 1;
      byOsVersion[r.osVersion] = (byOsVersion[r.osVersion] || 0) + 1;
      byDeviceModel[r.deviceModel] = (byDeviceModel[r.deviceModel] || 0) + 1;
      byAppVersion[r.appVersion] = (byAppVersion[r.appVersion] || 0) + 1;

      const day = r.firstSeen.slice(0, 10);
      dailyNew[day] = (dailyNew[day] || 0) + 1;

      if (!platformDevices[r.platform]) platformDevices[r.platform] = {};
      platformDevices[r.platform][r.deviceModel] = (platformDevices[r.platform][r.deviceModel] || 0) + 1;
    }

    // 活跃设备（7天内）
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const activeWeek = records.filter(r => r.lastSeen > weekAgo).length;

    // 今日新增
    const today = new Date().toISOString().slice(0, 10);
    const todayNew = dailyNew[today] || 0;

    // 卸载设备
    const uninstalled = records.filter(r => r.uninstalledAt);
    const totalUninstalled = uninstalled.length;
    const todayUninstalled = uninstalled.filter(r => r.uninstalledAt!.slice(0, 10) === today).length;

    // 更新量
    const totalUpdates = records.reduce((sum, r) => sum + (r.updateCount || 0), 0);
    const todayUpdates = records.filter(r => {
      if (!r.updateCount) return false;
      const lastSeenDay = r.lastSeen.slice(0, 10);
      return lastSeenDay === today;
    }).length;

    // 排序 helper
    const sortByValue = (obj: Record<string, number>) =>
      Object.entries(obj).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ name: k, count: v }));

    return NextResponse.json({
      total,
      activeWeek,
      todayNew,
      totalUninstalled,
      todayUninstalled,
      totalUpdates,
      todayUpdates,
      byPlatform: sortByValue(byPlatform),
      byAppVersion: sortByValue(byAppVersion),
      // 每个平台下的设备详情
      platforms: {
        android: {
          total: byPlatform['android'] || 0,
          devices: sortByValue(platformDevices['android'] || {}),
          osVersions: sortByValue(
            Object.fromEntries(
              Object.entries(byOsVersion).filter(([k]) =>
                records.filter(r => r.platform === 'android' && r.osVersion === k).length > 0
              )
            )
          ),
        },
        windows: {
          total: byPlatform['windows'] || 0,
          devices: sortByValue(platformDevices['windows'] || {}),
          osVersions: sortByValue(
            Object.fromEntries(
              Object.entries(byOsVersion).filter(([k]) =>
                records.filter(r => r.platform === 'windows' && r.osVersion === k).length > 0
              )
            )
          ),
        },
        macos: {
          total: byPlatform['macos'] || 0,
          devices: sortByValue(platformDevices['macos'] || {}),
        },
        linux: {
          total: byPlatform['linux'] || 0,
          devices: sortByValue(platformDevices['linux'] || {}),
        },
      },
      dailyNew: sortByValue(dailyNew).slice(-14), // 最近14天
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function emptyStats() {
  return {
    total: 0, activeWeek: 0, todayNew: 0,
    totalUninstalled: 0, todayUninstalled: 0,
    totalUpdates: 0, todayUpdates: 0,
    byPlatform: [], byAppVersion: [],
    platforms: {
      android: { total: 0, devices: [], osVersions: [] },
      windows: { total: 0, devices: [], osVersions: [] },
      macos: { total: 0, devices: [] },
      linux: { total: 0, devices: [] },
    },
    dailyNew: [],
  };
}
