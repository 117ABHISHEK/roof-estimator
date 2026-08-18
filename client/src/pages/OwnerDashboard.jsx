import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import ConfigEditor from '../components/owner/ConfigEditor.jsx';
import LeadsTable from '../components/owner/LeadsTable.jsx';

export default function OwnerDashboard() {
  const [tab, setTab] = useState('leads');
  const [authChecked, setAuthChecked] = useState(false);
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api
      .me()
      .then((data) => {
        setUsername(data.username);
        setAuthChecked(true);
      })
      .catch(() => navigate('/admin/login'));
  }, [navigate]);

  async function handleLogout() {
    await api.logout();
    navigate('/admin/login');
  }

  if (!authChecked) return <div className="p-10 text-gray-500">Checking session…</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Owner Panel</h1>
          <p className="text-sm text-gray-500">Signed in as {username}</p>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-800">
          Log out
        </button>
      </div>

      <div className="flex gap-2 mb-8 border-b">
        {[
          { id: 'leads', label: 'Leads' },
          { id: 'config', label: 'Questions & Pricing' }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px ${
              tab === t.id ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'leads' ? <LeadsTable /> : <ConfigEditor />}
    </div>
  );
}
