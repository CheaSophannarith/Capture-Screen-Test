# ⚡ Quick Start: Test Between 2 PCs (Same WiFi)

## 🎯 Goal
Get screen sharing working between 2 computers in **5 minutes**.

---

## 📋 What You Need

- ✅ 2 PCs on the **same WiFi network**
- ✅ Project installed on both PCs
- ✅ 10 minutes of time

---

## 🚀 Step-by-Step (Follow Exactly)

### **PC 1 Setup (Server)**

#### 1️⃣ Find Your IP Address
```bash
ipconfig
```
Look for: `IPv4 Address . . . : 192.168.1.100`
**👉 Write this down!**

#### 2️⃣ Edit Config File
Open: `src/config/webrtc.js`

Change line 39:
```javascript
// FROM:
export const signalingServerUrl = 'http://localhost:3000'

// TO: (use YOUR IP from step 1)
export const signalingServerUrl = 'http://192.168.1.100:3000'
```
**Save!**

#### 3️⃣ Turn Off Firewall (Temporary)
```bash
# Run as Administrator
netsh advfirewall set allprofiles state off
```

#### 4️⃣ Start Server
```bash
node server/singnaling-server.js
```
Should see: `🚀 Signaling server running on port 3000`
**Keep this running!**

#### 5️⃣ Start App (New Terminal)
```bash
npm start
```

---

### **PC 2 Setup (Receiver)**

#### 1️⃣ Copy Project
Transfer entire project folder to PC 2 (USB/network)

#### 2️⃣ Install
```bash
npm install
```

#### 3️⃣ Edit Config File
Open: `src/config/webrtc.js`

Change line 39 to **PC 1's IP**:
```javascript
export const signalingServerUrl = 'http://192.168.1.100:3000'
```
**Save!**

#### 4️⃣ Start App
```bash
npm start
```

---

## 🎬 Test It!

### **On PC 1:**
1. Click **blue Airplay icon** (top-right)
2. Click **"Share Screen"**
3. Select screen to share

### **On PC 2:**
1. Click **green Monitor icon** (top-right)
2. **Video should appear automatically!**

---

## ✅ Success!

You should see PC 1's screen on PC 2!

---

## ❌ Not Working?

### Quick Checks:

**On PC 2, can you reach PC 1?**
```bash
ping 192.168.1.100
```
✅ Should get replies
❌ "Request timed out" = network problem

**Is signaling server running on PC 1?**
Check the terminal - should see:
```
✅ New client connected: [PC1 ID]
✅ New client connected: [PC2 ID]
```

**Check browser console (F12) on both PCs**
Look for errors in red.

---

## 🔧 Common Fixes

### "Cannot connect to signaling server"
- ✅ Verify IP address is correct (ipconfig on PC 1)
- ✅ Firewall is off on PC 1
- ✅ Both PCs on **same WiFi**

### "Connected but no video"
- ✅ Check browser console for errors
- ✅ Try disabling firewall on PC 2 also
- ✅ Check signaling server logs

---

## 📖 Need More Help?

See detailed guide: [TESTING_GUIDE_2PC.md](TESTING_GUIDE_2PC.md)

---

## 🎉 What's Next?

Once working:
- ✅ Test across different networks (see [TESTING_GUIDE_2PC.md](TESTING_GUIDE_2PC.md) for ngrok setup)
- ✅ Add audio sharing
- ✅ Add recording feature
- ✅ Deploy signaling server to cloud

---

## ⚠️ Don't Forget!

Turn firewall back on when done testing:
```bash
netsh advfirewall set allprofiles state on
```
