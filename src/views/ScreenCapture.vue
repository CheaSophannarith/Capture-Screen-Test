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
            <!-- Video Preview -->
            <div class="bg-gray-900 rounded-lg overflow-hidden mb-6 relative" style="aspect-ratio: 16/9;">
                <video ref="videoPreview" autoplay muted class="w-full h-full object-contain"></video>
                <div v-if="!isCapturing && !mediaStream"
                    class="absolute inset-0 flex items-center justify-center text-gray-400">
                    <div class="text-center">
                        <Airplay :size="64" class="mx-auto mb-4" />
                        <p class="text-lg">Click "Share Screen" to start</p>
                    </div>
                </div>
            </div>

            <!-- Controls -->
            <div class="flex justify-center space-x-4 mb-6">
                <button @click="selectSource" v-if="!mediaStream"
                    class="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg flex items-center transition-colors">
                    <Airplay :size="20" class="mr-2" />
                    Share Screen
                </button>
                <button @click="stopCapture" v-if="mediaStream"
                    class="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg flex items-center transition-colors">
                    <Square :size="20" class="mr-2" />
                    Stop Share
                </button>
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
    import { ref, onUnmounted, onMounted } from 'vue'
    import { useRouter } from 'vue-router'
    import { io } from 'socket.io-client'
    import { webrtcConfig, signalingServerUrl } from '@/config/webrtc.js'

    const router = useRouter()
    const videoPreview = ref(null)
    const mediaStream = ref(null)
    const isCapturing = ref(false)
    const statusMessage = ref('')
    const errorMessage = ref('')

    // WebRTC-specific refs
    const socket = ref(null)
    const peerConnection = ref(null)
    const receiverId = ref(null)
    const isConnectedToPeer = ref(false)
    const myId = ref(null)
    const availableReceivers = ref([])

    const handleBackToHome = () => {
        stopCapture()
        router.push({ name: 'Home' })
    }

    /**
     * CONNECT TO SIGNALING SERVER
     * This runs when component mounts
     * Establishes WebSocket connection to exchange SDP/ICE with receiver
     */
    const connectToSignalingServer = () => {
        try {
            // Connect to signaling server
            socket.value = io(signalingServerUrl)

            // Event: Successfully registered with server
            socket.value.on('registered', (id) => {
                myId.value = id
                console.log('✅ Registered with signaling server. My ID:', id)
                statusMessage.value = 'Connected to signaling server'
            })

            // Event: Receive list of available receivers
            socket.value.on('peer-list', (peers) => {
                // Filter to show only receivers
                availableReceivers.value = peers.filter(p => p.role === 'receiver' && p.id !== myId.value)
                console.log('📋 Available receivers:', availableReceivers.value)
            })

            // Event: Receiver sent back an answer to our offer
            socket.value.on('answer', async ({ answer, senderId }) => {
                console.log('📥 Received answer from receiver:', senderId)
                await handleAnswer(answer, senderId)
            })

            // Event: Receiver sent an ICE candidate
            socket.value.on('ice-candidate', async ({ candidate, senderId }) => {
                console.log('🧊 Received ICE candidate from receiver')
                await handleIceCandidate(candidate)
            })

            // Event: Receiver disconnected
            socket.value.on('peer-disconnected', (peerId) => {
                if (peerId === receiverId.value) {
                    console.log('❌ Receiver disconnected')
                    statusMessage.value = 'Receiver disconnected'
                    isConnectedToPeer.value = false
                }
            })

            // Register as sender
            socket.value.emit('register', 'sender')

        } catch (err) {
            errorMessage.value = 'Failed to connect to signaling server: ' + err.message
            console.error('Signaling server error:', err)
        }
    }

    const selectSource = async () => {
        try {
            errorMessage.value = ''
            statusMessage.value = 'Selecting screen source...'

            // Request screen capture using Electron's desktopCapturer
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop'
                    }
                }
            })

            mediaStream.value = stream
            isCapturing.value = true

            if (videoPreview.value) {
                videoPreview.value.srcObject = stream
            }

            statusMessage.value = 'Screen sharing active'

            // Handle stream end
            stream.getVideoTracks()[0].addEventListener('ended', () => {
                stopCapture()
            })

            /**
             * INITIALIZE WEBRTC CONNECTION
             * Now that we have the screen stream, set up WebRTC to send it
             * This will only happen if there's a receiver available
             */
            if (availableReceivers.value.length > 0) {
                // Automatically connect to the first available receiver
                receiverId.value = availableReceivers.value[0].id
                await initializePeerConnection()
            } else {
                statusMessage.value = 'Screen captured. Waiting for receiver to connect...'
            }

        } catch (err) {
            errorMessage.value = 'Failed to capture screen: ' + err.message
            console.error('Error selecting source:', err)
        }
    }

    /**
     * INITIALIZE PEER CONNECTION
     * Creates RTCPeerConnection, adds video tracks, creates offer
     */
    const initializePeerConnection = async () => {
        try {
            console.log('🔗 Initializing WebRTC peer connection...')

            // Create new RTCPeerConnection with STUN server configuration
            peerConnection.value = new RTCPeerConnection(webrtcConfig)

            /**
             * ADD VIDEO TRACKS TO CONNECTION
             * Takes each track (video) from our screen capture stream
             * and adds it to the peer connection to be sent
             */
            mediaStream.value.getTracks().forEach(track => {
                console.log('➕ Adding track to peer connection:', track.kind)
                peerConnection.value.addTrack(track, mediaStream.value)
            })

            /**
             * HANDLE ICE CANDIDATES
             * When WebRTC finds a possible network path (ICE candidate),
             * send it to the receiver via signaling server
             */
            peerConnection.value.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('🧊 Sending ICE candidate to receiver')
                    socket.value.emit('ice-candidate', {
                        candidate: event.candidate,
                        targetId: receiverId.value
                    })
                }
            }

            /**
             * MONITOR CONNECTION STATE
             * Track the WebRTC connection status
             */
            peerConnection.value.onconnectionstatechange = () => {
                const state = peerConnection.value.connectionState
                console.log('📡 Connection state:', state)

                switch (state) {
                    case 'connected':
                        statusMessage.value = '✅ Connected! Streaming to receiver'
                        isConnectedToPeer.value = true
                        break
                    case 'disconnected':
                        statusMessage.value = 'Disconnected from receiver'
                        isConnectedToPeer.value = false
                        break
                    case 'failed':
                        errorMessage.value = 'Connection failed. Check your network.'
                        isConnectedToPeer.value = false
                        break
                }
            }

            /**
             * CREATE OFFER
             * Generate SDP offer describing our media capabilities
             * and send it to the receiver
             */
            const offer = await peerConnection.value.createOffer()
            await peerConnection.value.setLocalDescription(offer)

            console.log('📤 Sending offer to receiver:', receiverId.value)
            socket.value.emit('offer', {
                offer: offer,
                targetId: receiverId.value
            })

            statusMessage.value = 'Waiting for receiver to accept...'

        } catch (err) {
            errorMessage.value = 'Failed to establish connection: ' + err.message
            console.error('Peer connection error:', err)
        }
    }

    /**
     * HANDLE ANSWER FROM RECEIVER
     * Receiver accepted our offer and sent back their SDP answer
     */
    const handleAnswer = async (answer, senderId) => {
        try {
            if (!peerConnection.value) {
                console.error('No peer connection available')
                return
            }

            console.log('✅ Setting remote description (answer)')
            await peerConnection.value.setRemoteDescription(new RTCSessionDescription(answer))

        } catch (err) {
            errorMessage.value = 'Failed to process answer: ' + err.message
            console.error('Answer error:', err)
        }
    }

    /**
     * HANDLE ICE CANDIDATE FROM RECEIVER
     * Add the receiver's network path to our connection
     */
    const handleIceCandidate = async (candidate) => {
        try {
            if (!peerConnection.value) {
                console.error('No peer connection available')
                return
            }

            console.log('✅ Adding ICE candidate')
            await peerConnection.value.addIceCandidate(new RTCIceCandidate(candidate))

        } catch (err) {
            console.error('ICE candidate error:', err)
        }
    }

    const stopCapture = () => {
        // Stop media stream
        if (mediaStream.value) {
            mediaStream.value.getTracks().forEach(track => track.stop())
            mediaStream.value = null
        }

        // Clear video preview
        if (videoPreview.value) {
            videoPreview.value.srcObject = null
        }

        // Close peer connection
        if (peerConnection.value) {
            peerConnection.value.close()
            peerConnection.value = null
        }

        // Reset states
        isCapturing.value = false
        isConnectedToPeer.value = false
        statusMessage.value = ''
    }

    /**
     * LIFECYCLE: ON MOUNTED
     * Connect to signaling server when component loads
     */
    onMounted(() => {
        connectToSignalingServer()
    })

    /**
     * LIFECYCLE: ON UNMOUNTED
     * Cleanup when component is destroyed
     */
    onUnmounted(() => {
        stopCapture()

        // Disconnect from signaling server
        if (socket.value) {
            socket.value.disconnect()
            socket.value = null
        }
    })
</script>