/**
 * WEBRTC CONFIGURATION
 *
 * This file contains all configuration for WebRTC connections
 */

/**
 * ICE Servers Configuration
 *
 * STUN Server:
 * - Discovers your public IP address and port
 * - Needed when both peers are behind routers/NAT
 * - Google provides free STUN servers
 *
 * TURN Server (optional, commented out):
 * - Relays video traffic when direct P2P connection fails
 * - Needed for ~10-20% of connections (strict firewalls)
 * - Costs bandwidth - use paid service or self-host
 */
export const webrtcConfig = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302' // Google's free STUN server
    },
    // Uncomment and configure if you have a TURN server:
    // {
    //   urls: 'turn:your-turn-server.com:3478',
    //   username: 'your-username',
    //   credential: 'your-password'
    // }
  ]
}

/**
 * Signaling Server URL
 * This is where your signaling server is running
 * Change this if you deploy the server elsewhere
 */
export const signalingServerUrl = 'http://192.168.1.4:3000'

/**
 * Media Constraints for Screen Capture
 * These settings control the quality of the captured screen
 */
export const screenConstraints = {
  audio: false, // Set to true if you want to capture system audio
  video: {
    mandatory: {
      chromeMediaSource: 'desktop',
      // Optional: Limit resolution to reduce bandwidth
      // maxWidth: 1920,
      // maxHeight: 1080,
      // maxFrameRate: 30
    }
  }
}
