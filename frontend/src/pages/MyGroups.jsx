import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { MyGroupsAPI, LeaveGroupAPI, RequestDeleteGroupAPI, ConfirmDeleteGroupAPI } from '../api/GroupAPI'
import Modal from "../components/Modal"

function MyGroups() {
  const navigate = useNavigate();
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



  const fetchGroups = async () => {
    const params = new URLSearchParams({
      page: pages,
      limit: 5,
    })

    try {
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
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    fetchGroups()
  }, [pages])

  return (
    <div className="container">
      <div className="top-nav-bar">
        <button className="btn-nav" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h2>My Groups</h2>
      </div>

      <h3 style={{ color: "#F47D34", marginTop: "30px", marginBottom: "15px" }}>Joined Groups: {totalJoined}</h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {joinedGroups.map((group) => (
          <li key={group.id} className="tg-list-item">
            <div className="tg-list-item-left">
              <div className="tg-avatar">
                {group.name ? group.name.charAt(0).toUpperCase() : "G"}
              </div>
              <div className="tg-list-item-info">
                <h4>{group.name} <span style={{ fontSize: "0.8em", color: "#aaa", fontWeight: "normal" }}>({group.handle})</span></h4>
                <p>{group.description}</p>
                <p style={{ marginTop: "4px", fontSize: "0.8em", color: "#F47D34" }}>{group.country} • {group.subscriber_count} subscribers</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => navigate(`/group/${group.id}`)}
                style={{ backgroundColor: "#F47D34", border: "none", color: "#350E25", padding: "8px 16px", borderRadius: "20px", whiteSpace: "nowrap", cursor: "pointer", fontWeight: "bold" }}>
                View Group
              </button>
              <button style={{ backgroundColor: "transparent", border: "1px solid #F47D34", color: "#F47D34", padding: "8px 16px", borderRadius: "20px", whiteSpace: "nowrap", cursor: "pointer" }} onClick={() => openLeaveModal(group)}>
                Leave
              </button>
            </div>
          </li>
        ))}
      </ul>

      <h3 style={{ color: "#F47D34", marginTop: "40px", marginBottom: "15px" }}>Created & Joined Groups: {totalCreated}</h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {createdGroups.map((group) => (
          <li key={group.id} className="tg-list-item">
            <div className="tg-list-item-left">
              <div className="tg-avatar">
                {group.name ? group.name.charAt(0).toUpperCase() : "G"}
              </div>
              <div className="tg-list-item-info">
                <h4>{group.name} <span style={{ fontSize: "0.8em", color: "#aaa", fontWeight: "normal" }}>({group.handle})</span></h4>
                <p>{group.description}</p>
                <p style={{ marginTop: "4px", fontSize: "0.8em", color: "#F47D34" }}>{group.country} • {group.subscriber_count} subscribers</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => navigate(`/group/${group.id}`)}
                style={{ backgroundColor: "#F47D34", border: "none", color: "#350E25", padding: "8px 16px", borderRadius: "20px", whiteSpace: "nowrap", cursor: "pointer", fontWeight: "bold" }}>
                View Group
              </button>
              <button style={{ backgroundColor: "transparent", border: "1px solid #ff4d4f", color: "#ff4d4f", padding: "8px 16px", borderRadius: "20px", whiteSpace: "nowrap", cursor: "pointer" }} onClick={() => openDeleteModal(group)}>
                Delete Group
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="pagination-bar">
        {pagination.page > 1 && (
          <button className="btn-nav" onClick={() => setPage(pages - 1)}>Previous</button>
        )}

        {pagination.page < pagination.pages && (
          <button className="btn-nav" onClick={() => setPage(pages + 1)}>Next</button>
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
    </div>

  )
}

export default MyGroups