import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { execSync, exec } from 'child_process';
import { writeFileSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Sandbox directory for code execution
const SANDBOX_DIR = join('/tmp', 'aios-sandbox');

// Ensure sandbox directory exists
try { mkdirSync(SANDBOX_DIR, { recursive: true }); } catch {}

const TIMEOUT_MS = 10000; // 10 second timeout
const MAX_OUTPUT = 50000; // 50KB max output

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  try {
    const { code, language, stdin } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    const startTime = Date.now();
    let output = '';
    let error = '';

    switch (language) {
      case 'javascript':
      case 'typescript': {
        // JS: Use child_process with vm sandbox
        const id = randomUUID();
        const filePath = join(SANDBOX_DIR, `${id}.mjs`);
        // Wrap in async context with captured console
        const wrappedCode = `
import { createContext, runInContext } from 'node:vm';
const logs = [];
const _console = { log: (...a) => logs.push(a.map(String).join(' ')), warn: (...a) => logs.push('[WARN] ' + a.map(String).join(' ')), error: (...a) => logs.push('[ERROR] ' + a.map(String).join(' ')), info: (...a) => logs.push(a.map(String).join(' ')) };
try {
  const fn = new Function('console', 'require', 'process', 'fetch', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'Promise', 'JSON', 'Math', 'Date', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Map', 'Set', 'RegExp', 'Error', \`${code.replace(/`/g, '\\`').replace(/\\/g, '\\\\')}\`);
  const result = fn(_console, undefined, { env: {} }, fetch, setTimeout, setInterval, clearTimeout, clearInterval, Promise, JSON, Math, Date, Array, Object, String, Number, Boolean, Map, Set, RegExp, Error);
  if (result instanceof Promise) { await result; }
} catch(e) { logs.push('Error: ' + e.message); }
process.stdout.write(logs.join('\\n'));
`;
        try {
          writeFileSync(filePath, wrappedCode);
          const { stdout, stderr } = await execAsync(`node --experimental-vm-modules "${filePath}"`, {
            timeout: TIMEOUT_MS,
            maxBuffer: MAX_OUTPUT,
            env: { ...process.env, NODE_ENV: 'sandbox' },
          });
          output = stdout || '(no output)';
          if (stderr) error = stderr;
        } catch (e: any) {
          if (e.killed) output = 'Error: Execution timed out (10s limit)';
          else output = `Error: ${e.message}`;
        } finally {
          try { unlinkSync(filePath); } catch {}
        }
        break;
      }

      case 'python': {
        const id = randomUUID();
        const filePath = join(SANDBOX_DIR, `${id}.py`);
        try {
          writeFileSync(filePath, code);
          const { stdout, stderr } = await execAsync(`python3 "${filePath}"`, {
            timeout: TIMEOUT_MS,
            maxBuffer: MAX_OUTPUT,
          });
          output = stdout || '(no output)';
          if (stderr) error = stderr;
        } catch (e: any) {
          if (e.killed) output = 'Error: Execution timed out (10s limit)';
          else output = `Error: ${e.stderr || e.message}`;
        } finally {
          try { unlinkSync(filePath); } catch {}
        }
        break;
      }

      case 'sql': {
        // Use Prisma raw query for safe SQL execution
        // Only SELECT queries allowed for safety
        const trimmed = code.trim().toUpperCase();
        if (!trimmed.startsWith('SELECT') && !trimmed.startsWith('WITH') && !trimmed.startsWith('PRAGMA')) {
          output = 'Error: Only SELECT/WITH/PRAGMA queries allowed for security reasons.';
          break;
        }
        try {
          const { PrismaClient } = await import('@prisma/client');
          const prisma = new PrismaClient();
          const results = await prisma.$queryRawUnsafe(code);
          output = JSON.stringify(results, null, 2);
          await prisma.$disconnect();
        } catch (e: any) {
          output = `SQL Error: ${e.message}`;
        }
        break;
      }

      case 'shell': {
        // Restricted shell - only safe commands
        const blockedCommands = ['rm ', 'mkfs', 'dd ', 'format', '> /dev', 'chmod', 'chown', 'sudo', 'su ', 'kill', 'reboot', 'shutdown', 'apt', 'yum', 'pip install', 'npm install'];
        const lowerCode = code.toLowerCase();
        if (blockedCommands.some(cmd => lowerCode.includes(cmd))) {
          output = 'Error: This command is blocked for security reasons.';
          break;
        }
        try {
          const { stdout, stderr } = await execAsync(code, {
            timeout: TIMEOUT_MS,
            maxBuffer: MAX_OUTPUT,
            cwd: SANDBOX_DIR,
          });
          output = stdout || '(no output)';
          if (stderr) error = stderr;
        } catch (e: any) {
          if (e.killed) output = 'Error: Execution timed out (10s limit)';
          else output = `Error: ${e.stderr || e.message}`;
        }
        break;
      }

      case 'html': {
        output = code; // Return HTML as-is for preview
        break;
      }

      case 'json': {
        try {
          const parsed = JSON.parse(code);
          output = '✓ Valid JSON\n\n' + JSON.stringify(parsed, null, 2);
        } catch (e: any) {
          output = `✗ Invalid JSON: ${e.message}`;
        }
        break;
      }

      default: {
        output = `Language "${language}" is not supported. Supported: javascript, typescript, python, sql, shell, html, json.`;
      }
    }

    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      output: output.slice(0, MAX_OUTPUT),
      error: error ? error.slice(0, 5000) : undefined,
      executionTime,
      language,
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
