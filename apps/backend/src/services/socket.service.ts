import { Server, Socket } from 'socket.io';

export class SocketService {
  private io: Server | null = null;
  private vendorRooms = new Map<string, Set<string>>();

  /**
   * Initialize Socket.IO server
   * @param httpServer - HTTP server instance
   * @param corsOrigin - CORS origin for frontend
   */
  initialize(httpServer: any, corsOrigin: string = '*') {
    if (this.io) {
      return; // Already initialized
    }

    this.io = new Server(httpServer, {
      cors: {
        origin: corsOrigin,
        methods: ['GET', 'POST'],
      },
    });

    this.setupEventHandlers();
    console.log('Socket.IO server initialized');
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      console.log('Client connected:', socket.id);

      // Join vendor room
      socket.on('join_vendor_room', (vendorId: string) => {
        socket.join(`vendor:${vendorId}`);
        
        if (!this.vendorRooms.has(vendorId)) {
          this.vendorRooms.set(vendorId, new Set());
        }
        this.vendorRooms.get(vendorId)!.add(socket.id);
        
        console.log(`Socket ${socket.id} joined vendor room: ${vendorId}`);
      });

      // Leave vendor room
      socket.on('leave_vendor_room', (vendorId: string) => {
        socket.leave(`vendor:${vendorId}`);
        
        const room = this.vendorRooms.get(vendorId);
        if (room) {
          room.delete(socket.id);
          if (room.size === 0) {
            this.vendorRooms.delete(vendorId);
          }
        }
        
        console.log(`Socket ${socket.id} left vendor room: ${vendorId}`);
      });

      // Operator status updates
      socket.on('operator_status', (data: { vendorId: string; operatorId: string; status: 'online' | 'offline' }) => {
        this.emitToVendor(data.vendorId, 'operator_status_changed', {
          operatorId: data.operatorId,
          status: data.status,
        });
      });

      // Typing indicator
      socket.on('typing', (data: { vendorId: string; sessionId: string; isTyping: boolean }) => {
        this.emitToVendor(data.vendorId, 'typing_indicator', {
          sessionId: data.sessionId,
          isTyping: data.isTyping,
        });
      });

      // Disconnect
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        
        // Clean up vendor rooms
        this.vendorRooms.forEach((sockets, vendorId) => {
          if (sockets.has(socket.id)) {
            sockets.delete(socket.id);
            if (sockets.size === 0) {
              this.vendorRooms.delete(vendorId);
            }
          }
        });
      });
    });
  }

  /**
   * Emit event to all clients in a vendor's room
   * @param vendorId - Vendor ID
   * @param event - Event name
   * @param data - Event data
   */
  emitToVendor(vendorId: string, event: string, data: any) {
    if (!this.io) return;
    
    this.io.to(`vendor:${vendorId}`).emit(event, data);
  }

  /**
   * Emit message received event
   * @param vendorId - Vendor ID
   * @param sessionId - Session ID
   * @param message - Message data
   */
  emitMessageReceived(vendorId: string, sessionId: string, message: any) {
    this.emitToVendor(vendorId, 'message_received', {
      sessionId,
      message,
      timestamp: new Date(),
    });
  }

  /**
   * Emit message sent event
   * @param vendorId - Vendor ID
   * @param sessionId - Session ID
   * @param message - Message data
   */
  emitMessageSent(vendorId: string, sessionId: string, message: any) {
    this.emitToVendor(vendorId, 'message_sent', {
      sessionId,
      message,
      timestamp: new Date(),
    });
  }

  /**
   * Emit conversation assigned event
   * @param vendorId - Vendor ID
   * @param sessionId - Session ID
   * @param operatorId - Operator ID
   */
  emitConversationAssigned(vendorId: string, sessionId: string, operatorId: string) {
    this.emitToVendor(vendorId, 'conversation_assigned', {
      sessionId,
      operatorId,
      timestamp: new Date(),
    });
  }

  /**
   * Emit operator joined event
   * @param vendorId - Vendor ID
   * @param sessionId - Session ID
   * @param operatorId - Operator ID
   */
  emitOperatorJoined(vendorId: string, sessionId: string, operatorId: string) {
    this.emitToVendor(vendorId, 'operator_joined', {
      sessionId,
      operatorId,
      timestamp: new Date(),
    });
  }

  /**
   * Emit operator left event
   * @param vendorId - Vendor ID
   * @param sessionId - Session ID
   * @param operatorId - Operator ID
   */
  emitOperatorLeft(vendorId: string, sessionId: string, operatorId: string) {
    this.emitToVendor(vendorId, 'operator_left', {
      sessionId,
      operatorId,
      timestamp: new Date(),
    });
  }

  /**
   * Emit conversation closed event
   * @param vendorId - Vendor ID
   * @param sessionId - Session ID
   */
  emitConversationClosed(vendorId: string, sessionId: string) {
    this.emitToVendor(vendorId, 'conversation_closed', {
      sessionId,
      timestamp: new Date(),
    });
  }

  /**
   * Emit bot resumed event
   * @param vendorId - Vendor ID
   * @param sessionId - Session ID
   */
  emitBotResumed(vendorId: string, sessionId: string) {
    this.emitToVendor(vendorId, 'bot_resumed', {
      sessionId,
      timestamp: new Date(),
    });
  }

  /**
   * Emit session state changed event
   * @param vendorId - Vendor ID
   * @param sessionId - Session ID
   * @param newState - New conversation state
   */
  emitSessionStateChanged(vendorId: string, sessionId: string, newState: string) {
    this.emitToVendor(vendorId, 'session_state_changed', {
      sessionId,
      newState,
      timestamp: new Date(),
    });
  }

  /**
   * Get number of connected clients for a vendor
   * @param vendorId - Vendor ID
   * @returns Number of connected clients
   */
  getVendorConnectedClients(vendorId: string): number {
    return this.vendorRooms.get(vendorId)?.size || 0;
  }

  /**
   * Get Socket.IO server instance
   * @returns Socket.IO server instance
   */
  getIO(): Server | null {
    return this.io;
  }
}

export default new SocketService();
