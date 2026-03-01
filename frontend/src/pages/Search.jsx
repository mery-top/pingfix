import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import SecureInput from '../wrapper/SecureInput';
import { JoinGroupAPI, SearchGroupAPI } from '../api/GroupAPI';
import countries from '../assets/countries.json'

function Search() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([])
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [groupCity, setCity] = useState("");
  const [groupHandle, setHandle] = useState("");
  const [pagination, setPagination] = useState({})
  const [message, setMessage] = useState("")
  const [pages, setPage] = useState(1)

  const fetchGroups = async () => {
    const params = new URLSearchParams({
      handle: groupHandle,
      country: selectedCountry,
      state: selectedState,
      city: groupCity,
      page: pages,
      limit: 5
    })

    const res = await SearchGroupAPI(params)
    const data = await res.json()
    setGroups(data.data)
    setPagination(data.pagination)
  }

  useEffect(() => {
    fetchGroups()
  }, [pages])

  const handleJoinGroup = async (id) => {
    try {
      const res = await JoinGroupAPI(id)
      if (res.status === 200) {
        // Update only the joined group
        setGroups(prevGroups =>
          prevGroups.map(g => g.ID === id ? { ...g, isJoined: true } : g)
        );
        setMessage(""); // optional, clear message
      } else {
        setMessage("Fail to Join");
      }
    } catch (error) {
      setMessage("Fail to Join");
      console.error("Fail to Join error", error);
    }
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "20px" }}>
        <button className="ig-btn" style={{ width: 'auto', margin: 0, padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid #F47D34', color: '#F47D34' }} onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h2 style={{ margin: 0 }}>Search Groups</h2>
        <div style={{ width: '80px' }}></div> {/* Spacer for centering */}
      </div>

      <div className="tg-card" style={{ display: "flex", flexWrap: "wrap", gap: "15px", alignItems: "flex-end", marginBottom: "30px", marginTop: "20px" }}>
        <div style={{ flex: "1 1 200px" }}>
          <label style={{ color: "#aaa", fontSize: "0.9em", marginBottom: "5px", display: "block" }}>Search by Handle</label>
          <SecureInput value={groupHandle} onChange={setHandle} allowSpace={true} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", color: "#fff" }} />
        </div>

        <div style={{ flex: "1 1 200px" }}>
          <label style={{ color: "#aaa", fontSize: "0.9em", marginBottom: "5px", display: "block" }}>Country</label>
          <select
            value={selectedCountry}
            onChange={(e) => {
              setSelectedCountry(e.target.value);
              setSelectedState("");
            }}
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", color: "#fff" }}
          >
            <option value="">Select a country</option>
            {countries.map((country) => (
              <option key={country.code2} value={country.name}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: "1 1 200px" }}>
          <label style={{ color: "#aaa", fontSize: "0.9em", marginBottom: "5px", display: "block" }}>State</label>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            disabled={!selectedCountry}
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", color: "#fff" }}
          >
            <option value="">Select a state</option>
            {countries
              .find((c) => c.name === selectedCountry)
              ?.states?.map((state) => (
                <option key={state.code} value={state.name}>
                  {state.name}
                </option>
              ))}
          </select>
        </div>

        <div style={{ flex: "1 1 200px" }}>
          <label style={{ color: "#aaa", fontSize: "0.9em", marginBottom: "5px", display: "block" }}>City</label>
          <SecureInput value={groupCity} onChange={setCity} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", color: "#fff" }} />
        </div>

        <div style={{ flex: "1 1 100%" }}>
          <button className="ig-btn" style={{ padding: "10px", marginTop: "10px" }} onClick={() => { setPage(1); fetchGroups(); }}>Search</button>
        </div>
      </div>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {groups.map((group) => (
          <li key={group.ID} className="tg-list-item">
            <div className="tg-list-item-left">
              <div className="tg-avatar">
                {group.Name ? group.Name.charAt(0).toUpperCase() : "G"}
              </div>
              <div className="tg-list-item-info">
                <h4>{group.Name} <span style={{ fontSize: "0.8em", color: "#aaa", fontWeight: "normal" }}>({group.Handle})</span></h4>
                <p>{group.Description}</p>
                <p style={{ marginTop: "4px", fontSize: "0.8em", color: "#F47D34" }}>{group.Type} • {group.Country} • {group.SubscriberCount} subscribers</p>
              </div>
            </div>
            <div style={{ textAlign: "right", minWidth: "120px" }}>
              {group.isJoined ? (
                <button disabled style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "none", color: "#aaa", padding: "8px 16px", borderRadius: "20px", cursor: "not-allowed", marginBottom: "5px", width: "100%" }}>✅ Joined</button>
              ) : (
                <button onClick={() => handleJoinGroup(group.ID)} style={{ backgroundColor: "#F47D34", border: "none", color: "#350E25", padding: "8px 16px", borderRadius: "20px", cursor: "pointer", fontWeight: "bold", marginBottom: "5px", width: "100%" }}>JOIN</button>
              )}
              <button
                onClick={() => navigate(`/group/${group.ID}`)}
                style={{ backgroundColor: "transparent", border: "1px solid #F47D34", color: "#F47D34", padding: "8px 16px", borderRadius: "20px", cursor: "pointer", width: "100%" }}>
                View Group
              </button>
              {message && <p style={{ color: "#F47D34", fontSize: "0.8em", marginTop: "5px" }}>{message}</p>}
            </div>
          </li>
        ))}
      </ul>

      {groups.length > 0 && (
        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          {pagination.page > 1 && (
            <button style={{ padding: "0.4em 1em" }} onClick={() => setPage(pages - 1)}>Previous</button>
          )}
          {pagination.page < pagination.pages && (
            <button style={{ padding: "0.4em 1em" }} onClick={() => setPage(pages + 1)}>Next</button>
          )}
        </div>
      )}
    </div>
  )
}

export default Search