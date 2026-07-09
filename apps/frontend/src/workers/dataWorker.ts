export interface ProcessedData {
  avgSpeed: number;
  avgRpm: number;
  maxSpeed: number;
  maxRpm: number;
  sampleCount: number;
  durationMs: number;
  faultCodeCounts: Record<number, number>;
}

export function processVehicleData(
  data: Array<{
    speed: number;
    rpm: number;
    timestamp: number;
    faultCodes: number[];
  }>,
): ProcessedData {
  if (data.length === 0) {
    return {
      avgSpeed: 0,
      avgRpm: 0,
      maxSpeed: 0,
      maxRpm: 0,
      sampleCount: 0,
      durationMs: 0,
      faultCodeCounts: {},
    };
  }

  let totalSpeed = 0;
  let totalRpm = 0;
  let maxSpeed = Number.NEGATIVE_INFINITY;
  let maxRpm = Number.NEGATIVE_INFINITY;
  const faultCodeCounts: Record<number, number> = {};

  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    totalSpeed += d.speed;
    totalRpm += d.rpm;
    if (d.speed > maxSpeed) maxSpeed = d.speed;
    if (d.rpm > maxRpm) maxRpm = d.rpm;
    for (let j = 0; j < d.faultCodes.length; j++) {
      const code = d.faultCodes[j];
      faultCodeCounts[code] = (faultCodeCounts[code] ?? 0) + 1;
    }
  }

  return {
    avgSpeed: totalSpeed / data.length,
    avgRpm: totalRpm / data.length,
    maxSpeed,
    maxRpm,
    sampleCount: data.length,
    durationMs: data[data.length - 1].timestamp - data[0].timestamp,
    faultCodeCounts,
  };
}

self.onmessage = (
  e: MessageEvent<
    Array<{
      speed: number;
      rpm: number;
      timestamp: number;
      faultCodes: number[];
    }>
  >,
) => {
  const result = processVehicleData(e.data);
  self.postMessage(result);
};
