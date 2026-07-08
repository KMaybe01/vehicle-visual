import { FoxgloveServer } from '@foxglove/ws-protocol';
import { McapWriter } from '@mcap/core';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { VehicleState } from '@vehicle-visual/can-simulator';
import { WebSocketServer } from 'ws';
import { CanBusService } from '../can-bus/can-bus.service';

const STATE_SCHEMA = JSON.stringify({
  type: 'object',
  properties: {
    speed: { type: 'number' },
    rpm: { type: 'number' },
    coolantTemp: { type: 'number' },
    batteryVoltage: { type: 'number' },
    throttlePos: { type: 'number' },
    brakePressed: { type: 'boolean' },
    steeringAngle: { type: 'number' },
    odometer: { type: 'number' },
    fuelLevel: { type: 'number' },
    gearPosition: { type: 'string' },
    turnSignal: { type: 'string', enum: ['none', 'left', 'right', 'hazard'] },
    timestamp: { type: 'number' },
  },
});

const FOXGLOVE_PORT = 3101;

@Injectable()
export class FoxgloveService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FoxgloveService.name);
  private server!: FoxgloveServer;
  private wss!: WebSocketServer;
  private vehicleChannelId!: number;

  constructor(private readonly canBusService: CanBusService) {}

  onModuleInit() {
    this.startFoxgloveServer();
    this.subscribeToVehicleData();
  }

  onModuleDestroy() {
    this.wss?.close();
  }

  private startFoxgloveServer() {
    this.server = new FoxgloveServer({
      name: 'vehicle-visual',
      capabilities: [],
      supportedEncodings: ['json'],
      sessionId: crypto.randomUUID(),
    });

    this.vehicleChannelId = this.server.addChannel({
      topic: '/vehicle/state',
      encoding: 'json',
      schemaName: 'VehicleState',
      schema: STATE_SCHEMA,
    });

    this.wss = new WebSocketServer({ port: FOXGLOVE_PORT });
    this.wss.on('connection', (ws, req) => {
      const name = `${req.socket.remoteAddress ?? 'unknown'}`;
      this.server.handleConnection(ws, name);
      this.logger.log(`Foxglove client connected: ${name}`);
    });

    this.logger.log(`Foxglove WebSocket server started on ws://localhost:${FOXGLOVE_PORT}`);
  }

  private subscribeToVehicleData() {
    this.canBusService.dataStream.subscribe((state) => {
      const payload = new TextEncoder().encode(JSON.stringify(state));
      this.server.sendMessage(this.vehicleChannelId, BigInt(state.timestamp) * 1_000_000n, payload);
    });
  }

  async exportToMcap(samples: VehicleState[]): Promise<Uint8Array> {
    const chunks: Uint8Array[] = [];
    let pos = 0n;
    const writable = {
      write: async (buffer: Uint8Array) => {
        chunks.push(buffer);
        pos += BigInt(buffer.byteLength);
      },
      position: () => pos,
    };

    const writer = new McapWriter({
      writable,
      useChunks: false,
      useMessageIndex: false,
      useStatistics: false,
      useSummaryOffsets: false,
      repeatSchemas: false,
      repeatChannels: false,
    });

    await writer.start({ profile: '', library: 'vehicle-visual' });

    const schemaId = await writer.registerSchema({
      name: 'VehicleState',
      encoding: 'jsonschema',
      data: new TextEncoder().encode(STATE_SCHEMA),
    });

    const channelId = await writer.registerChannel({
      schemaId,
      topic: '/vehicle/state',
      messageEncoding: 'json',
      metadata: new Map(),
    });

    for (let i = 0; i < samples.length; i++) {
      const state = samples[i];
      await writer.addMessage({
        channelId,
        sequence: i,
        logTime: BigInt(state.timestamp) * 1_000_000n,
        publishTime: BigInt(state.timestamp) * 1_000_000n,
        data: new TextEncoder().encode(JSON.stringify(state)),
      });
    }

    await writer.end();

    const totalLength = chunks.reduce((acc, c) => acc + c.byteLength, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const c of chunks) {
      result.set(c, offset);
      offset += c.byteLength;
    }
    return result;
  }
}
