// ============================================================
// 邮件系统 - 复用 ENXX SMTP 逻辑
// ============================================================

import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const MAIL_FROM = process.env.MAIL_FROM || 'noreply@allapple.top';
const MAIL_FROM_NAME = process.env.MAIL_FROM_NAME || 'AI Workspace OS';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@allapple.top';

// 创建 transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

interface MailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// 发送邮件
export async function sendMail(options: MailOptions): Promise<boolean> {
  try {
    // 如果收件人是测试地址或未配置 SMTP，使用测试邮箱
    const to = SMTP_HOST ? options.to : TEST_EMAIL;

    await transporter.sendMail({
      from: `"${MAIL_FROM_NAME}" <${MAIL_FROM}>`,
      to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log(`[Mail] Sent to ${to}: ${options.subject}`);
    return true;
  } catch (error: any) {
    console.error(`[Mail] Failed to send:`, error.message);
    return false;
  }
}

// ============================================================
// 邮件模板
// ============================================================

export function verificationEmail(code: string, locale: string = 'zh-CN') {
  const isZh = locale === 'zh-CN';
  return {
    subject: isZh ? `您的验证码: ${code}` : `Your Verification Code: ${code}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a1a;">${isZh ? 'AI 工作台' : 'AI Workspace OS'}</h2>
        <p style="color: #666;">${isZh ? '您的验证码是：' : 'Your verification code is:'}</p>
        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a;">${code}</span>
        </div>
        <p style="color: #999; font-size: 14px;">${isZh ? '验证码 5 分钟内有效，请勿泄露给他人。' : 'This code expires in 5 minutes. Do not share it.'}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #bbb; font-size: 12px;">${isZh ? '如非本人操作，请忽略此邮件。' : 'If you did not request this, please ignore this email.'}</p>
      </div>
    `,
  };
}

export function welcomeEmail(username: string, locale: string = 'zh-CN') {
  const isZh = locale === 'zh-CN';
  return {
    subject: isZh
      ? '欢迎加入 AI 工作台'
      : 'Welcome to AI Workspace OS',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a1a;">${isZh ? '欢迎加入 AI 工作台！' : 'Welcome to AI Workspace OS!'}</h2>
        <p style="color: #666;">${isZh ? `您好 ${username}，` : `Hello ${username},`}</p>
        <p style="color: #666;">${isZh ? '感谢您注册 AI 工作台。您可以开始使用多种 AI 模型进行对话、绘图、视频生成等。' : 'Thank you for registering. You can now use multiple AI models for chat, image generation, video creation, and more.'}</p>
        <a href="${process.env.APP_URL}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">${isZh ? '开始使用' : 'Get Started'}</a>
      </div>
    `,
  };
}

export function lowBalanceEmail(
  username: string,
  balance: number,
  locale: string = 'zh-CN'
) {
  const isZh = locale === 'zh-CN';
  return {
    subject: isZh ? '余额不足提醒' : 'Low Balance Alert',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #f59e0b;">${isZh ? '⚠️ 余额不足' : '⚠️ Low Balance'}</h2>
        <p style="color: #666;">${isZh ? `${username}，您的当前余额为 ¥${balance.toFixed(2)}，请及时充值。` : `${username}, your current balance is $${balance.toFixed(2)}. Please top up soon.`}</p>
        <a href="${process.env.APP_URL}/settings/billing" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">${isZh ? '去充值' : 'Top Up'}</a>
      </div>
    `,
  };
}

export function taskCompleteEmail(
  username: string,
  taskType: string,
  taskUrl: string,
  locale: string = 'zh-CN'
) {
  const isZh = locale === 'zh-CN';
  const typeLabel: Record<string, string> = {
    image: isZh ? '图片生成' : 'Image Generation',
    video: isZh ? '视频生成' : 'Video Generation',
    audio: isZh ? '音频生成' : 'Audio Generation',
  };
  return {
    subject: `${typeLabel[taskType] || taskType} ${isZh ? '完成' : 'Complete'}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #10b981;">✅ ${typeLabel[taskType] || taskType} ${isZh ? '已完成' : 'Complete'}</h2>
        <p style="color: #666;">${isZh ? `${username}，您的${typeLabel[taskType]}任务已完成。` : `${username}, your ${typeLabel[taskType]} task is complete.`}</p>
        <a href="${taskUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">${isZh ? '查看结果' : 'View Result'}</a>
      </div>
    `,
  };
}

export function passwordResetEmail(
  username: string,
  code: string,
  locale: string = 'zh-CN'
) {
  const isZh = locale === 'zh-CN';
  return {
    subject: isZh ? `密码重置验证码: ${code}` : `Password Reset Code: ${code}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a1a;">${isZh ? '🔐 密码重置' : '🔐 Password Reset'}</h2>
        <p style="color: #666;">${isZh ? `${username}，您正在重置密码。您的验证码是：` : `${username}, you are resetting your password. Your code is:`}</p>
        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a;">${code}</span>
        </div>
        <p style="color: #999; font-size: 14px;">${isZh ? '验证码 10 分钟内有效。如非本人操作，请立即修改密码。' : 'This code expires in 10 minutes. If you did not request this, change your password immediately.'}</p>
      </div>
    `,
  };
}

export function systemAlertEmail(
  username: string,
  title: string,
  message: string,
  locale: string = 'zh-CN'
) {
  const isZh = locale === 'zh-CN';
  return {
    subject: `[AIOS] ${title}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #6366f1;">🔔 ${title}</h2>
        <p style="color: #666;">${isZh ? `${username}，` : `${username},`}</p>
        <p style="color: #666;">${message}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #bbb; font-size: 12px;">${isZh ? '此邮件由系统自动发送' : 'This is an automated system email'}</p>
      </div>
    `,
  };
}

export function keyExpirationEmail(
  providerName: string,
  keyMask: string,
  daysLeft: number,
  locale: string = 'zh-CN'
) {
  const isZh = locale === 'zh-CN';
  const isUrgent = daysLeft <= 3;
  const color = isUrgent ? '#ef4444' : '#f59e0b';
  const icon = isUrgent ? '🚨' : '⚠️';

  return {
    subject: isZh
      ? `${icon} API Key 将在 ${daysLeft} 天后过期 - ${providerName}`
      : `${icon} API Key expires in ${daysLeft} days - ${providerName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: ${color};">${icon} ${isZh ? 'API Key 即将过期' : 'API Key Expiring Soon'}</h2>
        <div style="background: #fef3c7; border-left: 4px solid ${color}; padding: 16px; border-radius: 4px; margin: 16px 0;">
          <p style="margin: 0 0 8px; font-weight: bold; color: #1a1a1a;">${providerName}</p>
          <p style="margin: 0 0 4px; color: #666; font-size: 14px;">${isZh ? 'Key' : 'Key'}: <code>${keyMask}</code></p>
          <p style="margin: 0; color: ${color}; font-weight: bold;">${isZh ? `将在 ${daysLeft} 天后过期` : `Expires in ${daysLeft} days`}</p>
        </div>
        <p style="color: #666; font-size: 14px;">${isZh
          ? '请及时更新 API Key，避免服务中断。'
          : 'Please update your API Key to avoid service interruption.'
        }</p>
        <a href="${process.env.APP_URL}/admin/keys" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">${isZh ? '管理 Keys' : 'Manage Keys'}</a>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #bbb; font-size: 12px;">${isZh ? '此邮件由系统自动发送' : 'This is an automated system email'}</p>
      </div>
    `,
  };
}
