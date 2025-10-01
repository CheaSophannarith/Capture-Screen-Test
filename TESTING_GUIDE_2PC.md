# 🖥️ Testing WebRTC Screen Sharing Between 2 PCs

## Quick Start Guide

### **Scenario 1: Both PCs on Same WiFi (Recommended for First Test)**

This is the easiest way to test.

---

## 📋 **Step-by-Step Instructions**

### **Step 1: Prepare PC 1 (Signaling Server + Sender)**

#### **1.1 Find Your Local IP Address**

Open Command Prompt and run:
```bash
ipconfig
```

Look for your WiFi adapter's IPv4 Address:
```
Wireless LAN adapter Wi-Fi:
   IPv4 Address. . . . . . . . . . . : 192.168.1.100
                                       ^^^^^^^^^^^^^^
                                       This is your IP!
```

**Write this down!** You'll need it for Step 2.

Common IP ranges:
- `192.168.1.x` or `192.168.0.x` (most home routers)
- `10.0.0.x` (some routers)

---

#### **1.2 Update Configuration File**

On **PC 1**, edit `src/config/webrtc.js`:

Find line 39:
```javascript
export const signalingServerUrl = 'http://localhost:3000'
```

Change to:
```javascript
export const signalingServerUrl = 'http://192.168.1.100:3000'
//                                        ^^^^^^^^^^^^^^^^
//                                        Use YOUR IP from Step 1.1
```

**Save the file.**

---

#### **1.3 Allow Firewall (Windows)**

**Option A: Quick Test (Temporary)**
```bash
# Run Command Prompt as Administrator
netsh advfirewall set allprofiles state off
```
⚠️ **Don't forget to turn firewall back on after testing:**
```bash
netsh advfirewall set allprofiles state on
```

**Option B: Permanent Rule (Recommended)**
1. Press `Win + R` → type `wf.msc` → Enter
2. Click "Inbound Rules" → "New Rule..."
3. Select "Port" → Next
4. TCP, Specific port: `3000` → Next
5. Allow the connection → Next
6. Check all (Domain, Private, Public) → Next
7. Name: "WebRTC Signaling Server" → Finish

---

#### **1.4 Start Signaling Server**

Open Terminal in your project folder:
```bash
node server/singnaling-server.js
```

You should see:
```
🚀 Signaling server running on port 3000
```

**Leave this terminal running!**

---

#### **1.5 Start Electron App**

Open **another terminal**:
```bash
npm start
```

---

### **Step 2: Prepare PC 2 (Receiver)**

#### **2.1 Copy Project Files**

Transfer your entire project folder to PC 2:
- Via USB drive
- Via shared network folder
- Via Git (push from PC 1, pull on PC 2)

#### **2.2 Install Dependencies**

On PC 2, in project folder:
```bash
npm install
```

#### **2.3 Update Configuration**

On **PC 2**, edit `src/config/webrtc.js`:

Change line 39 to **PC 1's IP** (same as Step 1.2):
```javascript
export const signalingServerUrl = 'http://192.168.1.100:3000'
//                                        ^^^^^^^^^^^^^^^^
//                                        PC 1's IP address
```

**Save the file.**

#### **2.4 Start Electron App**

```bash
npm start
```

---

### **Step 3: Test Connection**

#### **On PC 1 (Sender):**

1. In the app, click **Airplay icon** (blue) in top-right
2. You should see: "Connected to signaling server"
3. Click **"Share Screen"** button
4. Select which screen or window to share
5. Status should show: "Screen sharing active"
6. Then: "Waiting for receiver to connect..." or "Connected! Streaming to receiver"

#### **On PC 2 (Receiver):**

1. In the app, click **Monitor icon** (green) in top-right
2. You should see: "Connected to signaling server. Waiting for sender..."
3. When PC 1 starts sharing, video appears automatically!
4. Status should show: "✅ Connected! Receiving screen share"

---

## 📊 **Expected Console Output**

### **PC 1 - Signaling Server Terminal:**

```
🚀 Signaling server running on port 3000
✅ New client connected: abc123def456
📝 Client abc123def456 registered as: sender
✅ New client connected: ghi789jkl012
📝 Client ghi789jkl012 registered as: receiver
👥 Total peers: 2
📤 Offer from abc123def456 → ghi789jkl012
📥 Answer from ghi789jkl012 → abc123def456
🧊 ICE candidate from abc123def456 → ghi789jkl012
🧊 ICE candidate from ghi789jkl012 → abc123def456
```

✅ If you see this, signaling is working perfectly!

### **PC 1 - Electron App Console (F12):**

```
✅ Registered with signaling server. My ID: abc123def456
🔗 Initializing WebRTC peer connection...
➕ Adding track to peer connection: video
📤 Sending offer to receiver: ghi789jkl012
🧊 Sending ICE candidate to receiver
📥 Received answer from receiver: ghi789jkl012
✅ Setting remote description (answer)
📡 Connection state: connected
```

### **PC 2 - Electron App Console (F12):**

```
✅ Connected to signaling server
✅ Registered as receiver. My ID: ghi789jkl012
📥 Received offer from sender: abc123def456
🔗 Setting up peer connection...
✅ Setting remote description (offer)
📤 Creating answer...
📤 Sending answer to sender: abc123def456
🧊 Sending ICE candidate to sender
📺 Received remote track: video
✅ Remote video stream connected
📡 Connection state: connected
```

---

## 🧪 **Quick Connection Test**

Before running the full app, test if PC 2 can reach PC 1's server:

**On PC 2, open browser and visit:**
```
http://192.168.1.100:3000/socket.io/
```
(Replace with PC 1's IP)

**You should see:**
- Some JSON/HTML response (good!)

**If you see:**
- "This site can't be reached" → Firewall blocking or wrong IP
- "Connection refused" → Server not running on PC 1

**Alternative test with Command Prompt:**
```bash
# On PC 2:
curl http://192.168.1.100:3000/socket.io/
```

---

## 🐛 **Troubleshooting**

### **Problem: "Failed to connect to signaling server"**

**On PC 2, check:**

1. **Is PC 1's signaling server running?**
   - Look at PC 1's terminal
   - Should see "🚀 Signaling server running on port 3000"

2. **Is the IP address correct?**
   - Run `ipconfig` on PC 1 again
   - Verify it matches the config file

3. **Can PC 2 ping PC 1?**
   ```bash
   # On PC 2:
   ping 192.168.1.100
   ```
   - Should get replies
   - If "Request timed out" → Network issue

4. **Is firewall blocking on PC 1?**
   - Temporarily disable firewall on PC 1
   - Try again

5. **Are both PCs on the same WiFi?**
   - Check WiFi network name on both
   - Must be identical

---

### **Problem: Connected to server but no video appears**

**Check in Browser Console (F12):**

**On PC 1 (Sender):**
- Do you see "📤 Sending offer to receiver"?
- Do you see "🧊 Sending ICE candidate"?
- What is "Connection state"?

**On PC 2 (Receiver):**
- Do you see "📥 Received offer from sender"?
- Do you see "📺 Received remote track: video"?
- Is there any error in red?

**Common causes:**

1. **ICE candidates not exchanging**
   - Check STUN server is reachable (Google's STUN)
   - Try adding more STUN servers in `src/config/webrtc.js`:
     ```javascript
     iceServers: [
       { urls: 'stun:stun.l.google.com:19302' },
       { urls: 'stun:stun1.l.google.com:19302' },
       { urls: 'stun:stun.services.mozilla.com' }
     ]
     ```

2. **Firewall blocking WebRTC**
   - WebRTC uses UDP ports
   - Try disabling firewall on **both PCs** temporarily

3. **Connection state shows "failed"**
   - This means P2P connection couldn't be established
   - You may need a TURN server (see below)

---

### **Problem: Works for 30 seconds then disconnects**

- This is usually a network stability issue
- Check WiFi signal strength on both PCs
- Try moving PCs closer to router
- Check if other devices are hogging bandwidth

---

## 🌐 **Testing Across Different Networks (Internet)**

If PCs are on different WiFi networks (different buildings, different cities), you need to expose the signaling server.

### **Method 1: Using ngrok (Easiest)**

**On PC 1:**

1. **Install ngrok:**
   - Download from https://ngrok.com/download
   - Extract and add to PATH

2. **Start signaling server:**
   ```bash
   node server/singnaling-server.js
   ```

3. **In another terminal, start ngrok:**
   ```bash
   ngrok http 3000
   ```

4. **Copy the HTTPS URL:**
   ```
   Forwarding    https://abc123.ngrok-free.app -> http://localhost:3000
                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                 Copy this URL!
   ```

5. **Update config on BOTH PCs:**

   Edit `src/config/webrtc.js` on both PC 1 and PC 2:
   ```javascript
   export const signalingServerUrl = 'https://abc123.ngrok-free.app'
   ```

6. **Start apps on both PCs and test!**

**Note:** Free ngrok URLs change every time you restart. For permanent URL, upgrade to ngrok paid plan or use Method 2.

---

### **Method 2: Cloud Deployment (Permanent)**

Deploy signaling server to a cloud service:

**Free options:**
- **Render.com** (free tier, sleeps after 15 min inactivity)
- **Railway.app** (free tier with limits)
- **Fly.io** (free tier)

**Steps for Render.com:**

1. Create account at https://render.com

2. Click "New +" → "Web Service"

3. Connect your GitHub repo

4. Configure:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

5. Click "Create Web Service"

6. Wait for deployment (2-3 minutes)

7. Copy your service URL (e.g., `https://your-app.onrender.com`)

8. Update config on both PCs:
   ```javascript
   export const signalingServerUrl = 'https://your-app.onrender.com'
   ```

**Advantages:**
- ✅ Permanent URL
- ✅ Works from anywhere
- ✅ No need to keep PC 1 running

**Disadvantages:**
- ⚠️ Free tier sleeps after 15 min (first connection is slow)
- ⚠️ Limited bandwidth on free tier

---

## 🔧 **Advanced: Using TURN Server**

If WebRTC P2P connection fails even with signaling working, you need a TURN server.

**Symptoms:**
- Signaling server shows offer/answer exchange
- Both clients connected to signaling server
- Console shows "Connection state: failed"
- No video appears

**This happens when:**
- Both PCs behind strict NAT
- Corporate firewalls blocking P2P
- Symmetric NAT on routers

**Solution: Add TURN Server**

### **Free TURN Options:**

1. **Twilio (Free Trial)**
   - Sign up at https://www.twilio.com
   - Get TURN credentials from STUN/TURN section

2. **Xirsys (Free Tier)**
   - Sign up at https://xirsys.com
   - 100 MB/month free

3. **metered.ca (Free Tier)**
   - Sign up at https://www.metered.ca/tools/openrelay
   - Free TURN server

### **Configure TURN in `src/config/webrtc.js`:**

```javascript
export const webrtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ]
}
```

**Rebuild app and test again.**

---

## ✅ **Pre-Flight Checklist**

### **Before Testing:**

**PC 1 (Server + Sender):**
- [ ] Found local IP address (ipconfig)
- [ ] Updated `src/config/webrtc.js` with IP
- [ ] Firewall allows port 3000
- [ ] Dependencies installed (npm install)
- [ ] Signaling server running (node server/singnaling-server.js)
- [ ] Electron app running (npm start)

**PC 2 (Receiver):**
- [ ] Project files copied over
- [ ] Dependencies installed (npm install)
- [ ] Updated `src/config/webrtc.js` with PC 1's IP
- [ ] Electron app running (npm start)
- [ ] Can ping PC 1's IP address

### **During Test:**

**Signaling Server Terminal (PC 1):**
- [ ] See "New client connected" for both PCs?
- [ ] See "registered as: sender" and "registered as: receiver"?
- [ ] See "Offer from sender → receiver"?
- [ ] See "Answer from receiver → sender"?
- [ ] See ICE candidate messages?

**Sender App (PC 1):**
- [ ] Status shows "Connected to signaling server"?
- [ ] Screen capture preview working?
- [ ] Status shows "Waiting for receiver" or "Connected"?

**Receiver App (PC 2):**
- [ ] Status shows "Connected to signaling server"?
- [ ] Status shows "Waiting for sender..."?
- [ ] Video appears when sender starts sharing?
- [ ] Status shows "✅ Connected! Receiving screen share"?

---

## 📝 **Quick Reference**

### **Configuration File Locations:**

**Signaling Server URL:**
- File: `src/config/webrtc.js`
- Line: 39
- Change to: `http://[PC1-IP]:3000` or ngrok URL

**STUN/TURN Servers:**
- File: `src/config/webrtc.js`
- Lines: 20-32

### **Important Commands:**

```bash
# Find IP address
ipconfig

# Test connectivity
ping [PC1-IP]

# Test server reachability
curl http://[PC1-IP]:3000/socket.io/

# Start signaling server
node server/singnaling-server.js

# Start Electron app
npm start

# Disable firewall (temporary, as Admin)
netsh advfirewall set allprofiles state off

# Enable firewall
netsh advfirewall set allprofiles state on
```

### **Default Ports:**

- **Signaling Server:** 3000 (TCP)
- **WebRTC Media:** Random UDP ports (49152-65535)

---

## 🎓 **Understanding the Connection Flow**

```
PC 1 (Sender)                PC 2 (Receiver)
     │                            │
     ├─ Connect to signaling      │
     │  server via WiFi           │
     │                            │
     │                            ├─ Connect to signaling
     │                            │  server via WiFi
     │                            │
     ├─ Register as "sender" ────►├─ Both registered
     │                            │
     ├─ Capture screen            │
     │                            │
     ├─ Create WebRTC offer ─────►├─ Receive offer
     │                            │
     │                            ├─ Create answer
     │◄──────────────── Send answer─┤
     │                            │
     ├─ Exchange ICE candidates ─►├─ Exchange ICE candidates
     │◄─────────────────────────  │
     │                            │
     │═══ Direct P2P Connection ═══►
     │    (Video stream)          │
```

**Key Points:**
- Signaling server only used for initial handshake
- After connection, video goes **directly PC 1 ↔ PC 2**
- Signaling server sees **zero video data**
- Connection is peer-to-peer, not client-server

---

## 🎯 **Success Indicators**

You'll know it's working when:

✅ **PC 1 shows:** "✅ Connected! Streaming to receiver"
✅ **PC 2 shows:** PC 1's screen in full quality
✅ **Signaling server logs:** Offer, Answer, and ICE messages
✅ **Low latency:** Mouse movements appear almost instantly
✅ **Smooth video:** No major lag or freezing

---

## 🆘 **Still Having Issues?**

### **Enable Detailed Logging:**

Add this to both sender and receiver Vue files to see more details:

```javascript
// In ScreenCapture.vue or ScreenReceiver.vue
peerConnection.value.addEventListener('icegatheringstatechange', () => {
  console.log('ICE gathering state:', peerConnection.value.iceGatheringState)
})

peerConnection.value.addEventListener('iceconnectionstatechange', () => {
  console.log('ICE connection state:', peerConnection.value.iceConnectionState)
})

peerConnection.value.addEventListener('signalingstatechange', () => {
  console.log('Signaling state:', peerConnection.value.signalingState)
})
```

### **Get Connection Stats:**

Open browser console (F12) and run:

```javascript
// On receiver
const stats = await peerConnection.value.getStats()
stats.forEach(report => console.log(report))
```

Look for:
- `type: 'inbound-rtp'` - Receiving video
- `bytesReceived` - Should be increasing
- `packetsLost` - Should be low

---

## 📚 **Additional Resources**

- [Main Implementation Guide](WEBRTC_IMPLEMENTATION_GUIDE.md)
- [WebRTC Glossary](https://webrtcglossary.com/)
- [Test WebRTC](https://test.webrtc.org/)

---

**Happy Testing! 🎉**

If you get it working, you've successfully implemented real-time P2P screen sharing!
