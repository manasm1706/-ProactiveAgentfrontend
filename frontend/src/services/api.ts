const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const apiOrigin = (configuredApiUrl || 'http://localhost:8000').replace(/\/+$/, '');
const BASE = apiOrigin.endsWith('/api') ? apiOrigin : `${apiOrigin}/api`;

async function req(path: string, opts: RequestInit = {}) {
  const response = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
      ...(opts.headers || {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed (${response.status})`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  customers: (query = '') => req('/customers' + query),
  customer: (id: string) => req('/customers/' + encodeURIComponent(id)),
  pipeline: (id: string) => req('/run-pipeline/' + encodeURIComponent(id), { method: 'POST' }),
  analytics: () => req('/analytics'),
  decisions: () => req('/decisions'),
  engagements: () => req('/engagements'),
  escalations: () => req('/escalations'),
  audit: () => req('/audit-logs'),
  signals: () => req('/signals'),
  datasetInfo: () => req('/dataset-info'),
  aiStatus: () => req('/ai-status'),
  customerChat: (id: string, message: string, conversation: { role: string; content: string }[]) =>
    req('/customers/' + encodeURIComponent(id) + '/chat', {
      method: 'POST',
      body: JSON.stringify({ message, conversation }),
    }),
  performance: () => req('/performance'),
  mcpStatus: () => req('/mcp-status'),
};
