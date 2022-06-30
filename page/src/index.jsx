/* @refresh reload */
import { createSignal ,Show} from 'solid-js';
import { render } from 'solid-js/web';  

function Origin(){
  const [count,setCount]=createSignal(false)
  const toggle=()=>setCount(()=>!count())
  return (<>
    <h1>Online Othello</h1>
    <input id="username" placeholder="username"></input>
    <h2>Building a room</h2>
    Setting a passward<input type="checkbox"  onClick={toggle}></input><br></br>
    <input id="roomname" placeholder="room name"></input>
    <Show when={count()}>
      <input id="passward" placeholder="passward"></input>
    </Show>
    <h2>Joining a room</h2>
    <input placeholder="room name"></input>
    <input placeholder="passward"></input>
  </>
  )
}

render(() => <Origin />, document.getElementById('root'));