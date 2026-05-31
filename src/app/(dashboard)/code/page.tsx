'use client';

import { useState } from 'react';
import Editor from '@monaco-editor/react';

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', defaultCode: "console.log('Hello, AIOS!');" },
  { id: 'typescript', label: 'TypeScript', defaultCode: "const greeting: string = 'Hello, AIOS!';\nconsole.log(greeting);" },
  { id: 'python', label: 'Python', defaultCode: "print('Hello, AIOS!')" },
  { id: 'html', label: 'HTML', defaultCode: '<h1>Hello, AIOS!</h1>' },
  { id: 'json', label: 'JSON', defaultCode: '{\n  "name": "AIOS",\n  "version": "0.3.2"\n}' },
  { id: 'sql', label: 'SQL', defaultCode: 'SELECT * FROM users LIMIT 10;' },
  { id: 'shell', label: 'Shell', defaultCode: 'echo Hello AIOS' },
];

export default function CodePage() {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(LANGUAGES[0].defaultCode);
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [theme, setTheme] = useState<'vs-dark' | 'light'>('vs-dark');

  const handleRun = async () => {
    setRunning(true);
    setOutput('Running...');
    try {
      const res = await fetch('/api/code/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });
      const data = await res.json();
      if (data.error) {
        setOutput(`Error: ${data.error}`);
      } else {
        setOutput(data.output || '(no output)');
      }
    } catch (e: any) {
      setOutput(`Network error: ${e.message}`);
    } finally {
      setRunning(false);
    }
  };

  const handleLanguageChange = (langId: string) => {
    setLanguage(langId);
    const lang = LANGUAGES.find(l => l.id === langId);
    if (lang) setCode(lang.defaultCode);
    setOutput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] lg:h-screen">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-border bg-card/50 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">💻</span>
          <h2 className="text-sm font-semibold">AI Coding Workspace</h2>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={e => handleLanguageChange(e.target.value)}
            className="h-8 px-2 text-xs rounded-lg border border-border bg-background"
          >
            {LANGUAGES.map(l => (
              <option key={l.id} value={l.id}>{l.label}</option>
            ))}
          </select>
          <button
            onClick={() => setTheme(t => t === 'vs-dark' ? 'light' : 'vs-dark')}
            className="h-8 px-2 text-xs rounded-lg border border-border hover:bg-accent"
          >
            {theme === 'vs-dark' ? '☀️' : '🌙'}
          </button>
          <button
            onClick={handleRun}
            disabled={running}
            className="h-8 px-4 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {running ? '⏳ Running...' : '▶ Run'}
          </button>
        </div>
      </div>

      {/* Editor + Output */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Editor */}
        <div className="flex-1 min-h-[300px] lg:min-h-0">
          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={v => setCode(v || '')}
            theme={theme}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              padding: { top: 12 },
            }}
          />
        </div>
        {/* Output Panel */}
        <div className="h-48 lg:h-auto lg:w-2/5 border-t lg:border-t-0 lg:border-l border-border bg-card flex flex-col">
          <div className="px-3 py-1.5 border-b border-border flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">📺 Output</span>
            {output && (
              <button
                onClick={() => setOutput('')}
                className="text-xs text-muted-foreground hover:text-foreground ml-auto"
              >
                Clear
              </button>
            )}
          </div>
          <pre className="flex-1 overflow-auto p-3 text-xs font-mono whitespace-pre-wrap text-foreground/80">
            {output || 'Click Run to execute code...'}
          </pre>
        </div>
      </div>
    </div>
  );
}
