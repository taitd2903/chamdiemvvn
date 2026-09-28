const API_URL = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'vvn_auth_token';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY) || '',
  setToken: (token) => token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY),
  clear: () => localStorage.removeItem(TOKEN_KEY)
};

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(authStorage.getToken() ? { Authorization: `Bearer ${authStorage.getToken()}` } : {}),
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
  login: (payload) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request('/api/auth/me'),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  changePassword: (payload) => request('/api/auth/password', { method: 'PATCH', body: JSON.stringify(payload) }),
  getPublicTournament: () => request('/api/public/tournament'),
  getUsers: () => request('/api/users'),
  createUser: (payload) => request('/api/users', { method: 'POST', body: JSON.stringify(payload) }),
  resetUserPassword: (id, password) => request(`/api/users/${id}/password`, { method: 'PATCH', body: JSON.stringify({ password }) }),
  updateUserStatus: (id, active) => request(`/api/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ active }) }),
  getBrackets: () => request('/api/draws/brackets'),
  drawFighting: (payload) => request('/api/draws/fighting', { method: 'POST', body: JSON.stringify(payload) }),
  createFormSchedule: (payload) => request('/api/draws/forms', { method: 'POST', body: JSON.stringify(payload) }),
  getRegistrationStatus: () => request('/api/registrations/status'),
  lockRegistrations: () => request('/api/registrations/lock', { method: 'POST' }),
  unlockRegistrations: () => request('/api/registrations/unlock', { method: 'POST' }),
  getState: () => request('/api/state'),
  getSettings: () => request('/api/settings'),
  updateSettings: (payload) => request('/api/settings', { method: 'PUT', body: JSON.stringify(payload) }),
  resetTournamentData: () => request('/api/settings/reset-tournament-data', { method: 'POST' }),
  clearFightingData: () => request('/api/settings/clear-fighting-data', { method: 'POST' }),
  getWeighIns: () => request('/api/weigh-ins'),
  updateWeighIn: (athleteId, contentId, payload) => request(`/api/weigh-ins/${athleteId}/${contentId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  lockWeighIn: (athleteId, contentId) => request(`/api/weigh-ins/${athleteId}/${contentId}/lock`, { method: 'POST' }),
  unlockWeighIn: (athleteId, contentId) => request(`/api/weigh-ins/${athleteId}/${contentId}/unlock`, { method: 'POST' }),
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
  updateAthlete: (id, payload) => request(`/api/athletes/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
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
