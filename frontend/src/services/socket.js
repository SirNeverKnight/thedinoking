export class GameSocketService {
  constructor() {
    this.ws = null;
    this.onMessageCallbacks = [];
    this.onCloseCallbacks = [];
    this.onOpenCallbacks = [];
  }

  connect(roomCode, playerId) {
    if (this.ws) {
      this.disconnect();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/${roomCode}/${playerId}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('[Socket] Connected to room:', roomCode);
      this.onOpenCallbacks.forEach(cb => cb());
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.onMessageCallbacks.forEach(cb => cb(data));
      } catch (err) {
        console.error('[Socket] Failed to parse message:', err);
      }
    };

    this.ws.onclose = (event) => {
      console.log('[Socket] Disconnected:', event.reason);
      this.onCloseCallbacks.forEach(cb => cb(event));
    };

    this.ws.onerror = (err) => {
      console.error('[Socket] Error:', err);
    };
  }

  sendJump() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(["JUMP"]));
    }
  }

  sendStartGame() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(["START_GAME"]));
    }
  }

  onMessage(callback) {
    this.onMessageCallbacks.push(callback);
  }

  onOpen(callback) {
    this.onOpenCallbacks.push(callback);
  }

  onClose(callback) {
    this.onCloseCallbacks.push(callback);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.onMessageCallbacks = [];
    this.onCloseCallbacks = [];
    this.onOpenCallbacks = [];
  }
}

export const socketService = new GameSocketService();
