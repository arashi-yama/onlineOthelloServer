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
app.use(express.static(__dirname+"/page/dist"))
!(async function(){
  await new Promise((res,rej)=>{
    db.run("create table if not exists history (id int, create_at date, data string)",(err)=>{
      if(err)return rej(err)
      return res()
    })
  })

  const len=0??await new Promise((res,rej)=>{
    db.each("select max(id) from history",(err,row)=>{
      if(err)return rej(err)
      if(!row)return res(0)
      res(row["max(id)"])
    })
  })
  
  /**
   * @type {Room[]}
   */
  const rooms = Array(len).fill(null)
  io.on('connection', (socket) => {
    console.log("connected")
    socket.on('buildroom', ({username, roomname, pass}) => {
      console.log(username, roomname,pass)
      if (rooms.map(room => room&&room.roomname).includes(roomname)) {
        socket.emit("buildroomFailure", `Cannot build room because ${roomname} has been used`)
        return
      }
      const roomId = rooms.length
      rooms.push(new Room(roomname,username,socket.id,pass,roomId))
      socket.emit("buildroomSuccess",roomId)
      socket.join(roomId)
    })
  
    socket.on("joinroom", ({username, roomname, pass}) => {
      console.log(rooms)
      console.log(username,roomname,pass)
      const room = rooms.find(room => room&&room.roomname == roomname)
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
      socket.emit("joinroomSuccess",{roomId:room.id,opponent:room.users[0].username})
      socket.join(room.id)
      io.to(room.users[0].userId).emit("joined", username)
      io.to(room.id).emit("start")
    })
    socket.on("put", (roomId, x, y) => {
      console.log(roomId,x,y)
      const room=rooms[roomId]
      if (!room) return
      room.addHistory([x,y])
      const user=room.history.length%2
      io.to(room.users[user].userId).emit("put", x, y)
      io.to(roomId).emit("history", room.history)
    })
    socket.on("end", async (roomid) => {
      let sql=`insert into history (id,create_at,data) values (${roomid},datetime('now'),"${rooms[roomid].history.map(v=>v.join(",")).join(" ")}")`
      console.log(sql)
      db.run(sql)
      rooms[roomid] = null
    })
  })
  app.get("/", (req, res) => {
    res.sendFile(__dirname+"/page/dist/index.html")
  })
  
  server.listen(process.env.PORT || 5000, () => {
    console.log("app is running\nhttp://localhost:5000")
  })
})()