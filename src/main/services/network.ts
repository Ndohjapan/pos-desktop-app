import { networkInterfaces, hostname } from 'os'

// A stable identity so tills can filter discovery to *our* app only and never
// try to connect to random printers/routers that also advertise _http._tcp.
export const SERVICE_APP_ID = 'amala-oluyole-pos'
export const SERVICE_NAME = `Amala POS (${hostname()})`

// Best LAN IPv4 for this machine — what other tills should connect to.
// Prefers common private ranges and skips loopback/virtual interfaces.
export function getLanIp(): string {
  const interfaces = networkInterfaces()
  const candidates: string[] = []

  for (const name of Object.keys(interfaces)) {
    // Skip obvious virtual adapters (VPN, docker, vbox, etc.)
    if (/^(vEthernet|VMware|VirtualBox|vboxnet|docker|utun|awdl|llw|bridge)/i.test(name)) {
      continue
    }
    for (const net of interfaces[name] ?? []) {
      if (net.family === 'IPv4' && !net.internal) {
        candidates.push(net.address)
      }
    }
  }

  // Prefer typical home/office LAN ranges
  const preferred = candidates.find(
    (ip) =>
      ip.startsWith('192.168.') || ip.startsWith('10.') || /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
  )

  return preferred ?? candidates[0] ?? '127.0.0.1'
}
