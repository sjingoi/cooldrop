// import { useState } from "react"
// import { socket } from "./scripts/socket.ts"
import PeerManager from "./components/PeerManager"
import TopBar from "./components/TopBar"
import NameSelect from "./components/NameSelect"
import { useState } from "react"
import './app.css'


function App() {
  const [name, setName] = useState<string | null>(localStorage.getItem("name"));

  

  if (name === null) {
    return (
      <>
        <NameSelect updateName={setName}/>
      </>
    )
  }

  return (
  <>
    <TopBar/>
    <PeerManager updateName={setName}/>
  </>
  )
}

export default App
