import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { realtimeService, RealtimeEventCallback } from '../services/websocket';

export const useRealtime = () => {
  const { user, token, isAdmin } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token || !user) {
      realtimeService.disconnect();
      setIsConnected(false);
      return;
    }

    const channel = isAdmin ? 'admin' : 'customer';
    realtimeService.connect(channel, token);

    const unsubscribeStatus = realtimeService.subscribe('STATUS_CHANGE', (data) => {
      setIsConnected(data.status === 'connected');
    });

    return () => {
      unsubscribeStatus();
    };
  }, [token, user, isAdmin]);

  const on = useCallback((eventType: string, callback: RealtimeEventCallback) => {
    return realtimeService.subscribe(eventType, callback);
  }, []);

  return {
    isConnected,
    on,
  };
};
