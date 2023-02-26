export interface Socket
{
  ws: WebSocket | null = null;
  sendMessage(): Uint8Array;
};
