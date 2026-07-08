import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { VehicleStateSimulator } from '@vehicle-visual/can-simulator';
import type { VehicleState } from '@vehicle-visual/can-simulator';
import { Subject, interval } from 'rxjs';
import { FaultService } from '../fault/fault.service';
import { RecordService } from '../record/record.service';

@Injectable()
export class CanBusService implements OnModuleInit {
  private readonly logger = new Logger(CanBusService.name);
  private simulator: VehicleStateSimulator;
  private vehicleData$ = new Subject<VehicleState>();
  private history: VehicleState[] = [];
  private readonly maxHistory = 36000;
  private prevFaults: Set<number> = new Set();

  constructor(
    private readonly faultService: FaultService,
    private readonly recordService: RecordService,
  ) {
    this.simulator = new VehicleStateSimulator();
  }

  onModuleInit() {
    interval(50).subscribe(() => {
      const state = this.simulator.tick();

      const currentFaults = new Set(state.faultCodes);
      for (const code of currentFaults) {
        if (!this.prevFaults.has(code)) {
          this.faultService.addFault(code);
        }
      }
      for (const code of this.prevFaults) {
        if (!currentFaults.has(code)) {
          this.faultService.clearFault(code);
        }
      }
      this.prevFaults = currentFaults;

      this.recordService.addSample(state);
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

  applyControls(control: import('@vehicle-visual/can-simulator').UserControl) {
    this.simulator.applyControls(control);
  }

  reset() {
    this.simulator.reset();
  }
}
