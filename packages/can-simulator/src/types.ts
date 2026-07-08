export interface CanMessage {
  id: number;
  data: number[];
  timestamp: number;
  extended: boolean;
}

export interface VehicleSignal {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

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

export interface VehicleConfig {
  maxSpeed: number;
  maxRpm: number;
  wheelBase: number;
  tireCirc: number;
}

export interface UserControl {
  throttle: number;
  brake: boolean;
  steeringAngle: number;
  gearPosition: string;
  turnSignal: 'none' | 'left' | 'right' | 'hazard';
  manualMode: boolean;
}
