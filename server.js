require("dotenv").config()
const express = require("express")
const app = express()
const http = require("http")
const server = http.createServer(app)
const io = require("socket.io")(server)
const {Room,Rooms}=require("./room.js")
const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

app.use(express.static(__dirname+"/page/dist"))
!(async function(){
  await client.connect()
  client.query("SELECT * FROM history").then(result=>{
    console.log(result.rows)
  })
  await client.query("CREATE TABLE IF NOT EXISTS history (id int, data text)")
  const oldestId=(await client.query("SELECT max(id) FROM history")).rows[0].max||0
  const rooms=new Rooms(oldestId)
  console.log(rooms)
  io.on('connection', (socket) => {
    console.log("connected")
    socket.on("freeroom",({username})=>{
      const roomId=rooms.findKey(room=>room.roomname===null&&room.users.length===1)
      if(roomId){
        const room=rooms.get(roomId)
        room.addUser({
          username,
          userId:socket.id
        })
        socket.emit("freeroomSuccess",roomId,false)
        socket.join(roomId)
        socket.emit("join",room.users[0].username)
        io.to(room.users[0].userId).emit("joined", username)
        io.to(roomId).emit("start")
      }else{
        rooms.add(new Room(null,username,socket.id,null))
        socket.emit("freeroomSuccess",rooms.oldestId,true)
        socket.join(rooms.oldestId)
      }
    })

    socket.on('buildroom', ({username, roomname, pass}) => {
      if(rooms.findKey(room=>room.roomname===roomname)!==undefined){
        socket.emit("buildroomFailure", `Cannot build room because ${roomname} has been used`)
        return
      }
      rooms.add(new Room(roomname,username,socket.id,pass))
      socket.emit("buildroomSuccess",rooms.oldestId)
      socket.join(rooms.oldestId)
    })
  
    socket.on("joinroom", ({username, roomname, pass}) => {
      const roomId=rooms.findKey(room=>room.roomname===roomname)
      if(roomId===undefined){
        socket.emit("joinroomFailure", `${roomname} does not exist`)
        return
      }
      const room=rooms.get(roomId)
      if (room.pass !== pass) {
        socket.emit("joinroomFailure", "pass is wrong")
        return
      }
      if (room.users.length === 2) {
        socket.emit("joinroomFailure", "room is crowded")
        return
      }
      room.addUser({
        username,
        userId:socket.id
      })
      socket.emit("joinroomSuccess",{roomId,opponent:room.users[0].username})
      socket.join(roomId)
      io.to(room.users[0].userId).emit("joined", username)
      io.to(roomId).emit("start")
    })
    socket.on("put", (roomId, x, y) => {
      const room=rooms.get(roomId)
      if (!room) return
      room.addHistory([x,y])
      const user=room.history.length%2
      io.to(room.users[user].userId).emit("put", x, y)
      io.to(roomId).emit("history", room.history)
    })
    socket.on("end",roomId => {
      console.log(rooms)
      let sql=`INSERT INTO history (id,data) VALUES (${roomId},'${rooms.get(roomId).history.map(v=>v.join(",")).join(" ")}')`
      client.query(sql)
      rooms.delete(roomId)
      console.log(rooms)
    })

    socket.on("showHistory",roomId=>{
      console.log(roomId)
      console.log(typeof roomId)

      if(typeof roomId!=="number"||roomId<0)return socket.emit("shoHistoryFailer")
      let sql=`SELECT * FROM history WHERE id=${roomId}`
      client.query(sql).then(result=>{
        const row=result.rows[0]
        if(!row)return
        row.data=row.data.split(" ").map(v=>v.split(",").map(v=>+v))
        socket.emit("showHistorySuccess",row)
      }).catch(console.log)
    })
  })
  app.get("/", (req, res) => {
    res.sendFile(__dirname+"/page/dist/index.html")
  })
  
  server.listen(process.env.PORT || 5000, () => {
    console.log("app is running\nhttp://localhost:5000")
  })
})()