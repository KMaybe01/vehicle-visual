import { useEffect, useSyncExternalStore } from 'react';
import type { FaultRecord, VehicleState } from './types';

type TopicValue = VehicleState | VehicleState[] | FaultRecord[] | boolean | null;

type Listener = (value: TopicValue) => void;

const topics = new Map<string, Set<Listener>>();

function subscribe(topic: string, listener: Listener): () => void {
  if (!topics.has(topic)) topics.set(topic, new Set());
  topics.get(topic)!.add(listener);
  return () => topics.get(topic)?.delete(listener);
}

function publish(topic: string, value: TopicValue) {
  topics.get(topic)?.forEach((fn) => fn(value));
}

const snapshots = new Map<string, TopicValue>();

export function setTopic(topic: string, value: TopicValue) {
  snapshots.set(topic, value);
  publish(topic, value);
}

function getSnapshot(topic: string) {
  return () => snapshots.get(topic) ?? null;
}

function getServerSnapshot() {
  return null;
}

export function useTopic<T extends TopicValue>(topic: string): T | null {
  return useSyncExternalStore(
    (cb: () => void) => {
      return subscribe(topic, () => cb());
    },
    getSnapshot(topic),
    getServerSnapshot,
  ) as T | null;
}

const TOPIC = {
  VEHICLE_STATE: '/vehicle/state',
  VEHICLE_HISTORY: '/vehicle/history',
  VEHICLE_FAULTS: '/vehicle/faults',
  VEHICLE_RECORDING: '/vehicle/recording',
} as const;

export { TOPIC };

export function subscribeTopic(topic: string, listener: Listener): () => void {
  return subscribe(topic, listener);
}
