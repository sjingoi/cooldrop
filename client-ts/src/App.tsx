// import { useState } from "react"
// import { socket } from "./scripts/socket.ts"
import PeerManager from "./components/PeerManager"
import TopBar from "./components/TopBar"
import NameSelect from "./components/NameSelect"
import './app.css'


function App() {

  if (localStorage.getItem("name") === null) {
    return (
      <>
        <NameSelect/>
      </>
    )
  }

  return (
  <>
    <TopBar/>
    <PeerManager/>
  </>
  )
}

export default App
