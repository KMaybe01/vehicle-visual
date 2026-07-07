import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CanBusService } from './can-bus.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/vehicle',
})
export class CanBusGateway implements OnGatewayInit, OnGatewayConnection {
  private readonly logger = new Logger(CanBusGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly canBusService: CanBusService) {}

  afterInit() {
    this.canBusService.dataStream.subscribe((state) => {
      this.server.emit('vehicleData', state);
    });
    this.logger.log('WebSocket gateway initialized, broadcasting vehicle data');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    const current = this.canBusService.getCurrentState();
    client.emit('vehicleData', current);
  }

  @SubscribeMessage('getHistory')
  handleGetHistory(client: Socket, durationMs: number) {
    const history = this.canBusService.getHistory(durationMs);
    client.emit('historyData', history);
  }

  @SubscribeMessage('toggleDriving')
  handleToggleDriving() {
    this.canBusService.toggleDriving();
  }

  @SubscribeMessage('reset')
  handleReset() {
    this.canBusService.reset();
  }
}
