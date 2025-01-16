import { useEffect, useState } from 'react'
import './App.css'
import axios from "axios"

function App() {
  const [user, setUsers] = useState([])

  useEffect(() => {
    axios.get('/userlist')
      .then((res) => {
        setUsers(res.data)
      })
      .catch((error) => {
      console.log(error)
    })
  },[])

  return (
    <>
      <h1>Here are the user details</h1>
      <h3>Users count : {user.length}</h3>
      {
        user.map((item) => {
        return <div key={item.id}>
          <h2>user : {item.user}</h2>
          <h2>password : {item.password}</h2>
        </div>
      })}
    </>
  )
}

export default App
