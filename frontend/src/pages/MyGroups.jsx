import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  MyGroupsAPI,
  LeaveGroupAPI,
  RequestDeleteGroupAPI,
  ConfirmDeleteGroupAPI
} from '../api/GroupAPI'
import Modal from "../components/Modal"

function MyGroups() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [modal, setModal] = useState({ isOpen: false, type: null, group: null })
  const [otpValue, setOtpValue] = useState("")

  // 🔥 FETCH GROUPS WITH CACHE
  const { data, isLoading } = useQuery({
    queryKey: ['myGroups', page],
    queryFn: async () => {
      const params = new URLSearchParams({ page, limit: 5 })
      const res = await MyGroupsAPI(params)

      if (!res.ok) throw new Error(await res.text())

      return res.json()
    }
  })

  const createdGroups = data?.groups?.filter(g => g.is_creator) || []
  const joinedGroups = data?.groups?.filter(g => !g.is_creator) || []

  // 🔥 LEAVE GROUP (Optimistic)
  const leaveMutation = useMutation({
    mutationFn: (groupId) => LeaveGroupAPI(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries(['myGroups'])
      setModal({ isOpen: false })
    }
  })

  // 🔥 DELETE GROUP CONFIRM
  const deleteMutation = useMutation({
    mutationFn: ({ id, otp }) => ConfirmDeleteGroupAPI(id, otp),
    onSuccess: () => {
      queryClient.invalidateQueries(['myGroups'])
      setModal({ isOpen: false })
      setOtpValue("")
    }
  })

  if (isLoading) return <p style={{ padding: "20px" }}>Loading groups...</p>

  return (
    <div className="container">
      <div className="top-nav-bar">
        <button className="btn-nav" onClick={() => navigate(-1)}>← Back</button>
        <h2>My Groups</h2>
      </div>

      {/* JOINED */}
      <h3 style={{ color: "#F47D34", marginTop: 30 }}>
        Joined Groups: {data.pagination.total_joined}
      </h3>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {joinedGroups.map(group => (
          <li key={group.id} className="tg-list-item">
            <div>
              <h4>{group.name} ({group.handle})</h4>
              <p>{group.description}</p>
            </div>
            <div>
              <button onClick={() => navigate(`/group/${group.id}`)}>
                View
              </button>
              <button
                onClick={() =>
                  setModal({ isOpen: true, type: "leave", group })
                }
              >
                Leave
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* CREATED */}
      <h3 style={{ color: "#F47D34", marginTop: 40 }}>
        Created Groups: {data.pagination.total_created}
      </h3>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {createdGroups.map(group => (
          <li key={group.id} className="tg-list-item">
            <div>
              <h4>{group.name} ({group.handle})</h4>
              <p>{group.description}</p>
            </div>
            <div>
              <button onClick={() => navigate(`/group/${group.id}`)}>
                View
              </button>
              <button
                onClick={() =>
                  setModal({ isOpen: true, type: "otp", group })
                }
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* PAGINATION */}
      <div className="pagination-bar">
        {data.pagination.page > 1 && (
          <button onClick={() => setPage(prev => prev - 1)}>Previous</button>
        )}
        {data.pagination.page < data.pagination.pages && (
          <button onClick={() => setPage(prev => prev + 1)}>Next</button>
        )}
      </div>

      {/* MODAL */}
      <Modal
        isOpen={modal.isOpen}
        title="Confirm"
        message={
          modal.type === "leave"
            ? `Leave ${modal.group?.name}?`
            : "Enter OTP to delete group"
        }
        showInput={modal.type === "otp"}
        inputValue={otpValue}
        onInputChange={setOtpValue}
        confirmText="Confirm"
        onConfirm={() => {
          if (modal.type === "leave")
            leaveMutation.mutate(modal.group.id)

          if (modal.type === "otp")
            deleteMutation.mutate({
              id: modal.group.id,
              otp: otpValue
            })
        }}
        onClose={() => setModal({ isOpen: false })}
      />
    </div>
  )
}

export default MyGroups