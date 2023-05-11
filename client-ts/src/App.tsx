// import { useState } from "react"
// import { socket } from "./scripts/socket.ts"
import PeerManager from "./components/PeerManager"
import TopBar from "./components/TopBar"
import './app.css'


function App() {

  return (
  <>
    <TopBar/>
    <PeerManager/>
  </>
  )
}

export default App
