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

  // ===========================
  // 🔥 FETCH GROUPS (Cached)
  // ===========================
  const { data, isLoading, isError } = useQuery({
    queryKey: ['myGroups', page],
    queryFn: async () => {
      const params = new URLSearchParams({ page, limit: 5 })
      const res = await MyGroupsAPI(params)
      if (!res.ok) throw new Error(await res.text())
      return res.json()
    },
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })

  // ===========================
  // LEAVE GROUP (Optimistic)
  // ===========================
  const leaveMutation = useMutation({
    mutationFn: (groupId) => LeaveGroupAPI(groupId),

    onMutate: async (groupId) => {
      await queryClient.cancelQueries(['myGroups'])

      const previousData = queryClient.getQueryData(['myGroups', page])

      queryClient.setQueryData(['myGroups', page], old => {
        if (!old) return old
        return {
          ...old,
          groups: old.groups.filter(g => g.id !== groupId),
          pagination: {
            ...old.pagination,
            total_joined: Math.max(old.pagination.total_joined - 1, 0)
          }
        }
      })

      return { previousData }
    },

    onError: (err, groupId, context) => {
      queryClient.setQueryData(['myGroups', page], context.previousData)
    },

    onSettled: () => {
      queryClient.invalidateQueries(['myGroups'])
      setModal({ isOpen: false, type: null, group: null })
    }
  })

  // ===========================
  // REQUEST DELETE OTP
  // ===========================
  const requestDeleteMutation = useMutation({
    mutationFn: (groupId) => RequestDeleteGroupAPI(groupId),
    onSuccess: () => {
      setModal(prev => ({ ...prev, type: "otp" }))
    }
  })

  // ===========================
  // CONFIRM DELETE
  // ===========================
  const confirmDeleteMutation = useMutation({
    mutationFn: ({ id, otp }) => ConfirmDeleteGroupAPI(id, otp),

    onMutate: async ({ id }) => {
      await queryClient.cancelQueries(['myGroups'])

      const previousData = queryClient.getQueryData(['myGroups', page])

      queryClient.setQueryData(['myGroups', page], old => {
        if (!old) return old
        return {
          ...old,
          groups: old.groups.filter(g => g.id !== id),
          pagination: {
            ...old.pagination,
            total_created: Math.max(old.pagination.total_created - 1, 0)
          }
        }
      })

      return { previousData }
    },

    onError: (err, variables, context) => {
      queryClient.setQueryData(['myGroups', page], context.previousData)
    },

    onSettled: () => {
      queryClient.invalidateQueries(['myGroups'])
      setModal({ isOpen: false, type: null, group: null })
      setOtpValue("")
    }
  })

  if (isLoading) return <p style={{ padding: 20 }}>Loading groups...</p>
  if (isError) return <p style={{ padding: 20 }}>Failed to load groups</p>

  const groups = data?.groups || []
  const pagination = data?.pagination || {}

  return (
    <div className="container">

      {/* Top Bar */}
      <div className="top-nav-bar">
        <button className="btn-nav" onClick={() => navigate(-1)}>← Back</button>
        <h2>My Groups</h2>
      </div>

      {/* Stats */}
      <div style={{ marginTop: 20, display: "flex", justifyContent: "center", gap: "20px" }}>
        <h4 style={{ margin: 0 }}>Created: {pagination.total_created}</h4>
        <h4 style={{ margin: 0 }}>Joined: {pagination.total_joined}</h4>
      </div>

      {/* Unified List */}
      <ul style={{ listStyle: "none", padding: 0, marginTop: 20 }}>
        {groups.map(group => (
          <li key={group.id} className="tg-list-item">
            <div>
              <h4>{group.name} ({group.handle})</h4>
              <p>{group.description}</p>
              <small>
                {group.is_creator ? "Creator" : "Member"} • {group.subscriber_count} members
              </small>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button className="ig-btn" style={{ margin: 0 }} onClick={() => navigate(`/group/${group.id}`)}>
                View
              </button>

              {group.is_creator ? (
                <button
                  className="ig-btn-outline" style={{ margin: 0 }}
                  onClick={() => {
                    setModal({ isOpen: true, type: "request-delete", group })
                    requestDeleteMutation.mutate(group.id)
                  }}
                >
                  Delete
                </button>
              ) : (
                <button
                  className="ig-btn-outline" style={{ margin: 0 }}
                  onClick={() =>
                    setModal({ isOpen: true, type: "leave", group })
                  }
                >
                  Leave
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Pagination */}
      <div className="pagination-bar" style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
        {pagination.page > 1 && (
          <button className="btn-nav" onClick={() => setPage(p => p - 1)}>Previous</button>
        )}
        {pagination.page < pagination.pages && (
          <button className="btn-nav" onClick={() => setPage(p => p + 1)}>Next</button>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modal.isOpen}
        title="Confirm"
        message={
          modal.type === "leave"
            ? `Leave ${modal.group?.name}?`
            : modal.type === "otp"
              ? "Enter OTP to confirm deletion"
              : "Processing..."
        }
        showInput={modal.type === "otp"}
        inputValue={otpValue}
        onInputChange={setOtpValue}
        confirmText="Confirm"
        onConfirm={() => {
          if (modal.type === "leave") {
            leaveMutation.mutate(modal.group.id)
          }

          if (modal.type === "otp") {
            confirmDeleteMutation.mutate({
              id: modal.group.id,
              otp: otpValue
            })
          }
        }}
        onClose={() =>
          setModal({ isOpen: false, type: null, group: null })
        }
      />
    </div>
  )
}

export default MyGroups