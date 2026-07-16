import { useEffect, useState } from 'react';
import { socket } from '../socket.js';
import { api } from '../api.js';

export function useAreaState(areaId) {
  const [state, setState] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    api.getArea(areaId).then((data) => mounted && setState(data)).catch((err) => setError(err.message));
    socket.emit('join-area', { areaId });
    const onState = (payload) => {
      if (payload?.area?.id === areaId) setState(payload);
    };
    const onError = (payload) => setError(payload.message);
    socket.on('area:state', onState);
    socket.on('app:error', onError);
    return () => {
      mounted = false;
      socket.off('area:state', onState);
      socket.off('app:error', onError);
    };
  }, [areaId]);

  return { state, error, clearError: () => setError('') };
}

export function useGlobalState() {
  const [state, setState] = useState(null);
  const [error, setError] = useState('');

  const reload = () => api.getState().then(setState).catch((err) => setError(err.message));

  useEffect(() => {
    reload();
    const onAdmin = () => reload();
    socket.on('admin:state', onAdmin);
    return () => socket.off('admin:state', onAdmin);
  }, []);

  return { state, error, reload, setError };
}
