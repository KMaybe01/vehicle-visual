export interface VehicleState {
  speed: number;
  rpm: number;
  coolantTemp: number;
  batteryVoltage: number;
  throttlePos: number;
  brakePressed: boolean;
  steeringAngle: number;
  odometer: number;
  fuelLevel: number;
  gearPosition: string;
  turnSignal: 'none' | 'left' | 'right' | 'hazard';
  doorStatus: {
    frontLeft: boolean;
    frontRight: boolean;
    rearLeft: boolean;
    rearRight: boolean;
  };
  tirePressure: {
    frontLeft: number;
    frontRight: number;
    rearLeft: number;
    rearRight: number;
  };
  faultCodes: number[];
  timestamp: number;
}

export interface FaultRecord {
  code: number;
  description: string;
  level: 'minor' | 'moderate' | 'severe';
  timestamp: number;
  cleared: boolean;
}

export interface RecordFile {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  sampleCount: number;
  size: number;
}
