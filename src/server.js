const express = require("express")
const app = express()
const http = require("http")
const server = http.createServer(app)
const io = require("socket.io")(server)
const sqlite3=require("sqlite3")
const fs=require("fs")
if(!fs.existsSync("./history.db")){
  fs.writeFileSync("./history.db","")
}
const db=new sqlite3.Database("./history.db")
const {Room}=require("./room.js")

!(async function(){
  await new Promise((res,rej)=>{
    db.run("create table if not exists history (id int, create_at date, data string)",(err)=>{
      if(err)return rej(err)
      return res()
    })
  })

  const len=await new Promise((res,rej)=>{
    db.each("select max(id) from history",(err,row)=>{
      if(err)return rej(err)
      if(!row)return res(0)
      res(row["max(id)"])
    })
  })
  app.use(express.json())
  app.use(express.static(__dirname + "/pages"))
  /**
   * @type {Room[]}
   */
  const rooms = Array(len).fill(null)
  io.on('connection', (socket) => {
    socket.on('buildroom', (username, roomname, pass) => {
      if (rooms.map(room => room&&room.roomname).includes(roomname)) {
        socket.emit("buildroomFailure", `Cannot build room because ${roomname} has been used`)
        return
      }
      let roomIndex = rooms.length
      rooms.push(new Room(roomname,username,socket.id,pass,roomIndex))
      socket.emit("buildroomSuccess", `built a room at ${roomIndex}`, roomIndex)
      socket.join(roomIndex)
    })
  
    socket.on("joinroom", (username, roomname, pass) => {
      const room = rooms.find(room => room&&room.roomname == roomname)
      const roomIndex = room.index
      if (room === undefined) {
        socket.emit("joinroomFailure", `${roomname} does not exist`)
        return
      }
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
      socket.emit("joinroomSuccess", `joined a room at ${roomIndex}`, roomIndex, room.users[0].username)
      socket.join(roomIndex)
      io.to(room.users[0].userId).emit("joined", username)
      io.to(roomIndex).emit("start")
    })
    socket.on("put", (roomId, x, y) => {
      const room=rooms[roomId]
      if (!room) return
      room.addHistory([x,y])
      const user=room.history.length%2
      io.to(room.users[user].userId).emit("put", x, y)
      io.to(room.index).emit("history", room.history)
      console.log(room)
    })
    socket.on("end", async (roomid) => {
      let sql=`insert into history (id,create_at,data) values (${roomid},datetime('now'),"${rooms[roomid].history.map(v=>v.join(",")).join(" ")}")`
      console.log(sql)
      db.run(sql)
      rooms[roomid] = null
    })
  })
  app.get("/", (req, res) => {
    res.sendFile(__dirname + "/pages/index.html")
    res.sendFile(__dirname + "/pages/index.js")
    res.sendFile(__dirname + "/pages/othello.js")
  })
  
  app.get("/history", (req, res) => {
    
  })
  
  server.listen(process.env.PORT || 3000, () => {
    console.log("app is running")
  })
})()