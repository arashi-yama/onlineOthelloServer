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
const {Room,Rooms}=require("./room.js")
app.use(express.static(__dirname+"/page/dist"))
!(async function(){
  await new Promise((res,rej)=>{
    db.run("create table if not exists history (id int, create_at date, data string)",(err)=>{
      if(err)return rej(err)
      return res()
    })
  })

  const oldestId=await new Promise((res,rej)=>{
    db.each("select max(id) from history",(err,row)=>{
      if(err)return rej(err)
      if(!row)return res(0)
      res(row["max(id)"])
    })
  })
  
  /**
   * @type {Room[]}
   */
  const rooms=new Rooms(oldestId)
  console.log(rooms)
  io.on('connection', (socket) => {
    console.log("connected")
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
      let sql=`insert into history (id,create_at,data) values (${roomId},datetime('now'),"${rooms.get(roomId).history.map(v=>v.join(",")).join(" ")}")`
      db.run(sql)
      rooms.delete(roomId)
      console.log(rooms)
    })
  })
  app.get("/", (req, res) => {
    res.sendFile(__dirname+"/page/dist/index.html")
  })
  
  server.listen(process.env.PORT || 5000, () => {
    console.log("app is running\nhttp://localhost:5000")
  })
})()