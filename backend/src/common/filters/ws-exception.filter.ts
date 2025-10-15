import { ArgumentsHost, Catch, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch(WsException)
export class WsExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: WsException, host: ArgumentsHost) {
    // Extract the raw socket.io client
    const client = host.switchToWs().getClient<Socket>();
    const error = exception.getError();

    // Extract error message with proper fallback
    const errorMessage = this.extractErrorMessage(error);

    // Log the error
    this.logger.error(
      `Client ID: ${client.id} - WebSocket error: ${errorMessage}`,
    );

    // Emit error to client
    client.emit('exception', {
      status: 'WS_ERROR',
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }

  private extractErrorMessage(error: string | object): string {
    if (typeof error === 'string') {
      return error;
    }

    if (typeof error === 'object' && error !== null) {
      if ('message' in error && typeof error.message === 'string') {
        return error.message;
      }
    }

    return 'An unhandled WebSocket error occurred';
  }
}
