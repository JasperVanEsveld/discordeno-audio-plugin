import { ConnectionData } from "../connection-data.ts";

export async function discoverIP(
  conn: ConnectionData,
  ssrc: string,
  hostname: string,
  port: number
) {
  const discover = createDiscoverPacket(ssrc);
  await conn.udpSocket.send(discover, {
    hostname,
    port,
    transport: "udp",
  });
  const response = new Promise<Uint8Array>((resolve) => conn.onUDP(resolve));
  const value = await response;
  const decoder = new TextDecoder();
  const localIp = decoder.decode(value.slice(8, value.indexOf(0, 8)));
  const localPort = new DataView(value.buffer).getUint16(72, false);
  return { ip: localIp, port: localPort };
}

function createDiscoverPacket(ssrc: string): Uint8Array {
  const buffer = new ArrayBuffer(74);
  const header_data = new DataView(buffer);
  let offset = 0;
  header_data.setInt16(offset, 1, false);
  offset += 2;
  header_data.setInt16(offset, 70, false);
  offset += 2;
  header_data.setInt32(offset, Number.parseInt(ssrc), false);
  return new Uint8Array(buffer);
}
