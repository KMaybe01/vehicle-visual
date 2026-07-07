import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { VehicleStateSimulator } from '@vehicle-visual/can-simulator';
import type { VehicleState } from '@vehicle-visual/can-simulator';
import { Subject, interval } from 'rxjs';

@Injectable()
export class CanBusService implements OnModuleInit {
  private readonly logger = new Logger(CanBusService.name);
  private simulator: VehicleStateSimulator;
  private vehicleData$ = new Subject<VehicleState>();
  private history: VehicleState[] = [];
  private readonly maxHistory = 36000;

  constructor() {
    this.simulator = new VehicleStateSimulator();
  }

  onModuleInit() {
    interval(50).subscribe(() => {
      const state = this.simulator.tick();
      this.vehicleData$.next(state);
      this.history.push(state);
      if (this.history.length > this.maxHistory) {
        this.history = this.history.slice(-this.maxHistory);
      }
    });
    this.logger.log('CAN simulator started, pushing data every 50ms');
  }

  get dataStream() {
    return this.vehicleData$.asObservable();
  }

  getCurrentState(): VehicleState {
    return this.simulator.getState();
  }

  getHistory(durationMs: number = 60000): VehicleState[] {
    const cutoff = Date.now() - durationMs;
    return this.history.filter((s) => s.timestamp >= cutoff);
  }

  toggleDriving() {
    this.simulator.toggleDriving();
  }

  reset() {
    this.simulator.reset();
  }
}
