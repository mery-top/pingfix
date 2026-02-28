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
      const openLeaveModal = (group) => {
        setModal({
          isOpen: true,
          type: "leave",
          group
        })
      }

      const openDeleteModal = (group) => {
        setModal({
          isOpen: true,
          type: "delete",
          group
        })
      }

      const confirmLeave = async () => {
        setLoading(true)
      
        try {
          const res = await LeaveGroupAPI(modal.group.id)
      
          if (!res.ok) {
            const text = await res.text()
            throw new Error(text)
          }
      
          fetchGroups()
      
          setModal({
            isOpen: true,
            type: "success",
            message: "You left the group successfully."
          })
      
        } catch (error) {
          setModal({
            isOpen: true,
            type: "info",
            message: error.message
          })
        }
      
        setLoading(false)
      }

      const confirmDeleteRequest = async () => {
        setLoading(true)
      
        try {
          const res = await RequestDeleteGroupAPI(modal.group.id)
      
          if (!res.ok) {
            const text = await res.text()
            throw new Error(text)
          }
      
          setModal({
            isOpen: true,
            type: "otp",
            group: modal.group
          })
      
        } catch (error) {
          setModal({
            isOpen: true,
            type: "info",
            message: error.message
          })
        }
      
        setLoading(false)
      }

      const confirmOTPDelete = async () => {
        setLoading(true)
      
        try {
          const res = await ConfirmDeleteGroupAPI(
            modal.group.id,
            otpValue
          )
      
          if (!res.ok) {
            const text = await res.text()
            throw new Error(text)
          }
      
          fetchGroups()
      
          setModal({
            isOpen: true,
            type: "success",
            message: "Group deleted successfully."
          })
      
          setOtpValue("")
      
        } catch (error) {
          setModal({
            isOpen: true,
            type: "info",
            message: error.message
          })
        }
      
        setLoading(false)
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
            <button onClick={() => openLeaveModal(group)}>
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

            <button onClick={() => openDeleteModal(group)}>
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

    <Modal
  isOpen={modal.isOpen}
  title={
    modal.type === "leave"
      ? "Leave Group"
      : modal.type === "delete"
      ? "Delete Group"
      : modal.type === "otp"
      ? "OTP Verification"
      : modal.type === "success"
      ? "Success"
      : "Message"
  }
  message={
    modal.type === "leave"
      ? `Are you sure you want to leave "${modal.group?.name}"?`
      : modal.type === "delete"
      ? `This will permanently delete "${modal.group?.name}".`
      : modal.type === "otp"
      ? "Enter the OTP sent to your email."
      : modal.message
  }
  showInput={modal.type === "otp"}
  inputValue={otpValue}
  onInputChange={setOtpValue}
  confirmText={
    modal.type === "leave"
      ? "Confirm"
      : modal.type === "delete"
      ? "Send OTP"
      : modal.type === "otp"
      ? "Confirm Delete"
      : "OK"
  }
  loading={loading}
  onConfirm={() => {
    if (modal.type === "leave") confirmLeave()
    if (modal.type === "delete") confirmDeleteRequest()
    if (modal.type === "otp") confirmOTPDelete()
    if (modal.type === "success" || modal.type === "info")
      setModal({ isOpen: false })
  }}
  onClose={() =>
    setModal({ isOpen: false, type: null, group: null })
  }
/>
    </>

  )
}

export default MyGroups