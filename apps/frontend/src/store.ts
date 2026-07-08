import { create } from 'zustand';
import type { FaultRecord, VehicleState } from './types';

const MAX_HISTORY = 500;

class RingBuffer {
  private buffer: VehicleState[] = new Array(MAX_HISTORY);
  private head = 0;
  private count = 0;

  push(item: VehicleState): void {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % MAX_HISTORY;
    if (this.count < MAX_HISTORY) this.count++;
  }

  toArray(): VehicleState[] {
    if (this.count < MAX_HISTORY) return this.buffer.slice(0, this.count);
    return [...this.buffer.slice(this.head), ...this.buffer.slice(0, this.head)];
  }
}

const ring = new RingBuffer();

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
  addHistory: (data) => {
    ring.push(data);
    set({ historyData: ring.toArray() });
  },
  setFaults: (faults) => set({ faults }),
  setRecording: (recording) => set({ isRecording: recording }),
}));
