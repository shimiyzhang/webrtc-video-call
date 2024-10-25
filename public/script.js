const localVideo = document.getElementById('localVideo')
const remoteVideo = document.getElementById('remoteVideo')
const socket = io()

let localStream
let remoteStream
let peerConnection

// WebRTC配置
const configuration = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302', // 采用google的公共stun服务
    },
  ],
}

// 获取本地媒体
navigator.mediaDevices
  // .getUserMedia({ video: true, audio: true })
  .getDisplayMedia({ video: true, audio: true })
  .then((stream) => {
    localVideo.srcObject = stream
    localStream = stream
  })
  .catch((err) => {
    console.error('获取本地媒体失败:', err)
  })

// 当收到offer时，创建peerConnection并发送answer
socket.on('offer', async (offer) => {
  if (!peerConnection) {
    createPeerConnection()
  }

  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
    const answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)
    socket.emit('answer', answer)
  } catch (err) {
    console.error('处理offer失败:', err)
  }
})

// 当收到anwser时，设置远端描述
socket.on('answer', async (answer) => {
  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
  } catch (err) {
    console.error('处理answer失败:', err)
  }
})

// 当收到ICE候选时，添加到PeerConnection中
socket.on('ice-candidate', async (candidate) => {
  try {
    await peerConnection.addIceCandidate(candidate)
    console.log('添加ICE候选:', candidate)
  } catch (err) {
    console.error('添加ICE候选失败:', err)
  }
})

// 创建PeerConnection并处理本地ICE候选
function createPeerConnection() {
  peerConnection = new RTCPeerConnection(configuration)

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      console.log('发送ICE候选:', event.candidate)
      socket.emit('ice-candidate', event.candidate)
    }
  }

  peerConnection.ontrack = (event) => {
    console.log('接收到远程媒体轨道:', event)
    if (!remoteStream) {
      // 创建一个新的MediaStream对象来存储远程流
      remoteStream = new MediaStream()
      remoteVideo.srcObject = remoteStream
    }
    remoteStream.addTrack(event.track)
  }

  localStream.getTracks().forEach((track) => {
    // 将媒体轨道添加到将传输给其他对等端的轨道集合中
    peerConnection.addTrack(track, localStream)
  })
}

// 创建offer并发送给其他用户
async function makeCall() {
  if (!peerConnection) {
    createPeerConnection()
  }

  try {
    // 启动创建一个SDP offer，目的是启动一个新的 WebRTC 去连接远程端点。
    const offer = await peerConnection.createOffer()
    // 更改与连接关联的本地描述
    await peerConnection.setLocalDescription(offer)
    // 发送offer给其他用户
    socket.emit('offer', offer)
  } catch (err) {
    console.error('创建offer失败:', err)
  }
}

// 当本地视频流加载完成时自动发起呼叫
localVideo.onloadedmetadata = () => {
  makeCall()
}
