import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MyGroupsAPI, LeaveGroupAPI } from '../api/GroupAPI'

function MyGroups() {
    const [pagination, setPagination] = useState({})
    const [message, setMessage] = useState("")
    const [pages, setPage] = useState(1)
    const [joinedGroups, setJoinedGroups] = useState([])
    const [createdGroups, setCreatedGroups] = useState([])
    const [totalJoined, setTotalJoined] = useState(1)
    const [totalCreated, setTotalCreated] = useState(1)

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
        {createdGroups.map((group)=>(
            <li key={group.id}>
            <strong>{group.name}</strong> ({group.handle}) - {group.country}
            {group.description} <br />
            {group.subscriber_count}

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