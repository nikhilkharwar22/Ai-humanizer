import { useMemo, useState } from 'react';

const MAX_WORDS = 5000;
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const modeOptions = [
  { value: 'light', label: 'Light', description: 'Minor improvements and grammar polishing.' },
  { value: 'standard', label: 'Standard', description: 'Natural conversational tone with restructuring.' },
  { value: 'advanced', label: 'Advanced', description: 'Deep rewriting with varied rhythm and storytelling.' },
];

function countWords(text) {
  return (text.trim().match(/\S+/g) || []).length;
}

export default function HumanizerUI() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('standard');
  const [output, setOutput] = useState('');
  const [score, setScore] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(true);

  const wordCount = useMemo(() => countWords(input), [input]);
  const canSubmit = input.trim() && wordCount <= MAX_WORDS && !loading;

  async function humanize() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/humanize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input, mode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to humanize text right now.');
      }

      setOutput(data.humanized_text || '');
      setScore(data.score ?? null);
      setMetrics(data.metrics ?? null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function copyOutput() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
  }

  function downloadOutput() {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'humanized-text.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const pageTheme = darkMode
    ? 'bg-slate-950 text-slate-100'
    : 'bg-slate-100 text-slate-900';

  const panelTheme = darkMode
    ? 'bg-slate-900 border-slate-700'
    : 'bg-white border-slate-300';

  return (
    <div className={`min-h-screen ${pageTheme} transition-colors`}>
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">AI Text Humanizer</h1>
            <p className="mt-1 text-sm opacity-80">
              Rewrite robotic text into natural, human-like writing while preserving meaning.
            </p>
          </div>

          <button
            type="button"
            className="rounded-lg border px-3 py-2 text-sm"
            onClick={() => setDarkMode((value) => !value)}
          >
            {darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </button>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className={`rounded-xl border p-4 ${panelTheme}`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Input Text</h2>
              <p className={`text-sm ${wordCount > MAX_WORDS ? 'text-red-400' : 'opacity-80'}`}>
                {wordCount}/{MAX_WORDS} words
              </p>
            </div>

            <textarea
              className="h-72 w-full rounded-lg border border-slate-500 bg-transparent p-3 text-sm outline-none ring-cyan-400 focus:ring"
              placeholder="Paste text to humanize..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />

            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium">Humanization Level</label>
              <div className="grid gap-2 sm:grid-cols-3">
                {modeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setMode(option.value)}
                    className={`rounded-lg border px-3 py-2 text-left text-xs ${
                      mode === option.value
                        ? 'border-cyan-400 bg-cyan-900/40'
                        : 'border-slate-500 hover:border-cyan-400'
                    }`}
                  >
                    <p className="font-semibold">{option.label}</p>
                    <p className="mt-1 opacity-80">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={!canSubmit}
              onClick={humanize}
              className="mt-4 w-full rounded-lg bg-cyan-500 px-4 py-3 font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Humanizing...' : 'Humanize Text'}
            </button>

            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
          </section>

          <section className={`rounded-xl border p-4 ${panelTheme}`}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Humanized Output</h2>
              <div className="flex gap-2">
                <button type="button" onClick={copyOutput} className="rounded border px-2 py-1 text-xs">
                  Copy
                </button>
                <button
                  type="button"
                  onClick={downloadOutput}
                  className="rounded border px-2 py-1 text-xs"
                >
                  Download TXT
                </button>
              </div>
            </div>

            <div className="h-72 overflow-y-auto rounded-lg border border-slate-500 p-3 text-sm leading-6">
              {output || <span className="opacity-60">Your rewritten text appears here.</span>}
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-500 p-3">
                <p className="text-xs opacity-70">Human-likeness Score</p>
                <p className="text-2xl font-bold">{score ?? '--'}</p>
              </div>

              <div className="rounded-lg border border-slate-500 p-3 text-xs">
                <p className="mb-1 font-semibold">Metrics</p>
                <p>Sentence variation: {metrics?.sentenceVariation ?? '--'}</p>
                <p>Vocabulary diversity: {metrics?.vocabularyDiversity ?? '--'}</p>
                <p>Readability: {metrics?.readability ?? '--'}</p>
                <p>Burstiness: {metrics?.burstiness ?? '--'}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
