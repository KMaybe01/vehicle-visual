import { useCallback, useEffect } from 'react';
import { socket } from '../socket';
import { useVehicleStore } from '../store';
import type { VehicleState } from '../types';

export function useVehicleData() {
  const setCurrentData = useVehicleStore((s) => s.setCurrentData);
  const addHistory = useVehicleStore((s) => s.addHistory);

  useEffect(() => {
    const handleData = (data: VehicleState) => {
      setCurrentData(data);
      addHistory(data);
    };

    socket.on('vehicleData', handleData);
    return () => {
      socket.off('vehicleData', handleData);
    };
  }, [setCurrentData, addHistory]);

  const getHistory = useCallback((durationMs = 60000) => {
    socket.emit('getHistory', durationMs);
  }, []);

  const toggleDriving = useCallback(() => {
    socket.emit('toggleDriving');
  }, []);

  const reset = useCallback(() => {
    socket.emit('reset');
  }, []);

  return { getHistory, toggleDriving, reset };
}

export function emitToggleDriving() {
  socket.emit('toggleDriving');
}

export function emitReset() {
  socket.emit('reset');
}
