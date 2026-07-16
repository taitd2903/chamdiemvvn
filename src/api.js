const API_URL = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || 'Có lỗi xảy ra');
  }
  return data;
}

export const api = {
  apiUrl: API_URL,
  getState: () => request('/api/state'),
  getSettings: () => request('/api/settings'),
  updateSettings: (payload) => request('/api/settings', { method: 'PUT', body: JSON.stringify(payload) }),
  resetTournamentData: () => request('/api/settings/reset-tournament-data', { method: 'POST' }),
  getAreas: () => request('/api/areas'),
  getArea: (areaId) => request(`/api/areas/${areaId}`),
  createArea: (payload) => request('/api/areas', { method: 'POST', body: JSON.stringify(payload) }),
  updateArea: (areaId, payload) => request(`/api/areas/${areaId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  changeAreaType: (areaId, payload) => request(`/api/areas/${areaId}/type`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteArea: (areaId) => request(`/api/areas/${areaId}`, { method: 'DELETE' }),

  getContents: () => request('/api/contents'),
  createContent: (payload) => request('/api/contents', { method: 'POST', body: JSON.stringify(payload) }),
  deleteContent: (id) => request(`/api/contents/${id}`, { method: 'DELETE' }),

  getAthletes: () => request('/api/athletes'),
  createAthlete: (payload) => request('/api/athletes', { method: 'POST', body: JSON.stringify(payload) }),
  deleteAthlete: (id) => request(`/api/athletes/${id}`, { method: 'DELETE' }),

  getRegistrations: () => request('/api/registrations'),
  createRegistration: (payload) => request('/api/registrations', { method: 'POST', body: JSON.stringify(payload) }),
  deleteRegistration: (id) => request(`/api/registrations/${id}`, { method: 'DELETE' }),

  createFormEntry: (payload) => request('/api/forms/entries', { method: 'POST', body: JSON.stringify(payload) }),
  selectFormEntry: (entryId) => request(`/api/forms/entries/${entryId}/select`, { method: 'POST' }),
  updateFormStatus: (entryId, status) => request(`/api/forms/entries/${entryId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  createFightMatch: (payload) => request('/api/fighting/matches', { method: 'POST', body: JSON.stringify(payload) }),
  updateFightStatus: (matchId, status) => request(`/api/fighting/matches/${matchId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
};
