export interface Socket
{
  ws: WebSocket | null = null;
  async sendAndWait(data: Uint8Array): Promise<Uint8Array>;
};
