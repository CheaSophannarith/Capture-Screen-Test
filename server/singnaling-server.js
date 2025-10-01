/**
 * SIGNALING SERVER
 *
 * This is a WebSocket server that helps two peers (sender and receiver)
 * exchange connection information to establish a direct WebRTC connection.
 *
 * Think of it like a "matchmaker" - it introduces two people but then steps away
 * once they start talking directly to each other.
 */

const { Server } = require('socket.io')
const http = require('http')

// Create HTTP server first
const httpServer = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('WebRTC Signaling Server is running!\n')
})

// Create Socket.io server on top of HTTP server
const io = new Server(httpServer, {
  cors: {
    origin: '*', // Allow connections from any origin (Electron app)
    methods: ['GET', 'POST']
  }
})

// Listen on all network interfaces (0.0.0.0) so other PCs can connect
httpServer.listen(3000, '0.0.0.0', () => {
  console.log('===========================================')
  console.log('🚀 Signaling server running!')
  console.log('===========================================')
  console.log('   Local access:   http://localhost:3000')
  console.log('   Network access: http://192.168.1.4:3000')
  console.log('')
  console.log('💡 Other computers can connect using:')
  console.log('   http://192.168.1.4:3000')
  console.log('===========================================')
  console.log('')
})

// Store connected peers
// Format: { socketId: { id, role: 'sender' or 'receiver' } }
const peers = new Map()

// Handle new client connections
io.on('connection', (socket) => {
  console.log(`✅ New client connected: ${socket.id}`)

  /**
   * EVENT: 'register'
   * When a peer connects, they register as either 'sender' or 'receiver'
   */
  socket.on('register', (role) => {
    peers.set(socket.id, { id: socket.id, role })
    console.log(`📝 Client ${socket.id} registered as: ${role}`)
    console.log(`👥 Total peers: ${peers.size}`)

    // Send back the client's own ID
    socket.emit('registered', socket.id)

    // Notify all clients about available peers
    broadcastPeerList()
  })

  /**
   * EVENT: 'offer'
   * Sender creates an offer (SDP) and sends it to a specific receiver
   *
   * SDP = Session Description Protocol
   * Contains: video codec info, network details, media capabilities
   */
  socket.on('offer', ({ offer, targetId }) => {
    console.log(`📤 Offer from ${socket.id} → ${targetId}`)

    // Forward the offer to the target peer
    io.to(targetId).emit('offer', {
      offer,
      senderId: socket.id
    })
  })

  /**
   * EVENT: 'answer'
   * Receiver responds with an answer (SDP) back to sender
   */
  socket.on('answer', ({ answer, targetId }) => {
    console.log(`📥 Answer from ${socket.id} → ${targetId}`)

    // Forward the answer to the sender
    io.to(targetId).emit('answer', {
      answer,
      senderId: socket.id
    })
  })

  /**
   * EVENT: 'ice-candidate'
   * Both peers exchange ICE candidates to find the best connection path
   *
   * ICE Candidate = A possible network route (IP address + port)
   * Both peers send multiple candidates until they find one that works
   */
  socket.on('ice-candidate', ({ candidate, targetId }) => {
    console.log(`🧊 ICE candidate from ${socket.id} → ${targetId}`)

    // Forward ICE candidate to target peer
    io.to(targetId).emit('ice-candidate', {
      candidate,
      senderId: socket.id
    })
  })

  /**
   * EVENT: 'disconnect'
   * Clean up when a peer disconnects
   */
  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`)

    const peer = peers.get(socket.id)
    if (peer) {
      // Notify other peers about disconnection
      socket.broadcast.emit('peer-disconnected', socket.id)
      peers.delete(socket.id)
      console.log(`👥 Total peers: ${peers.size}`)
    }

    broadcastPeerList()
  })

  /**
   * Broadcast the current list of available peers to all clients
   */
  function broadcastPeerList() {
    const peerList = Array.from(peers.values())
    io.emit('peer-list', peerList)
    console.log('📋 Broadcasted peer list:', peerList)
  }
})

/**
 * HOW THIS WORKS:
 *
 * 1. Sender opens ScreenCapture.vue → connects to this server
 * 2. Receiver opens ScreenReceiver.vue → connects to this server
 * 3. Both register their role (sender/receiver)
 * 4. Sender creates WebRTC offer → sends via this server → reaches receiver
 * 5. Receiver creates WebRTC answer → sends via this server → reaches sender
 * 6. Both exchange ICE candidates via this server
 * 7. Once WebRTC connection is established, they talk DIRECTLY (P2P)
 * 8. This server is no longer involved in video transmission!
 */
