import { useCallback, useEffect, useRef } from 'react';
import { socket } from '../socket';
import { useVehicleStore } from '../store';
import { TOPIC, setTopic } from '../topics';
import type { UserControl, VehicleState } from '../types';

const THROTTLE_MS = 200;

export function useVehicleData() {
  const setCurrentData = useVehicleStore((s) => s.setCurrentData);
  const addHistory = useVehicleStore((s) => s.addHistory);
  const lastTime = useRef(0);

  useEffect(() => {
    const handleData = (data: VehicleState) => {
      const now = Date.now();
      if (now - lastTime.current < THROTTLE_MS) return;
      lastTime.current = now;

      setCurrentData(data);
      addHistory(data);
      setTopic(TOPIC.VEHICLE_STATE, data);
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

export function emitVehicleControl(control: UserControl) {
  socket.emit('vehicleControl', control);
}
