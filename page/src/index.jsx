import { createEffect,createSignal ,Show,Switch,Match,on} from 'solid-js'
import { render } from 'solid-js/web'
import {io} from "socket.io-client"
import Othello from "./othello.js"

let soket=io()

function App(){
  const [state,setState]=createSignal("origin")
  const [opponent,setOpponent]=createSignal("")
  const [roomId,setRoomId]=createSignal()
  const [myTurn,setTurn]=createSignal(false)
  const [color,setColor]=createSignal(0)
  const [winner,setWinner]=createSignal()
  const [count,setCount]=createSignal(false)
  const toggle=()=>setCount(()=>!count())
  const init=()=>{
    setOpponent("")
    setRoomId()
    setTurn(false)
    setColor(0)
    setWinner()
    setCount(false)
    soket=io()
  }
  let canvas
  let othello

  class OnlineOthello extends Othello{
    writeOn(canvas){
      super.writeOn(canvas)
      this.clickEvent=(e)=>{
        this.pixcel=this.size/8
        this.size = Math.min(canvas.height, canvas.width)
        this.mouseX = Math.floor(e.offsetX / (this.pixcel))
        this.mouseY = Math.floor(e.offsetY / (this.pixcel))
        if (0 <= this.mouseX <= 8 && 0 <= this.mouseY <= 8){
          console.log(this.mouseX,this.mouseY)
          if(!this.getPutablePlace(color()).some(([x,y])=>x===this.mouseX&&y===this.mouseY))return console.log("cannot put")
          this.putOn(this.mouseX, this.mouseY)
          this.readHistory()
          soket.emit("put",this.roomId,this.mouseX,this.mouseY)
          this.disableClickToPut()
        }
      }
      return this
    }
    enableClickToPut(){
      if (!this.canvas) return this;
      this.canvas.addEventListener('click', this.clickEvent);
      setTurn(true) 
      return this;
    }
    disableClickToPut(){
      if(!this.canvas)return this;
      this.canvas.removeEventListener("click",this.clickEvent)
      setTurn(false)
      return true
    }
  }

  createEffect(on(state,state=>{
    if(state!=="game")return
    const canvasSize=Math.min(innerHeight,innerWidth)*2/3
    canvas.width=canvasSize
    canvas.height=canvasSize
    othello=new OnlineOthello().writeOn(canvas)
    othello.readHistory().drow()
    soket.on("history",history=>{
      othello.history=history
      othello.readHistory().drow()
    })
    soket.on("put",()=>{
      othello.enableClickToPut()
    })
  }))
  
  const buildRoom=()=>{
    const username=document.getElementById("username").value||"Anonymous"
    const roomname=document.getElementById("roomname").value
    const passElm=document.getElementById("passward")
    const pass=passElm&&passElm.value||null
    if(!roomname)return
    soket.emit("buildroom",{username,roomname,pass})
    soket.once("buildroomSuccess",roomId=>{
      soket.once("joined",opp=>setOpponent(opp))
      setState("game")
      setColor(1)
      setTurn(true)
      othello.roomId=roomId
      setRoomId(roomId)
    })
    soket.once("buildroomFailure",message=>{
      alert(message)
    })
  }
  const joinRoom=()=>{
    const username=document.getElementById("username").value||"Anonymous"
    const roomname=document.getElementById("join_roomname").value
    const passElm=document.getElementById("join_passward")
    const pass=passElm&&passElm.value||null
    soket.emit("joinroom",{username,roomname,pass})
    soket.once("joinroomSuccess",({roomId,opponent})=>{
      setColor(2)
      setOpponent(opponent)
      setState("game")
      setTurn(false)
      othello.roomId=roomId
      setRoomId(roomId)
    })
    soket.once("joinroomFailure",message=>{
      alert(message)
    })
  }
  soket.once("start",()=>{
    othello.enableClickToPut()
    othello.winner.then(winner=>{
      othello.disableClickToPut()
      if(color()===1)soket.emit("end",othello.roomId)
      setWinner(winner)
    })
  })

  const toHistory=()=>{
    setStatePre("history")
  }
  
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
      <div style={{width:"30%","backgroundColor":"blue"}}>
        <Show when={roomId}>
          <h2>{"room id: "+roomId()}</h2>
        </Show>
        <Show when={opponent}>
          <h2>{"opponent: "+opponent()}</h2>
        </Show>
        <Show when={color()}>
          <h2>{"your are "+[null,"black","white"][color()]}</h2>
        </Show>
        <Show when={myTurn()} fallback={<Show when={winner()} fallback={<h2>{opponent()}'s turn</h2>}><h2>winner is {winner()}</h2><a href={window.location.href}>back to home</a></Show>}>
          <h2>your turn</h2>
        </Show>
      </div>
      <canvas ref={canvas}></canvas>
    </Match>
  </Switch>
  )
}

render(() =><App/>, document.getElementById('root'))