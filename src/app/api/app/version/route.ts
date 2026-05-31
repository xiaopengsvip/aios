import { NextResponse } from 'next/server';

// Android app version config
// Update this when publishing a new release
const LATEST_VERSION = {
  versionCode: 2,
  versionName: '1.1.0',
  minSupportedCode: 1,  // Force update below this
  downloadUrl: 'https://tc.allapple.top/raw/f8745a14ecde', // v1.1.0 APK
  releaseNotes: '1. 修复登录认证问题
2. 优化页面导航和返回
3. 新增在线更新功能
4. 适配 Android 15-17',
  releasedAt: new Date().toISOString(),
};

export async function GET() {
  return NextResponse.json(LATEST_VERSION);
}
