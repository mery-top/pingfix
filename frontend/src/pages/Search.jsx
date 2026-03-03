import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import SecureInput from '../wrapper/SecureInput'
import { JoinGroupAPI, SearchGroupAPI } from '../api/GroupAPI'
import countries from '../assets/countries.json'

function Search() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [selectedCountry, setSelectedCountry] = useState("")
  const [selectedState, setSelectedState] = useState("")
  const [groupCity, setCity] = useState("")
  const [groupHandle, setHandle] = useState("")
  const [page, setPage] = useState(1)

  // 🔥 Build query params (memoized)
  const queryParams = useMemo(() => ({
    handle: groupHandle,
    country: selectedCountry,
    state: selectedState,
    city: groupCity,
    page,
    limit: 5
  }), [groupHandle, selectedCountry, selectedState, groupCity, page])

  // 🚀 Search Query (cached & optimized)
  const { data, isLoading, isError } = useQuery({
    queryKey: ['groups', queryParams],
    queryFn: async () => {
      const params = new URLSearchParams(queryParams)
      const res = await SearchGroupAPI(params)
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
    keepPreviousData: true, // smooth pagination
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  })

  // 🚀 Join Mutation with Optimistic Update
  const joinMutation = useMutation({
    mutationFn: (id) => JoinGroupAPI(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries(['groups'])

      const previousData = queryClient.getQueryData(['groups', queryParams])

      queryClient.setQueryData(['groups', queryParams], old => {
        if (!old) return old
        return {
          ...old,
          data: old.data.map(g =>
            g.ID === id ? { ...g, isJoined: true } : g
          )
        }
      })

      return { previousData }
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(['groups', queryParams], context.previousData)
    },
    onSettled: () => {
      queryClient.invalidateQueries(['groups'])
    }
  })

  const groups = data?.data || []
  const pagination = data?.pagination || {}

  return (
    <div className="container">
      <div className="top-nav-bar">
        <button className="btn-nav" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h2>Search Groups</h2>
      </div>

      {/* 🔍 Filters */}
      <div className="tg-card" style={{ display: "flex", flexWrap: "wrap", gap: "15px", marginTop: "20px" }}>

        <SecureInput value={groupHandle} onChange={setHandle} placeholder="Search by Handle" />

        <select value={selectedCountry}
          onChange={(e) => {
            setSelectedCountry(e.target.value)
            setSelectedState("")
          }}>
          <option value="">Country</option>
          {countries.map((c) => (
            <option key={c.code2} value={c.name}>{c.name}</option>
          ))}
        </select>

        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          disabled={!selectedCountry}
        >
          <option value="">State</option>
          {countries
            .find((c) => c.name === selectedCountry)
            ?.states?.map((s) => (
              <option key={s.code} value={s.name}>{s.name}</option>
            ))}
        </select>

        <SecureInput value={groupCity} onChange={setCity} placeholder="City" />

        <button onClick={() => setPage(1)}>
          Search
        </button>
      </div>

      {/* 📦 Results */}
      {isLoading && <p>Loading...</p>}
      {isError && <p>Error loading groups</p>}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {groups.map((group) => (
          <li key={group.ID} className="tg-list-item">
            <div>
              <h4>
                {group.Name} ({group.Handle})
              </h4>
              <p>{group.Description}</p>
              <p>
                {group.Type} • {group.Country} • {group.SubscriberCount} subscribers
              </p>
            </div>

            <div>
              {group.isJoined ? (
                <button disabled>Joined</button>
              ) : (
                <button onClick={() => joinMutation.mutate(group.ID)}>
                  JOIN
                </button>
              )}

              <button onClick={() => navigate(`/group/${group.ID}`)}>
                View
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* 📄 Pagination */}
      {groups.length > 0 && (
        <div className="pagination-bar">
          {pagination.page > 1 && (
            <button onClick={() => setPage(p => p - 1)}>
              Previous
            </button>
          )}
          {pagination.page < pagination.pages && (
            <button onClick={() => setPage(p => p + 1)}>
              Next
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default Search