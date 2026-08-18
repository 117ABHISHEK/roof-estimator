import { useEffect, useState } from 'react';
import { api } from '../../services/api.js';

function currencyFormat(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function LeadsTable() {
  const [leads, setLeads] = useState(null);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    api
      .getLeads()
      .then(setLeads)
      .catch((err) => setError(err.message || 'Could not load leads.'));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!leads) return <p className="text-gray-500">Loading leads…</p>;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Leads</h2>
          <p className="text-sm text-gray-500">{leads.length} captured</p>
        </div>
        <a
          href={api.exportLeadsCsvUrl()}
          className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Export CSV
        </a>
      </div>

      {leads.length === 0 && <p className="text-gray-400 text-sm">No leads captured yet.</p>}

      <div className="space-y-2">
        {leads.map((lead) => {
          const isOpen = expandedId === lead.id;
          return (
            <div key={lead.id} className="border rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedId(isOpen ? null : lead.id)}
                className="w-full text-left p-4 flex items-center justify-between gap-4 hover:bg-gray-50"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{lead.name}</p>
                  <p className="text-sm text-gray-500 truncate">
                    {lead.phone} · {lead.email}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-brand">
                    {currencyFormat(lead.estimate_low)}–{currencyFormat(lead.estimate_high)}
                  </p>
                  <p className="text-xs text-gray-400">{formatDate(lead.captured_at)}</p>
                </div>
              </button>
              {isOpen && (
                <div className="bg-gray-50 border-t p-4 text-sm">
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-2">
                    Answers (config v{lead.config_version})
                  </p>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {Object.entries(lead.answers).map(([key, value]) => (
                      <div key={key} className="contents">
                        <dt className="text-gray-500">{key}</dt>
                        <dd className="text-gray-900 font-medium">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
