/* @refresh reload */
import { createEffect,createSignal ,Show,Switch,Match,on} from 'solid-js'
import { render } from 'solid-js/web'
import {io} from "socket.io-client"
import Othello from "./othello.js"
let color=0
class OnlineOthello extends Othello{
  writeOn(canvas){
    super.writeOn(canvas)
    canvas.height=this.size
    canvas.width=this.size
    this.clickEvent=(e)=>{
      this.mouseX = Math.floor(e.offsetX / this.pixcel)
      this.mouseY = Math.floor(e.offsetY / this.pixcel)
      if (0 <= this.mouseX <= 8 && 0 <= this.mouseY <= 8) {
        this.putOn(this.mouseX, this.mouseY)
        this.readHistory()
        soket.emit("put",this.roomId,this.mouseX,this.mouseY)
        this.disableClickToPut()
      }
    }
    return this
  }
}
const soket=io()
//null black white
function App(){
  const [state,setState]=createSignal("origin")
  const [opponent,setOpponent]=createSignal("")
  const [roomId,setRoomId]=createSignal()
  let canvas
  let othello
  createEffect(on(state,state=>{
    if(state!=="game")return
    canvas.width=innerWidth*2/3
    canvas.height=innerHeight*2/3
    othello=new OnlineOthello().writeOn(canvas)
    othello.readHistory().drow()
    soket.on("history",history=>{
      othello.history=history
      othello.readHistory().drow().enableClickToPut()
    })
    soket.on("put",console.log)
  }))
  const buildRoom=()=>{
    const username=document.getElementById("username").value
    const roomname=document.getElementById("roomname").value
    const passElm=document.getElementById("passward")
    const pass=passElm&&passElm.value||null
    if(!username)return
    if(!roomname)return
    soket.emit("buildroom",{username,roomname,pass})
    soket.once("buildroomSuccess",roomId=>{
      soket.once("start",()=>othello.enableClickToPut())
      soket.once("joined",opp=>setOpponent(opp))
      setState("game")
      color=1
      othello.roomId=roomId
      setRoomId(roomId)
    })
    soket.once("buildroomFailure",message=>{
      alert(message)
    })
  }
  const joinRoom=()=>{
    const username=document.getElementById("username").value
    const roomname=document.getElementById("join_roomname").value
    const passElm=document.getElementById("join_passward")
    const pass=passElm&&passElm.value||null
    soket.emit("joinroom",{username,roomname,pass})
    soket.once("joinroomSuccess",({roomId,opponent})=>{
      soket.once("start",()=>othello)
      color=2
      setOpponent(opponent)
      setState("game")
      othello.roomId=roomId
      setRoomId(roomId)
    })
    soket.once("joinroomFailure",message=>{
      alert(message)
    })
  }
  const toHistory=()=>{
    setStatePre("history")
  }
  const [count,setCount]=createSignal(false)
  const toggle=()=>setCount(()=>!count())
  return (
  <Switch>
    <Match when={state()==="origin"}>
      <div style={{"text-align":"center"}}>
        <h1>Online Othello</h1>
        <input id="username" placeholder="your name"></input>
        <h2>Building a room</h2>
        Setting a passward<input type="checkbox" onClick={toggle}></input><br></br>
        <input id="roomname" placeholder="room name"></input>
          <Show when={count()}>
            <input id="passward" placeholder="passward"></input>
          </Show>
          <input type="submit" value="build" onClick={buildRoom}></input>
          <h2>Joining a room</h2>
          <input placeholder="room name" id="join_roomname"></input>
          <input placeholder="passward" id="join_passward"></input>
          <input type="submit" value="join" onClick={joinRoom}></input>
          <h2>Show history</h2>
          <input id="historyId" placeholder="room id"></input><input type="submit" onClick={toHistory}></input>
      </div>
    </Match>
    <Match when={state()==="game"}>
      <h2>room id:{roomId}</h2>
      <h2>opponent:{opponent}</h2>
      <div  style={{display:"flex","justify-content":"Center"}}>
        <canvas id="canvas" ref={canvas}></canvas>
      </div>
    </Match>
  </Switch>
  )
}

render(() =><App/>, document.getElementById('root'))