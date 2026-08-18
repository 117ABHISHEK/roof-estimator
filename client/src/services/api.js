const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const error = new Error(body?.error || 'Request failed');
    error.status = res.status;
    error.fields = body?.fields;
    throw error;
  }
  return body;
}

export const api = {
  getConfig: () => request('/config'),
  submitEstimate: (payload) => request('/estimate', { method: 'POST', body: JSON.stringify(payload) }),

  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),

  getAdminConfig: () => request('/admin/config'),
  updateAdminConfig: (payload) => request('/admin/config', { method: 'PUT', body: JSON.stringify(payload) }),
  getConfigHistory: () => request('/admin/config/history'),
  getLeads: () => request('/admin/leads'),
  exportLeadsCsvUrl: () => `${API_BASE}/admin/leads/export.csv`
};
