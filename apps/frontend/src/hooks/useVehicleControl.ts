import { useCallback, useEffect, useRef } from 'react';
import type { UserControl } from '../types';
import { emitVehicleControl } from './useVehicleData';

const IDLE: UserControl = {
  throttle: 0,
  brake: false,
  steeringAngle: 0,
  gearPosition: 'D',
  turnSignal: 'none',
  manualMode: false,
};

export function useVehicleControl() {
  const sendRef = useRef<number>(0);

  const controlRef = useRef<UserControl>({ ...IDLE });
  const keysRef = useRef(new Set<string>());
  const [getManualMode, setManualMode] = [
    useRef(false),
    useRef((v: boolean) => {
      getManualMode.current = v;
    }),
  ];

  const sync = useCallback(() => {
    const now = Date.now();
    if (now - sendRef.current > 80) {
      sendRef.current = now;
      emitVehicleControl(controlRef.current);
    }
  }, []);

  const updateKeys = useCallback(() => {
    const k = keysRef.current;
    const c = controlRef.current;

    if (k.has('w') || k.has('arrowup')) {
      c.throttle = Math.min(100, c.throttle + 10);
    } else if (c.throttle > 0) {
      c.throttle = Math.max(0, c.throttle - 5);
    }

    c.brake = k.has('s') || k.has('arrowdown');

    if (k.has('a') || k.has('arrowleft')) {
      c.steeringAngle = Math.max(-45, c.steeringAngle - 4);
    } else if (k.has('d') || k.has('arrowright')) {
      c.steeringAngle = Math.min(45, c.steeringAngle + 4);
    } else if (Math.abs(c.steeringAngle) > 0.5) {
      c.steeringAngle *= 0.65;
    } else {
      c.steeringAngle = 0;
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();

      keysRef.current.add(key);

      if (key === 'q') {
        controlRef.current.turnSignal = controlRef.current.turnSignal === 'left' ? 'none' : 'left';
      } else if (key === 'e') {
        controlRef.current.turnSignal =
          controlRef.current.turnSignal === 'right' ? 'none' : 'right';
      } else if (key === ' ') {
        e.preventDefault();
        controlRef.current.turnSignal =
          controlRef.current.turnSignal === 'hazard' ? 'none' : 'hazard';
      } else if (key === 'm') {
        const mode = !controlRef.current.manualMode;
        controlRef.current.manualMode = mode;
        if (!mode) {
          controlRef.current.throttle = 0;
          controlRef.current.brake = false;
          controlRef.current.steeringAngle = 0;
          controlRef.current.turnSignal = 'none';
        }
        emitVehicleControl({ ...controlRef.current });
      } else if (key === 'p') {
        controlRef.current.gearPosition = 'P';
      } else if (key === 'r' && !e.shiftKey) {
        controlRef.current.gearPosition = 'R';
      } else if (key === 'n') {
        controlRef.current.gearPosition = 'N';
      } else if (key === 'd') {
        controlRef.current.gearPosition = 'D';
      }

      updateKeys();
      sync();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
      updateKeys();
      sync();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const interval = setInterval(() => {
      updateKeys();
      sync();
    }, 100);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(interval);
    };
  }, [updateKeys, sync]);

  const setControl = useCallback(
    (partial: Partial<UserControl>) => {
      Object.assign(controlRef.current, partial);
      if (partial.manualMode !== undefined) {
        getManualMode.current = partial.manualMode;
      }
      sync();
    },
    [sync],
  );

  const resetControls = useCallback(() => {
    controlRef.current = { ...IDLE };
    emitVehicleControl({ ...IDLE });
  }, []);

  return { controlRef, setControl, resetControls };
}
