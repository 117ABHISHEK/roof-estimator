import { useEffect, useState } from 'react';
import { api } from '../../services/api.js';

const RATE_FIELDS = ['rate_per_sqft', 'multiplier', 'tear_off_per_sqft'];

function fieldLabel(field) {
  return { rate_per_sqft: 'Rate / sq ft', multiplier: 'Multiplier', tear_off_per_sqft: 'Tear-off / sq ft' }[field];
}

export default function ConfigEditor() {
  const [config, setConfig] = useState(null);
  const [savedVersion, setSavedVersion] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | saving | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    api
      .getAdminConfig()
      .then((data) => {
        setConfig(data);
        setSavedVersion(data.config_version);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  function updateQuestion(qIndex, patch) {
    setConfig((prev) => {
      const questions = [...prev.questions];
      questions[qIndex] = { ...questions[qIndex], ...patch };
      return { ...prev, questions };
    });
  }

  function updateOption(qIndex, oIndex, patch) {
    setConfig((prev) => {
      const questions = [...prev.questions];
      const options = [...questions[qIndex].options];
      options[oIndex] = { ...options[oIndex], ...patch };
      questions[qIndex] = { ...questions[qIndex], options };
      return { ...prev, questions };
    });
  }

  function updateModifier(key, value) {
    setConfig((prev) => ({ ...prev, modifiers: { ...prev.modifiers, [key]: value } }));
  }

  async function handleSave() {
    setStatus('saving');
    setMessage('');
    try {
      const result = await api.updateAdminConfig({
        business: config.business,
        questions: config.questions,
        modifiers: config.modifiers
      });
      setConfig(result);
      setSavedVersion(result.config_version);
      setStatus('ready');
      setMessage(`Saved — now live as version ${result.config_version}. The public estimator picks this up immediately.`);
    } catch (err) {
      setStatus('ready');
      setMessage(err.message || 'Could not save changes.');
    }
  }

  if (status === 'loading') return <p className="text-gray-500">Loading configuration…</p>;
  if (status === 'error' || !config) return <p className="text-red-600">Couldn't load configuration.</p>;

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Questions & Pricing</h2>
          <p className="text-sm text-gray-500">Currently live: version {savedVersion}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={status === 'saving'}
          className="px-5 py-2.5 rounded-lg bg-brand text-white font-semibold hover:bg-brand-dark disabled:opacity-60"
        >
          {status === 'saving' ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
      {message && <p className="text-sm text-brand-dark bg-brand/5 border border-brand/20 rounded-lg p-3">{message}</p>}

      {config.questions.map((q, qIndex) => (
        <div key={q.key} className="border rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <label className="text-xs font-semibold uppercase text-gray-400">Question label</label>
              <input
                value={q.label}
                onChange={(e) => updateQuestion(qIndex, { label: e.target.value })}
                className="w-full mt-1 p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand font-medium"
              />
            </div>
            <label className="flex items-center gap-2 pt-5 cursor-pointer select-none flex-shrink-0">
              <span className="text-sm text-gray-600">{q.active ? 'Shown to customers' : 'Hidden'}</span>
              <input
                type="checkbox"
                checked={q.active}
                onChange={(e) => updateQuestion(qIndex, { active: e.target.checked })}
                className="h-5 w-5 accent-brand"
              />
            </label>
          </div>

          {q.type === 'number' && (
            <div className="flex gap-4">
              <div>
                <label className="text-xs font-semibold uppercase text-gray-400">Min</label>
                <input
                  type="number"
                  value={q.min ?? ''}
                  onChange={(e) => updateQuestion(qIndex, { min: Number(e.target.value) })}
                  className="w-28 mt-1 p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-gray-400">Max</label>
                <input
                  type="number"
                  value={q.max ?? ''}
                  onChange={(e) => updateQuestion(qIndex, { max: Number(e.target.value) })}
                  className="w-28 mt-1 p-2 border rounded-lg"
                />
              </div>
            </div>
          )}

          {q.type === 'select' && (
            <div className="space-y-2">
              {q.options.map((opt, oIndex) => {
                const presentField = RATE_FIELDS.find((f) => opt[f] !== undefined);
                return (
                  <div key={opt.value} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                    <input
                      value={opt.label}
                      onChange={(e) => updateOption(qIndex, oIndex, { label: e.target.value })}
                      className="flex-1 p-2 border rounded-lg text-sm"
                    />
                    {presentField && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-gray-400 whitespace-nowrap">{fieldLabel(presentField)}</span>
                        <input
                          type="number"
                          step="0.01"
                          value={opt[presentField]}
                          onChange={(e) => updateOption(qIndex, oIndex, { [presentField]: Number(e.target.value) })}
                          className="w-24 p-2 border rounded-lg text-sm"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      <div className="border rounded-2xl p-5">
        <h3 className="font-bold text-gray-900 mb-4">Global modifiers</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase text-gray-400">Waste factor</label>
            <input
              type="number"
              step="0.01"
              value={config.modifiers.waste_factor}
              onChange={(e) => updateModifier('waste_factor', Number(e.target.value))}
              className="w-full mt-1 p-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-gray-400">Permit fee ($)</label>
            <input
              type="number"
              value={config.modifiers.permit_flat_fee}
              onChange={(e) => updateModifier('permit_flat_fee', Number(e.target.value))}
              className="w-full mt-1 p-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-gray-400">Range spread (%)</label>
            <input
              type="number"
              value={config.modifiers.range_spread_pct}
              onChange={(e) => updateModifier('range_spread_pct', Number(e.target.value))}
              className="w-full mt-1 p-2 border rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
