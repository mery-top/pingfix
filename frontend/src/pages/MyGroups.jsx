import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MyGroupsAPI, LeaveGroupAPI, RequestDeleteGroupAPI, ConfirmDeleteGroupAPI } from '../api/GroupAPI'
import Modal from "../components/Modal"


function MyGroups() {
    const [pagination, setPagination] = useState({})
    const [message, setMessage] = useState("")
    const [pages, setPage] = useState(1)
    const [joinedGroups, setJoinedGroups] = useState([])
    const [createdGroups, setCreatedGroups] = useState([])
    const [totalJoined, setTotalJoined] = useState(1)
    const [totalCreated, setTotalCreated] = useState(1)
    const [modal, setModal] = useState({
        isOpen: false,
        type: null,   // leave | delete | otp | success | info
        group: null,
        message: ""
      })
      
      const [otpValue, setOtpValue] = useState("")
      const [loading, setLoading] = useState(false)

    const handleLeave = async (groupID) => {
        const confirmLeave = window.confirm("Are you sure you want to leave this group?")
        if (!confirmLeave) return
      
        try {
          const res = await LeaveGroupAPI(groupID)
      
          if (!res.ok) {
            const text = await res.text()
            throw new Error(text)
          }
      
          fetchGroups() // refresh list
        } catch (error) {
          console.log(error)
        }
      }

      const handleDeleteClick = async (groupID) => {
        const confirmDelete = window.confirm(
          "This will permanently delete the group and all posts. Continue?"
        )
        if (!confirmDelete) return
      
        try {
          // Request OTP
          const res = await RequestDeleteGroupAPI(groupID)
      
          if (!res.ok) {
            const text = await res.text()
            throw new Error(text)
          }
      
          alert("OTP sent to your email")
      
          const otp = window.prompt("Enter OTP to confirm deletion:")
          if (!otp) return
      
          // Call second function
          await handleConfirmDelete(groupID, otp)
      
        } catch (error) {
          console.log(error)
          alert(error.message)
        }
      }

      const handleConfirmDelete = async (groupID, otp) => {
        try {
          const res = await ConfirmDeleteGroupAPI(groupID, otp)
      
          if (!res.ok) {
            const text = await res.text()
            throw new Error(text)
          }
      
          alert("Group deleted successfully")
          fetchGroups()
      
        } catch (error) {
          console.log(error)
          alert(error.message)
        }
      }

    const fetchGroups = async () =>{
        const params = new URLSearchParams({
            page: pages,
            limit: 5,
        })

        try{
            const res = await MyGroupsAPI(params)
            if (!res.ok) {
                const text = await res.text()  
                throw new Error(text)
            }

            const data = await res.json()
            setJoinedGroups(data.groups)
            setCreatedGroups(data.created)
            setTotalJoined(data.pagination.total_joined)
            setTotalCreated(data.pagination.total_created)
            setPagination(data.pagination)
        }catch(error){
            console.log(error)
        }
    }

    useEffect(() =>{
        fetchGroups()
    },[pages])

  return (
    <>
    <div>My Groups</div>
    <h1>Joined Groups: {totalJoined}</h1>
    <ul>
        {joinedGroups.map((group)=>(
            <li key={group.id}>
            <strong>{group.name}</strong> ({group.handle}) - {group.country}
            {group.description} <br />
            {group.subscriber_count}
            <button
            onClick={() => handleLeave(group.id)}
            style={{
                background: "red",
                color: "white",
                padding: "6px 12px",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer"
            }}
>
  Leave
</button>
        </li>
        ))}
    </ul>

    <h1>Created & Joined Groups: {totalCreated}</h1>
    <ul>
            {createdGroups.map((group) => (
        <li key={group.id}>
            <strong>{group.name}</strong> ({group.handle}) - {group.country}
            <br />
            {group.description}
            <br />
            Subscribers: {group.subscriber_count}

            <button
            onClick={() => handleDeleteClick(group.id)}
            style={{
                backgroundColor: "#000",
                color: "#fff",
                padding: "6px 12px",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                marginLeft: "10px"
            }}
            >
            Delete Group
            </button>
        </li>
        ))}
    </ul>

    <div>
        {pagination.page > 1 && (
            <button onClick={() => setPage(pages - 1)}>Previous</button>
        )}

        {pagination.page < pagination.pages && (
            <button onClick={() => setPage(pages + 1)}>Next</button>
        )}
    </div>
    </>

  )
}

export default MyGroups