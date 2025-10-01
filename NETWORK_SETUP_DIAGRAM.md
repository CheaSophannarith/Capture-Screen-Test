# 🌐 Network Setup Diagrams

## Scenario 1: Both PCs on Same WiFi (Recommended First Test)

```
┌─────────────────────────────────────────────────────────────┐
│                        WiFi Router                          │
│                      (192.168.1.1)                          │
└─────────────────────────────────────────────────────────────┘
         │                                 │
         │                                 │
         ▼                                 ▼
┌──────────────────────┐         ┌──────────────────────┐
│       PC 1           │         │       PC 2           │
│  (192.168.1.100)     │         │  (192.168.1.101)     │
│                      │         │                      │
│  ┌────────────────┐  │         │  ┌────────────────┐  │
│  │   Signaling    │  │         │  │                │  │
│  │    Server      │  │         │  │   Receiver     │  │
│  │  (Port 3000)   │  │         │  │                │  │
│  └────────────────┘  │         │  └────────────────┘  │
│         ▲            │         │         │            │
│         │            │         │         │            │
│         │            │         │         ▼            │
│  ┌──────┴─────────┐  │         │  Connects to:       │
│  │                │  │         │  192.168.1.100:3000 │
│  │    Sender      │  │         │                      │
│  │  (Captures     │  │         │  Displays video     │
│  │   screen)      │  │         │                      │
│  └────────────────┘  │         │                      │
└──────────────────────┘         └──────────────────────┘
         │                                 │
         │                                 │
         └─────────────────┬───────────────┘
                           │
                    WebRTC P2P Video
                  (Direct connection)
```

### Configuration:
```javascript
// src/config/webrtc.js (on BOTH PCs)
export const signalingServerUrl = 'http://192.168.1.100:3000'
//                                        ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
//                                        PC 1's local IP
```

### Traffic Flow:
1. **Signaling (via server):** PC 1 ↔ Server ↔ PC 2
2. **Video (direct P2P):** PC 1 ↔ WiFi Router ↔ PC 2

---

## Scenario 2: PCs on Different Networks (Using ngrok)

```
┌───────────────────────────────────────────────────────────────┐
│                        INTERNET                               │
└───────────────────────────────────────────────────────────────┘
                              │
                              │
                    ┌─────────▼─────────┐
                    │   ngrok Cloud     │
                    │ (Tunnel Service)  │
                    │                   │
                    │ https://abc123    │
                    │ .ngrok-free.app   │
                    └─────────┬─────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PC 1's Home Network                            │
│                      WiFi Router 1                               │
│                     (203.0.113.5)                                │
│                                                                  │
│                              │                                   │
│                              ▼                                   │
│                    ┌──────────────────┐                          │
│                    │      PC 1        │                          │
│                    │ (192.168.1.100)  │                          │
│                    │                  │                          │
│                    │  ┌────────────┐  │                          │
│                    │  │ Signaling  │  │                          │
│                    │  │   Server   │  │                          │
│                    │  │ :3000 ◄────┼──┼─ ngrok tunnel            │
│                    │  └────────────┘  │                          │
│                    │                  │                          │
│                    │  ┌────────────┐  │                          │
│                    │  │   Sender   │  │                          │
│                    │  └────────────┘  │                          │
│                    └──────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘

                              ▲
                              │ WebSocket
                              │
                              │
┌─────────────────────────────┼───────────────────────────────────┐
│                   PC 2's Office Network                          │
│                      WiFi Router 2                               │
│                     (198.51.100.7)                               │
│                                                                  │
│                              │                                   │
│                              ▼                                   │
│                    ┌──────────────────┐                          │
│                    │      PC 2        │                          │
│                    │ (10.0.0.50)      │                          │
│                    │                  │                          │
│                    │  ┌────────────┐  │                          │
│                    │  │  Receiver  │  │                          │
│                    │  │            │  │                          │
│                    │  │ Connects:  │  │                          │
│                    │  │ https://   │  │                          │
│                    │  │ abc123     │  │                          │
│                    │  │ .ngrok...  │  │                          │
│                    │  └────────────┘  │                          │
│                    └──────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
         │                                           │
         │                                           │
         └───────────► INTERNET ◄────────────────────┘
                           │
                    WebRTC P2P Video
               (Via STUN/TURN servers)
```

### Configuration:
```javascript
// src/config/webrtc.js (on BOTH PCs)
export const signalingServerUrl = 'https://abc123.ngrok-free.app'
//                                        ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
//                                        ngrok public URL
```

### Traffic Flow:
1. **Signaling:** Both PCs → ngrok → PC 1's server
2. **Video:** PC 1 ↔ Internet (via STUN) ↔ PC 2

---

## Scenario 3: Cloud-Deployed Signaling Server

```
┌───────────────────────────────────────────────────────────────┐
│                        INTERNET                               │
└───────────────────────────────────────────────────────────────┘
                              │
                              │
                    ┌─────────▼─────────┐
                    │   Cloud Server    │
                    │  (Render/Railway) │
                    │                   │
                    │   Signaling       │
                    │   Server          │
                    │   (Port 443)      │
                    │                   │
                    │ https://your-app  │
                    │ .onrender.com     │
                    └─────────┬─────────┘
                              │
                 ┌────────────┴────────────┐
                 │                         │
                 ▼                         ▼
┌──────────────────────┐         ┌──────────────────────┐
│       PC 1           │         │       PC 2           │
│   (Home Network)     │         │  (Office Network)    │
│                      │         │                      │
│  ┌────────────────┐  │         │  ┌────────────────┐  │
│  │    Sender      │  │         │  │   Receiver     │  │
│  │                │  │         │  │                │  │
│  │  Connects to:  │  │         │  │  Connects to:  │  │
│  │  https://      │  │         │  │  https://      │  │
│  │  your-app...   │  │         │  │  your-app...   │  │
│  └────────────────┘  │         │  └────────────────┘  │
└──────────────────────┘         └──────────────────────┘
         │                                 │
         │                                 │
         └─────────────────┬───────────────┘
                           │
                    WebRTC P2P Video
               (Via STUN/TURN servers)
```

### Configuration:
```javascript
// src/config/webrtc.js (on BOTH PCs)
export const signalingServerUrl = 'https://your-app.onrender.com'
```

### Advantages:
- ✅ No need to run server on PC 1
- ✅ Works from anywhere
- ✅ Permanent URL

---

## Port Usage Explained

```
┌─────────────────────────────────────────────────────────┐
│                    Port Usage                           │
└─────────────────────────────────────────────────────────┘

📡 Signaling Server: Port 3000 (TCP)
   ├─ Protocol: WebSocket (Socket.io)
   ├─ Direction: Bidirectional
   ├─ Traffic: SDP offers/answers, ICE candidates
   └─ Data Size: Very small (few KB)

🎥 WebRTC Video: Random Ports (UDP)
   ├─ Typical Range: 49152-65535
   ├─ Protocol: RTP/SRTP over UDP
   ├─ Direction: Bidirectional (P2P)
   ├─ Traffic: Video frames
   └─ Data Size: Large (1-10 Mbps for screen sharing)

🧊 STUN Server: Port 19302 (UDP)
   ├─ Protocol: STUN
   ├─ Direction: Query/Response
   ├─ Traffic: IP discovery requests
   └─ Data Size: Tiny (few bytes)
```

---

## Firewall Configuration

### What to Allow:

```
┌────────────────────────────────────────────────────────┐
│                PC 1 (Signaling Server)                 │
└────────────────────────────────────────────────────────┘

Inbound Rules:
  ✅ TCP Port 3000 (Signaling Server)
  ✅ UDP Ports 49152-65535 (WebRTC media)

Outbound Rules:
  ✅ All (default allow)


┌────────────────────────────────────────────────────────┐
│                PC 2 (Receiver)                         │
└────────────────────────────────────────────────────────┘

Inbound Rules:
  ✅ UDP Ports 49152-65535 (WebRTC media)

Outbound Rules:
  ✅ All (default allow)
```

### Quick Firewall Commands:

```bash
# PC 1: Allow signaling server port
netsh advfirewall firewall add rule name="WebRTC Signaling" dir=in action=allow protocol=TCP localport=3000

# Both PCs: Allow WebRTC media (if needed)
netsh advfirewall firewall add rule name="WebRTC Media" dir=in action=allow protocol=UDP localport=49152-65535

# OR: Disable firewall temporarily for testing
netsh advfirewall set allprofiles state off
```

---

## Network Connectivity Test

### Step-by-Step Verification:

```
1️⃣ Basic Network Test (PC 2 → PC 1)
   Command: ping 192.168.1.100
   ✅ Success: "Reply from 192.168.1.100"
   ❌ Failure: "Request timed out"

2️⃣ Port Connectivity Test (PC 2 → PC 1)
   Command: telnet 192.168.1.100 3000
   ✅ Success: Connected (blank screen)
   ❌ Failure: "Could not open connection"

3️⃣ HTTP Test (PC 2 → PC 1)
   Browser: http://192.168.1.100:3000/socket.io/
   ✅ Success: JSON response or HTML
   ❌ Failure: "This site can't be reached"

4️⃣ WebSocket Test
   Use: Browser DevTools → Network → WS tab
   ✅ Success: See WebSocket connection
   ❌ Failure: "Failed to connect to WebSocket"
```

---

## Traffic Flow Visualization

### Phase 1: Initial Connection (Via Signaling Server)

```
Sender                 Signaling Server               Receiver
  │                           │                          │
  ├─ [WS] register ──────────►│                          │
  │                           │◄──────── [WS] register ──┤
  │                           │                          │
  ├─ [WS] offer ─────────────►│                          │
  │                           ├─ [WS] offer ────────────►│
  │                           │                          │
  │                           │◄────── [WS] answer ──────┤
  │◄─ [WS] answer ────────────┤                          │
  │                           │                          │
  ├─ [WS] ICE ───────────────►│                          │
  │                           ├─ [WS] ICE ──────────────►│
  │                           │                          │

Legend:
[WS] = WebSocket (via signaling server)
TCP Port 3000
Small data (< 10 KB total)
```

### Phase 2: Direct P2P Connection (No Server)

```
Sender                                               Receiver
  │                                                     │
  │◄═══════════════════════════════════════════════════►│
  │                                                     │
  │              RTP/SRTP (Video frames)                │
  │              UDP Random ports                       │
  │              1-10 Mbps continuous                   │
  │                                                     │
  │         Signaling server NOT involved!              │
  │                                                     │

Legend:
═══ = Direct P2P connection
UDP (firewall must allow)
Large continuous traffic
```

---

## Bandwidth Requirements

```
┌────────────────────────────────────────────────────────┐
│                  Bandwidth Usage                       │
└────────────────────────────────────────────────────────┘

Signaling Server:
  Initial setup: ~10 KB
  Ongoing: ~1 KB/minute (heartbeat)
  Total: Negligible

WebRTC Video (P2P):
  1080p @ 30fps: 3-8 Mbps
  720p @ 30fps: 1-3 Mbps
  Lower quality: 500 Kbps - 1 Mbps

Network Requirements:
  Minimum: 2 Mbps up/down
  Recommended: 5+ Mbps up/down
  Optimal: 10+ Mbps up/down
```

---

## Connection States Timeline

```
Time →

0s    [Sender opens page]
      └─ Connects to signaling server
      └─ Registers as "sender"

2s    [Receiver opens page]
      └─ Connects to signaling server
      └─ Registers as "receiver"

5s    [Sender clicks "Share Screen"]
      └─ Captures screen
      └─ Creates RTCPeerConnection
      └─ Generates SDP offer

6s    [Offer sent via signaling]
      └─ Receiver receives offer

7s    [Receiver creates answer]
      └─ Answer sent via signaling

8s    [ICE candidate exchange begins]
      └─ Both sides send network paths

9s    [First ICE candidate succeeds]
      └─ Connection state: "connecting"

10s   [P2P connection established]
      └─ Connection state: "connected"
      └─ Video starts flowing

11s+  [Continuous video streaming]
      └─ Signaling server idle
      └─ All traffic is P2P
```

---

## Summary Table

| Scenario | Signaling Server Location | Config URL | Use Case |
|----------|-------------------------|------------|----------|
| Same WiFi | PC 1 (local) | `http://192.168.1.100:3000` | Testing, demo |
| Different Networks | PC 1 + ngrok | `https://abc.ngrok-free.app` | Remote demo |
| Production | Cloud (Render/Railway) | `https://your-app.onrender.com` | Production use |

---

## Quick Reference

**Find IP:**
```bash
ipconfig           # Windows
ifconfig           # Mac/Linux
```

**Test Connection:**
```bash
ping [IP]
telnet [IP] 3000
curl http://[IP]:3000/socket.io/
```

**Firewall:**
```bash
# Disable (temporary)
netsh advfirewall set allprofiles state off

# Enable
netsh advfirewall set allprofiles state on
```

**ngrok:**
```bash
ngrok http 3000
```

---

**Choose your scenario and follow the corresponding setup!**
