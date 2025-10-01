<template>
    <div class="min-h-screen bg-white dark:bg-gray-800 p-6">
        <div class="flex items-center justify-between mb-6">
            <button @click="handleBackToHome"
                class="bg-blue-500 hover:bg-blue-600 rounded-xl p-4 text-white flex items-center transition-colors">
                <House class="inline-block mr-2" :size="20" />
                <span>Home</span>
            </button>
        </div>

        <div class="max-w-4xl mx-auto">
            <!-- Remote Video Display -->
            <div class="bg-gray-900 rounded-lg overflow-hidden mb-6 relative" style="aspect-ratio: 16/9;">
                <video ref="remoteVideo" autoplay muted class="w-full h-full object-contain"></video>
                <div v-if="!isReceiving"
                    class="absolute inset-0 flex items-center justify-center text-gray-400">
                    <div class="text-center">
                        <Monitor :size="64" class="mx-auto mb-4" />
                        <p class="text-lg">Waiting for sender to share screen...</p>
                        <p class="text-sm mt-2">Connected as: {{ myId || 'Connecting...' }}</p>
                    </div>
                </div>
            </div>

            <!-- Connection Info -->
            <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-6">
                <h3 class="font-semibold mb-2 text-gray-800 dark:text-gray-200">Connection Status</h3>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Signaling Server:</span>
                        <span class="font-mono" :class="isConnectedToServer ? 'text-green-600' : 'text-red-600'">
                            {{ isConnectedToServer ? '✅ Connected' : '❌ Disconnected' }}
                        </span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Peer Connection:</span>
                        <span class="font-mono" :class="isReceiving ? 'text-green-600' : 'text-yellow-600'">
                            {{ connectionState }}
                        </span>
                    </div>
                    <div class="flex justify-between" v-if="myId">
                        <span class="text-gray-600 dark:text-gray-400">Your ID:</span>
                        <span class="font-mono text-gray-800 dark:text-gray-200">{{ myId }}</span>
                    </div>
                </div>
            </div>

            <!-- Status Messages -->
            <div v-if="statusMessage"
                class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 p-4 rounded-lg mb-6">
                {{ statusMessage }}
            </div>
            <div v-if="errorMessage"
                class="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-lg mb-6">
                {{ errorMessage }}
            </div>
        </div>
    </div>
</template>

<script setup>
    import { ref, onMounted, onUnmounted } from 'vue'
    import { useRouter } from 'vue-router'
    import { io } from 'socket.io-client'
    import { webrtcConfig, signalingServerUrl } from '@/config/webrtc.js'
    import { House, Monitor } from 'lucide-vue-next'

    const router = useRouter()
    const remoteVideo = ref(null)
    const socket = ref(null)
    const peerConnection = ref(null)
    const myId = ref(null)
    const senderId = ref(null)
    const isReceiving = ref(false)
    const isConnectedToServer = ref(false)
    const connectionState = ref('Not connected')
    const statusMessage = ref('')
    const errorMessage = ref('')

    const handleBackToHome = () => {
        cleanup()
        router.push({ name: 'Home' })
    }

    /**
     * CONNECT TO SIGNALING SERVER
     * Establishes WebSocket connection to receive offers from sender
     */
    const connectToSignalingServer = () => {
        try {
            console.log('🔗 Connecting to signaling server...')
            socket.value = io(signalingServerUrl, {
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5
            })

            // Event: Successfully connected and registered
            socket.value.on('connect', () => {
                isConnectedToServer.value = true
                console.log('✅ Connected to signaling server')
                statusMessage.value = 'Connected to signaling server. Waiting for sender...'
                errorMessage.value = ''
            })

            // Event: Connection error
            socket.value.on('connect_error', (error) => {
                isConnectedToServer.value = false
                console.error('❌ Connection error:', error)
                errorMessage.value = `Cannot connect to server at ${signalingServerUrl}. ${error.message}`
            })

            // Event: Successfully registered with server
            socket.value.on('registered', (id) => {
                myId.value = id
                console.log('✅ Registered as receiver. My ID:', id)
            })

            // Event: Sender sent an offer to connect
            socket.value.on('offer', async ({ offer, senderId: sid }) => {
                console.log('📥 Received offer from sender:', sid)
                senderId.value = sid
                await handleOffer(offer, sid)
            })

            // Event: Sender sent an ICE candidate
            socket.value.on('ice-candidate', async ({ candidate, senderId: sid }) => {
                console.log('🧊 Received ICE candidate from sender')
                await handleIceCandidate(candidate)
            })

            // Event: Sender disconnected
            socket.value.on('peer-disconnected', (peerId) => {
                if (peerId === senderId.value) {
                    console.log('❌ Sender disconnected')
                    statusMessage.value = 'Sender disconnected'
                    isReceiving.value = false
                    connectionState.value = 'Disconnected'

                    if (remoteVideo.value) {
                        remoteVideo.value.srcObject = null
                    }
                }
            })

            // Event: Disconnected from server
            socket.value.on('disconnect', () => {
                isConnectedToServer.value = false
                console.log('❌ Disconnected from signaling server')
                statusMessage.value = 'Disconnected from signaling server'
            })

            // Register as receiver
            socket.value.emit('register', 'receiver')

        } catch (err) {
            errorMessage.value = 'Failed to connect to signaling server: ' + err.message
            console.error('Signaling server error:', err)
        }
    }

    /**
     * HANDLE OFFER FROM SENDER
     * Sender wants to share their screen with us
     */
    const handleOffer = async (offer, sid) => {
        try {
            console.log('🔗 Setting up peer connection...')
            statusMessage.value = 'Sender wants to share screen. Accepting...'

            // Create new RTCPeerConnection
            peerConnection.value = new RTCPeerConnection(webrtcConfig)

            /**
             * HANDLE INCOMING TRACKS
             * When sender's video track arrives, display it
             */
            peerConnection.value.ontrack = (event) => {
                console.log('📺 Received remote track:', event.track.kind)

                if (remoteVideo.value && event.streams[0]) {
                    remoteVideo.value.srcObject = event.streams[0]
                    isReceiving.value = true
                    statusMessage.value = '✅ Receiving screen share!'
                    console.log('✅ Remote video stream connected')
                }
            }

            /**
             * HANDLE ICE CANDIDATES
             * Send our network paths to the sender
             */
            peerConnection.value.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('🧊 Sending ICE candidate to sender')
                    socket.value.emit('ice-candidate', {
                        candidate: event.candidate,
                        targetId: sid
                    })
                }
            }

            /**
             * MONITOR CONNECTION STATE
             */
            peerConnection.value.onconnectionstatechange = () => {
                const state = peerConnection.value.connectionState
                connectionState.value = state.charAt(0).toUpperCase() + state.slice(1)
                console.log('📡 Connection state:', state)

                switch (state) {
                    case 'connected':
                        statusMessage.value = '✅ Connected! Receiving screen share'
                        isReceiving.value = true
                        break
                    case 'disconnected':
                        statusMessage.value = 'Disconnected from sender'
                        isReceiving.value = false
                        break
                    case 'failed':
                        errorMessage.value = 'Connection failed. Check your network.'
                        isReceiving.value = false
                        break
                }
            }

            /**
             * SET REMOTE DESCRIPTION (OFFER)
             * Apply the sender's offer to our connection
             */
            console.log('✅ Setting remote description (offer)')
            await peerConnection.value.setRemoteDescription(new RTCSessionDescription(offer))

            /**
             * CREATE ANSWER
             * Generate our response to the sender's offer
             */
            console.log('📤 Creating answer...')
            const answer = await peerConnection.value.createAnswer()
            await peerConnection.value.setLocalDescription(answer)

            /**
             * SEND ANSWER TO SENDER
             */
            console.log('📤 Sending answer to sender:', sid)
            socket.value.emit('answer', {
                answer: answer,
                targetId: sid
            })

            statusMessage.value = 'Answer sent. Establishing connection...'

        } catch (err) {
            errorMessage.value = 'Failed to handle offer: ' + err.message
            console.error('Offer handling error:', err)
        }
    }

    /**
     * HANDLE ICE CANDIDATE FROM SENDER
     * Add sender's network path to our connection
     */
    const handleIceCandidate = async (candidate) => {
        try {
            if (!peerConnection.value) {
                console.warn('Received ICE candidate but no peer connection exists')
                return
            }

            console.log('✅ Adding ICE candidate')
            await peerConnection.value.addIceCandidate(new RTCIceCandidate(candidate))

        } catch (err) {
            console.error('ICE candidate error:', err)
        }
    }

    /**
     * CLEANUP
     * Close all connections and clear resources
     */
    const cleanup = () => {
        // Stop video
        if (remoteVideo.value) {
            remoteVideo.value.srcObject = null
        }

        // Close peer connection
        if (peerConnection.value) {
            peerConnection.value.close()
            peerConnection.value = null
        }

        // Disconnect from signaling server
        if (socket.value) {
            socket.value.disconnect()
            socket.value = null
        }

        // Reset states
        isReceiving.value = false
        isConnectedToServer.value = false
        connectionState.value = 'Not connected'
    }

    /**
     * LIFECYCLE: ON MOUNTED
     */
    onMounted(() => {
        connectToSignalingServer()
    })

    /**
     * LIFECYCLE: ON UNMOUNTED
     */
    onUnmounted(() => {
        cleanup()
    })
</script>
