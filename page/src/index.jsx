/* @refresh reload */
import { createEffect,createSignal ,Show,Switch,Match} from 'solid-js'
import { render } from 'solid-js/web'
import {io} from "socket.io-client"
const soket=io()
function App(){
  const [state,setStatePre]=createSignal("origin")
  const buildRoom=()=>{
    const username=document.getElementById("username").value
    const roomname=document.getElementById("roomname").value
    const passElm=document.getElementById("passward")
    const pass=passElm&&passElm.value||null
    if(!username)return
    if(!roomname)return
    soket.emit("buildroom",{username,roomname,pass})
    soket.once("buildroomSuccess",roomId=>{
      console.log(roomId)
      setStatePre("game")

    })
    soket.once("buildroomFailure",message=>{
      console.log(message)
    })
  }

  const joinRoom=()=>{
    const username=document.getElementById("username").value
    const roomname=document.getElementById("join_roomname").value
    const passElm=document.getElementById("join_passward")
    const pass=passElm&&passElm.value||null
    soket.emit("joinroom",{username,roomname,pass})
    soket.once("joinroomSuccess",({roomId,opponent})=>{
      console.log("joinroom",roomId,opponent)
      setStatePre("game")
    })
    soket.once("joinroomFailure",message=>{
      alert(message)
      console.log(message)
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
      game
    </Match>
  </Switch>
  )
}

render(() =><App/>, document.getElementById('root'))