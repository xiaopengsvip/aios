import { useState } from 'react';
import { api } from '../services/api';

interface FeatureProps { requireAuth?: (cb?: () => void) => boolean; isAuthed?: boolean; }

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', default: "console.log('Hello, AIOS!');" },
  { id: 'typescript', label: 'TypeScript', default: "const greeting: string = 'Hello, AIOS!';\nconsole.log(greeting);" },
  { id: 'python', label: 'Python', default: "print('Hello, AIOS!')" },
  { id: 'html', label: 'HTML', default: '<h1>Hello, AIOS!</h1>' },
  { id: 'json', label: 'JSON', default: '{\n  "name": "AIOS",\n  "version": "0.0.8"\n}' },
  { id: 'sql', label: 'SQL', default: 'SELECT * FROM "User" LIMIT 10;' },
  { id: 'shell', label: 'Shell', default: 'echo Hello AIOS' },
];

export function Code({ requireAuth, isAuthed }: FeatureProps) {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(LANGUAGES[0].default);
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [execTime, setExecTime] = useState<number | null>(null);

  const handleRun = async () => {
    if (requireAuth && !requireAuth()) return;
    setRunning(true);
    setOutput('Running...');
    setExecTime(null);
    try {
      const data = await api.post('/api/code/execute', { code, language });
      if (data.error) setOutput(`Error: ${data.error}\n${data.output || ''}`);
      else setOutput(data.output || '(no output)');
      setExecTime(data.executionTime || null);
    } catch (e: any) {
      setOutput(`Network error: ${e.message}`);
    } finally {
      setRunning(false);
    }
  };

  const handleLangChange = (langId: string) => {
    setLanguage(langId);
    const lang = LANGUAGES.find(l => l.id === langId);
    if (lang) setCode(lang.default);
    setOutput('');
  };

  return (
    <div className="feature-container" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="feature-header" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 18 }}>💻</span>
        <h2 style={{ fontSize: 14, fontWeight: 600 }}>AI Coding Workspace</h2>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={language} onChange={e => handleLangChange(e.target.value)} style={{ height: 32, padding: '0 8px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 12 }}>
            {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
          <button className="btn-send" onClick={handleRun} disabled={running} style={{ background: running ? '#666' : '#16a34a' }}>
            {running ? '⏳ Running...' : '▶ Run'}
          </button>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)' }}>
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            style={{
              flex: 1, padding: 12, fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontSize: 13, lineHeight: 1.6, background: '#1e1e2e', color: '#cdd6f4',
              border: 'none', resize: 'none', outline: 'none', tabSize: 2,
            }}
            spellCheck={false}
            onKeyDown={e => {
              if (e.key === 'Tab') {
                e.preventDefault();
                const start = e.currentTarget.selectionStart;
                const end = e.currentTarget.selectionEnd;
                setCode(code.substring(0, start) + '  ' + code.substring(end));
                setTimeout(() => { e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2; }, 0);
              }
            }}
          />
        </div>
        {/* Output */}
        <div style={{ flex: 0.4, display: 'flex', flexDirection: 'column', minWidth: 280 }}>
          <div style={{ padding: '6px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#888' }}>📺 Output</span>
            {execTime !== null && <span style={{ fontSize: 11, color: '#666', marginLeft: 'auto' }}>{execTime}ms</span>}
            {output && <button onClick={() => setOutput('')} style={{ fontSize: 11, color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>}
          </div>
          <pre style={{
            flex: 1, margin: 0, padding: 12, overflow: 'auto',
            fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: 1.5,
            background: '#11111b', color: '#a6adc8', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
          }}>
            {output || 'Click Run to execute code...'}
          </pre>
        </div>
      </div>
    </div>
  );
}
