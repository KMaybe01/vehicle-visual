import type { UserControl, VehicleConfig, VehicleState } from './types';

const DEFAULT_CONFIG: VehicleConfig = {
  maxSpeed: 180,
  maxRpm: 8000,
  wheelBase: 2.8,
  tireCirc: 2.05,
};

interface TripSegment {
  targetSpeed: number;
  targetSteer: number;
  duration: number;
  label: string;
}

const URBAN_TRIP: TripSegment[] = [
  { targetSpeed: 0, targetSteer: 0, duration: 40, label: '怠速' },
  { targetSpeed: 40, targetSteer: 0, duration: 80, label: '起步加速' },
  { targetSpeed: 40, targetSteer: 0, duration: 120, label: '市区巡航' },
  { targetSpeed: 25, targetSteer: 25, duration: 60, label: '右转弯' },
  { targetSpeed: 35, targetSteer: 0, duration: 100, label: '弯后加速' },
  { targetSpeed: 60, targetSteer: 0, duration: 150, label: '主干道巡航' },
  { targetSpeed: 30, targetSteer: -30, duration: 70, label: '左转弯' },
  { targetSpeed: 50, targetSteer: 0, duration: 120, label: '出弯加速' },
  { targetSpeed: 0, targetSteer: 0, duration: 60, label: '红灯减速' },
  { targetSpeed: 0, targetSteer: 0, duration: 50, label: '停车等待' },
  { targetSpeed: 60, targetSteer: 0, duration: 100, label: '绿灯起步' },
  { targetSpeed: 80, targetSteer: 0, duration: 200, label: '快速路巡航' },
  { targetSpeed: 80, targetSteer: 15, duration: 80, label: '微右弯' },
  { targetSpeed: 80, targetSteer: 0, duration: 160, label: '直道行驶' },
  { targetSpeed: 80, targetSteer: -15, duration: 80, label: '微左弯' },
  { targetSpeed: 80, targetSteer: 0, duration: 180, label: '快速路行驶' },
  { targetSpeed: 40, targetSteer: 0, duration: 80, label: '减速出快速路' },
  { targetSpeed: 40, targetSteer: 0, duration: 100, label: '辅路行驶' },
  { targetSpeed: 0, targetSteer: 0, duration: 70, label: '到达减速' },
  { targetSpeed: 0, targetSteer: 0, duration: 60, label: '停车熄火' },
];

const HIGHWAY_TRIP: TripSegment[] = [
  { targetSpeed: 0, targetSteer: 0, duration: 30, label: '启动' },
  { targetSpeed: 60, targetSteer: 0, duration: 100, label: '加速驶入' },
  { targetSpeed: 100, targetSteer: 0, duration: 50, label: '汇入主路' },
  { targetSpeed: 120, targetSteer: 0, duration: 300, label: '高速巡航' },
  { targetSpeed: 120, targetSteer: 20, duration: 100, label: '右侧弯道' },
  { targetSpeed: 120, targetSteer: 0, duration: 250, label: '直道行驶' },
  { targetSpeed: 100, targetSteer: -25, duration: 100, label: '左侧弯道' },
  { targetSpeed: 120, targetSteer: 0, duration: 350, label: '继续巡航' },
  { targetSpeed: 120, targetSteer: 15, duration: 80, label: '右侧微弯' },
  { targetSpeed: 120, targetSteer: 0, duration: 280, label: '长直道' },
  { targetSpeed: 120, targetSteer: -20, duration: 100, label: '左侧弯道' },
  { targetSpeed: 120, targetSteer: 0, duration: 200, label: '巡航行驶' },
  { targetSpeed: 80, targetSteer: 0, duration: 80, label: '准备出高速' },
  { targetSpeed: 40, targetSteer: 0, duration: 60, label: '匝道减速' },
  { targetSpeed: 0, targetSteer: 0, duration: 50, label: '到达停止' },
];

export class VehicleStateSimulator {
  private config: VehicleConfig;
  private state: VehicleState;
  private driving: boolean;
  private manualMode: boolean;
  private manualCtrl: UserControl;
  private speedTarget: number;
  private steerTarget: number;
  private trip: TripSegment[];
  private segmentIndex: number;
  private tickInSegment: number;
  private currentLabel: string;
  private blinkTimer: number;
  private blinkOn: boolean;
  private highRpmTicks = 0;
  private highSpeedTicks = 0;
  private prevThrottle = 0;
  private rapidThrottleChanges = 0;
  private tireLeakTimer = 0;

  constructor(config?: Partial<VehicleConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.driving = true;
    this.manualMode = false;
    this.manualCtrl = {
      throttle: 0,
      brake: false,
      steeringAngle: 0,
      gearPosition: 'P',
      turnSignal: 'none',
      manualMode: false,
    };
    this.speedTarget = 0;
    this.steerTarget = 0;
    this.trip = [...URBAN_TRIP];
    this.segmentIndex = 0;
    this.tickInSegment = 0;
    this.currentLabel = '怠速';
    this.blinkTimer = 0;
    this.blinkOn = false;
    this.state = this.createInitialState();
  }

  private createInitialState(): VehicleState {
    return {
      speed: 0,
      rpm: 800,
      coolantTemp: 30,
      batteryVoltage: 12.6,
      throttlePos: 0,
      brakePressed: false,
      steeringAngle: 0,
      odometer: 12345.6,
      fuelLevel: 75,
      gearPosition: 'P',
      turnSignal: 'none',
      doorStatus: { frontLeft: false, frontRight: false, rearLeft: false, rearRight: false },
      tirePressure: { frontLeft: 2.4, frontRight: 2.4, rearLeft: 2.3, rearRight: 2.3 },
      faultCodes: [],
      timestamp: Date.now(),
    };
  }

  applyControls(ctrl: UserControl) {
    this.manualCtrl = { ...ctrl };
    this.manualMode = ctrl.manualMode;
  }

  private advanceSegment() {
    this.segmentIndex = (this.segmentIndex + 1) % this.trip.length;
    this.tickInSegment = 0;
    if (this.segmentIndex === 0) {
      this.trip = this.trip === URBAN_TRIP ? [...HIGHWAY_TRIP] : [...URBAN_TRIP];
    }
    const seg = this.trip[this.segmentIndex];
    this.speedTarget = seg.targetSpeed;
    this.steerTarget = seg.targetSteer;
    this.currentLabel = seg.label;
  }

  private updateTurnSignal() {
    const steer = this.state.steeringAngle;
    if (Math.abs(steer) > 15) {
      this.state.turnSignal = steer > 0 ? 'right' : 'left';
    } else if (Math.abs(steer) < 3) {
      this.state.turnSignal = 'none';
    }
    this.blinkTimer++;
    if (this.blinkTimer > 10) {
      this.blinkTimer = 0;
      this.blinkOn = !this.blinkOn;
    }
    if (this.state.turnSignal !== 'none' && !this.blinkOn) {
      this.state.turnSignal = 'none';
    }
  }

  private selectGear(): string {
    const s = this.state.speed;
    const throttle = this.state.throttlePos;
    if (s < 1) return 'N';
    if (s < 20) return throttle > 30 ? '1' : '2';
    if (s < 40) return '2';
    if (s < 60) return '3';
    if (s < 90) return '4';
    return '5';
  }

  private updateDoors() {
    if (this.state.speed > 5) {
      this.state.doorStatus.frontLeft = false;
      this.state.doorStatus.frontRight = false;
      this.state.doorStatus.rearLeft = false;
      this.state.doorStatus.rearRight = false;
    } else if (Math.random() < 0.0008) {
      const doors = ['frontLeft', 'frontRight', 'rearLeft', 'rearRight'] as const;
      this.state.doorStatus[doors[Math.floor(Math.random() * doors.length)]] = true;
    }
  }

  private injectFault(code: number) {
    if (!this.state.faultCodes.includes(code)) {
      this.state.faultCodes.push(code);
    }
  }

  private clearFault(code: number) {
    this.state.faultCodes = this.state.faultCodes.filter((c) => c !== code);
  }

  private simulateFaults() {
    if (!this.driving) return;

    if (this.state.rpm > 6000) {
      this.highRpmTicks++;
      if (this.highRpmTicks > 120) this.injectFault(101);
    } else {
      this.highRpmTicks = Math.max(0, this.highRpmTicks - 3);
      if (this.state.rpm < 3000 && this.state.coolantTemp < 75) this.clearFault(101);
    }

    if (this.state.speed > 100) {
      this.highSpeedTicks++;
      if (this.highSpeedTicks > 250) this.injectFault(420);
    } else {
      this.highSpeedTicks = Math.max(0, this.highSpeedTicks - 2);
      if (this.state.speed < 60) this.clearFault(420);
    }

    const dThrottle = Math.abs(this.state.throttlePos - this.prevThrottle);
    if (dThrottle > 35 && this.state.fuelLevel < 25) {
      this.rapidThrottleChanges++;
      if (this.rapidThrottleChanges > 5) this.injectFault(300);
    } else {
      this.rapidThrottleChanges = Math.max(0, this.rapidThrottleChanges - 1);
      if (dThrottle < 10) this.clearFault(300);
    }
    this.prevThrottle = this.state.throttlePos;

    if (this.state.speed > 10 && this.state.rpm < 1000 && this.state.throttlePos > 40) {
      this.injectFault(301);
    } else {
      this.clearFault(301);
    }

    if (this.state.coolantTemp > 80 && Math.random() < 0.0008) {
      this.injectFault(102);
    } else if (this.state.coolantTemp < 70) {
      this.clearFault(102);
    }

    if (
      this.state.speed > 0 &&
      this.state.rpm < 2500 &&
      this.state.coolantTemp < 70 &&
      Math.random() < 0.003
    ) {
      this.clearFault(501);
    }
  }

  private simulateTirePressure() {
    if (this.state.speed > 5) {
      this.tireLeakTimer++;
      if (this.tireLeakTimer > 200 && Math.random() < 0.0001) {
        const tires: (keyof typeof this.state.tirePressure)[] = [
          'frontLeft',
          'frontRight',
          'rearLeft',
          'rearRight',
        ];
        const tire = tires[Math.floor(Math.random() * tires.length)];
        this.state.tirePressure[tire] = Math.max(1.5, this.state.tirePressure[tire] - 0.05);
      }
    } else {
      this.tireLeakTimer = 0;
    }
  }

  private applyManualPhysics() {
    const { throttle, brake, steeringAngle, gearPosition, turnSignal } = this.manualCtrl;

    const accelForce = (throttle / 100) * 0.8;
    const brakeForce = brake ? 2.5 : 0;
    const dragForce = this.state.speed * 0.015;
    const netAccel = accelForce - brakeForce - dragForce;

    this.state.speed = Math.max(0, this.state.speed + netAccel);
    if (this.state.speed > this.config.maxSpeed) {
      this.state.speed = this.config.maxSpeed;
    }

    this.state.steeringAngle += (steeringAngle - this.state.steeringAngle) * 0.08;
    this.state.steeringAngle = Math.max(-45, Math.min(45, this.state.steeringAngle));

    this.state.throttlePos = throttle;
    this.state.brakePressed = brake;

    const speedRatio = this.state.speed / this.config.maxSpeed;
    this.state.rpm =
      this.state.speed < 1
        ? 750 + Math.random() * 100
        : 1000 + speedRatio * 5500 + (Math.random() * 200 - 100);
    this.state.rpm = Math.max(600, Math.min(this.config.maxRpm, this.state.rpm));

    this.state.gearPosition = gearPosition === 'D' ? this.selectGear() : gearPosition;
    this.state.turnSignal = turnSignal;

    if (this.state.speed > 0.5) {
      this.state.odometer += (this.state.speed / 3600) * 0.05;
    }
  }

  private applyAutonomousTrip() {
    const seg = this.trip[this.segmentIndex];
    const targetSpeed = seg.targetSpeed;

    this.state.speed += (targetSpeed - this.state.speed) * 0.04 + (Math.random() * 0.5 - 0.25);
    this.state.speed = Math.max(0, this.state.speed);

    const targetSteer = seg.targetSteer + (Math.random() * 2 - 1);
    this.state.steeringAngle += (targetSteer - this.state.steeringAngle) * 0.06;
    this.state.steeringAngle = Math.max(-45, Math.min(45, this.state.steeringAngle));

    const speedRatio = this.state.speed / this.config.maxSpeed;
    this.state.rpm =
      this.state.speed < 1
        ? 750 + Math.random() * 100
        : 1000 + speedRatio * 5500 + (Math.random() * 200 - 100);
    this.state.rpm = Math.max(600, Math.min(this.config.maxRpm, this.state.rpm));

    this.state.throttlePos =
      this.state.speed < targetSpeed - 2
        ? Math.min(90, 15 + (targetSpeed - this.state.speed) * 2 + Math.random() * 3)
        : Math.max(0, 5 + (targetSpeed - this.state.speed) * 1.5 + Math.random() * 2);
    this.state.throttlePos = Math.max(0, Math.min(100, this.state.throttlePos));
    this.state.brakePressed = this.state.speed > targetSpeed + 3 && this.state.speed > 2;

    if (this.state.speed > 0.5) {
      this.state.odometer += (this.state.speed / 3600) * 0.05;
    }

    this.state.gearPosition = this.selectGear();
    this.updateTurnSignal();

    this.tickInSegment++;
    if (this.tickInSegment >= seg.duration) {
      this.advanceSegment();
    }
  }

  private coastToStop() {
    this.state.speed = Math.max(0, this.state.speed - 1.5);
    this.state.rpm = Math.max(600, this.state.rpm - 50);
    this.state.throttlePos = Math.max(0, this.state.throttlePos - 2);
    this.state.brakePressed = this.state.speed > 0.5;
    this.state.steeringAngle *= 0.95;
    this.state.gearPosition = this.state.speed < 1 ? 'N' : this.state.gearPosition;
    this.state.turnSignal = 'none';
  }

  private updateCommon() {
    this.state.coolantTemp = Math.min(
      88,
      this.state.coolantTemp + 0.12 + (this.state.rpm / 8000) * 0.08,
    );
    this.state.coolantTemp += Math.random() * 0.2 - 0.1;
    this.state.batteryVoltage = 12.6 + (Math.random() * 0.4 - 0.2);
    if (this.state.rpm > 3000) this.state.batteryVoltage += 0.3;

    const burn =
      this.state.rpm > 800
        ? (this.state.rpm / 8000) * 0.003 * (this.state.throttlePos / 50 + 0.5)
        : 0;
    this.state.fuelLevel = Math.max(0, this.state.fuelLevel - burn);

    this.updateDoors();
    this.simulateTirePressure();
    this.simulateFaults();
  }

  tick(): VehicleState {
    if (!this.driving) {
      this.coastToStop();
    } else if (this.manualMode) {
      this.applyManualPhysics();
    } else {
      this.applyAutonomousTrip();
    }

    this.updateCommon();
    this.state.timestamp = Date.now();
    return { ...this.state };
  }

  getState(): VehicleState {
    return { ...this.state };
  }

  getCurrentLabel(): string {
    return this.currentLabel;
  }

  toggleDriving() {
    this.driving = !this.driving;
  }

  reset() {
    this.state = this.createInitialState();
    this.speedTarget = 0;
    this.steerTarget = 0;
    this.manualMode = false;
    this.trip = [...URBAN_TRIP];
    this.segmentIndex = 0;
    this.tickInSegment = 0;
    this.currentLabel = '怠速';
  }

  setConfig(config: Partial<VehicleConfig>) {
    this.config = { ...this.config, ...config };
  }
}

export const P0101 = 101;
export const P0300 = 300;
export const P0420 = 420;
