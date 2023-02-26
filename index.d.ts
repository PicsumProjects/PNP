export interface Socket
{
  constructor(url: string);
  ws: WebSocket | null = null;
  async sendAndWait(data: Uint8Array): Promise<Uint8Array>;
};
