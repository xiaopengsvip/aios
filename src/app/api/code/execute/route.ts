import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { code, language } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    // Simulated execution - in production, use a sandboxed runner (Docker, Firecracker, etc.)
    let output = '';
    const startTime = Date.now();

    switch (language) {
      case 'javascript':
      case 'typescript':
        try {
          // Capture console.log
          const logs: string[] = [];
          const mockConsole = { log: (...args: any[]) => logs.push(args.map(String).join(' ')) };
          const fn = new Function('console', code);
          fn(mockConsole);
          output = logs.join('\n') || '(no output)';
        } catch (e: any) {
          output = `Error: ${e.message}`;
        }
        break;

      case 'python':
        output = `[Python execution simulated]\n> ${code.split('\n')[0]}\nNote: Install Pyodide or use a backend runner for real Python execution.`;
        break;

      case 'html':
        output = `[HTML Preview]\n${code}`;
        break;

      case 'json':
        try {
          JSON.parse(code);
          output = '✓ Valid JSON';
        } catch (e: any) {
          output = `✗ Invalid JSON: ${e.message}`;
        }
        break;

      case 'sql':
        output = `[SQL execution simulated]\nQuery: ${code}\nNote: Connect to a database for real SQL execution.`;
        break;

      case 'shell':
        output = `[Shell execution simulated]\n$ ${code}\nNote: Use a sandboxed environment for real shell execution.`;
        break;

      default:
        output = `Language "${language}" execution not supported yet.`;
    }

    const executionTime = Date.now() - startTime;
    return NextResponse.json({ output, executionTime, language });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
