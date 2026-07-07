import { create } from 'zustand';
import type { FaultRecord, VehicleState } from './types';

interface VehicleStore {
  currentData: VehicleState | null;
  historyData: VehicleState[];
  faults: FaultRecord[];
  isRecording: boolean;
  setCurrentData: (data: VehicleState) => void;
  addHistory: (data: VehicleState) => void;
  setFaults: (faults: FaultRecord[]) => void;
  setRecording: (recording: boolean) => void;
}

export const useVehicleStore = create<VehicleStore>((set) => ({
  currentData: null,
  historyData: [],
  faults: [],
  isRecording: false,
  setCurrentData: (data) => set({ currentData: data }),
  addHistory: (data) =>
    set((state) => ({
      historyData: [...state.historyData.slice(-3000), data],
    })),
  setFaults: (faults) => set({ faults }),
  setRecording: (recording) => set({ isRecording: recording }),
}));
