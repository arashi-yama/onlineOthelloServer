const express = require("express")
const app = express()
const http = require("http")
const server = http.createServer(app)
var io = require("socket.io")(server)
app.use(express.json())
app.use(express.static("page"))
let rooms = []
io.on('connection', (socket) => {
    console.log(`a user ${socket.id} connected`);
    socket.on('buildroom', (username, name, pass) => {
        if (rooms.map(e => e.name).includes(name)) {
            socket.emit("buildroomFailure", `Cannot build room because ${name} has been used`)
            return
        }
        let roomIndex = rooms.length
        rooms.push({
            name: name,
            users: [{
                username: username,
                userId: socket.id
            }],
            pass: pass,
            othelloHistory: [],
            index: roomIndex
        })
        socket.emit("buildroomSuccess", `built a room at ${roomIndex}`, roomIndex)
        socket.join(roomIndex)
    })

    socket.on("joinroom", (username, name, pass) => {
        let room = rooms.find((v) => v.name == name)
        let roomIndex = rooms.findIndex((v) => v.name == name)
        if (room === undefined) {
            socket.emit("joinroomFailure", `${name} is undefined`)
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
        room.users.push({
            username: username,
            userId: socket.id
        })
        socket.emit("joinroomSuccess", `joined a room at ${roomIndex}`, roomIndex, room.users[0].username)
        socket.join(roomIndex)
        io.to(room.users[0].userId).emit("joined", username)
        io.to(roomIndex).emit("start")
    })
    socket.on("put", (roomid, x, y) => {
        console.log("put", roomid, x, y)
        if(!rooms[roomid])return
        rooms[roomid].othelloHistory.push([x, y])
        let user = rooms[roomid].othelloHistory.length % 2
        console.log(rooms[roomid].users[user].userId)
        io.to(rooms[roomid].users[user].userId).emit("put", x, y)
        io.to(rooms[roomid].index).emit("history", rooms[roomid].othelloHistory)
    })
    socket.on("end",(roomid)=>{
        rooms[roomid]=null
    })
});
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/page/index.html")
    res.sendFile(__dirname + "/page/index.js")
    res.sendFile(__dirname + "/page/frontOthelloClass.js")
})
server.listen(process.env.POST||3000, () => {
    console.log("app is running")
})