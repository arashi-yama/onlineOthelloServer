const socket = io()
let name, username, pass, color, roomId, vs
function log(str) {
  let now = new Date()
  document.getElementById("log").value += `${now.getHours().toString().padStart(2, 0)}:${now.getMinutes().toString().padStart(2, 0)}:` + str + "\n\n"
}
let inp_br = document.getElementById("buildroom")
import { Othello } from "./othello.js"
let size = Math.min(innerHeight, innerWidth) / 2
let can = document.getElementById("can")
can.height = size
can.width = size
if (innerHeight >= innerWidth) {
  let loge = document.getElementById("log")
  loge.style.position = "absolute"
  loge.style.height = "20%"
  loge.style.width = "100%"
  loge.style.bottom = "0px"
  loge.style.left = "10px"
  loge.style.right = "10px"
} else {
  document.getElementById("log").style.top = "10px"
}
class OnlineOthello extends Othello {
  writeOn(canvasElement) {
    super.writeOn(canvasElement)
    this.clickEvent = (e) => {
      this.mouseX = Math.floor(e.offsetX / this.pixcel);
      this.mouseY = Math.floor(e.offsetY / this.pixcel);
      if (!this.canPutAt(this.mouseX, this.mouseY, color).map(v => v[0]).includes(true)) {
        log(`cannot put ${[null, "black", "white"][color]} at ${this.mouseX},${this.mouseY}`)
        return
      }
      log(`you put ${[null, "black", "white"][color]} at ${this.mouseX},${this.mouseY}`)
      socket.emit("put", roomId, this.mouseX, this.mouseY)
    }
    return this
  }
}
let othello = new OnlineOthello().writeOn(can)
window.addEventListener("resize", () => {
  size = Math.min(innerHeight, innerWidth) / 2
  can = document.getElementById("can")
  can.height = size
  can.width = size
  othello.writeOn(can).readHistry().drow()
})
inp_br.addEventListener("click", () => {
  name = document.getElementById("name").value
  username = document.getElementById("username").value
  pass = document.getElementById("pass").value
  if ([name, pass, username].some((v) => v === "")) return
  console.log("emit buildroom")
  socket.emit('buildroom', username, name, pass)
})
socket.on("buildroomFailure", (text) => {
  alert(text)
  log(text)
})
socket.on("buildroomSuccess", (text, roomid) => {
  document.getElementById("title").innerText = "OnlineOthello \nroom:" + name + "\nyou are black"
  color = 1
  log(text)
  roomId = roomid
  let elms = document.getElementsByClassName("remove")
  let length = elms.length
  for (let i = 0; i < length; i++) {
    elms[0].remove()
  }
  othello.drow()
})
document.getElementById("jr_sb").addEventListener("click", () => {
  username = document.getElementById("username").value
  name = document.getElementById("jr_rn").value
  pass = document.getElementById("jr_rp").value
  if ([name, pass, username].some((v) => v === "")) return
  console.log("joinroom emit", username, name, pass)
  socket.emit("joinroom", username, name, pass)
})
socket.on("joinroomFailure", (text) => {
  alert(text)
  log(text)
})
socket.on("joinroomSuccess", (text, roomid, v) => {
  document.getElementById("title").innerText = "OnlineOthello \nroom:" + name + "\nyou are white"
  vs = v
  log(`you join ${vs}'s room`)
  color = 2
  roomId = roomid
  let elms = document.getElementsByClassName("remove")
  let length = elms.length
  for (let i = 0; i < length; i++) {
    elms[0].remove()
  }
  othello.drow()
})
socket.on("joined", (v) => {
  log(vs + " joined this room")
  vs = v
})
let settle = false
socket.on("start", () => {
  log("start")
  setInterval(() => {
    if (settle) return
    if (color - 1 === othello.history.length % 2) {
      othello.enableClickToPut()
      document.getElementById("turn").innerText = "now is your turn"
      return
    }
    document.getElementById("turn").innerText = "now is " + vs + "'s turn"
    othello.disableClickToPut()
  }, 100)
})
socket.on("put", (x, y) => {
  log(`${vs} put at ${x},${y}`)
})
socket.on("history", (history) => {
  othello.history = history
  othello.readHistry().drow()
})
othello.winner.then((winner) => {
  othello.disableClickToPut()
  log(`winner is ${winner}`)
  document.getElementById("turn").innerText = `winner is ${winner}\nif you want to play again,please reload`
  if(color===1)socket.emit("end", roomId)
})