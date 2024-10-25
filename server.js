const express = require('express')
const http = require('http')
const socketIO = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = socketIO(server)

// 提供静态文件
app.use(express.static('public'))

// 处理socket.io连接
io.on('connection', (socket) => {
  console.log('一个用户已连接...')

  // 监听和转发信令数据
  socket.on('offer', (data) => {
    console.log('offer', data)
    socket.broadcast.emit('offer', data)
  })

  socket.on('answer', (data) => {
    console.log('answer', data)
    socket.broadcast.emit('answer', data)
  })

  socket.on('ice-candidate', (data) => {
    console.log('ice-candidate', data)
    socket.broadcast.emit('ice-candidate', data)
  })

  socket.on('disconnect', () => {
    console.log('一个用户已断开连接...')
  })
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`服务运行在端口 ${PORT}`)
})
