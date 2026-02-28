import React, { useEffect, useState } from 'react'
import SecureInput from '../wrapper/SecureInput';
import { JoinGroupAPI, SearchGroupAPI } from '../api/GroupAPI';
import countries from '../assets/countries.json'

function Search() {
    const [groups, setGroups] = useState([])
    const [selectedCountry, setSelectedCountry] = useState("");
    const [selectedState, setSelectedState] = useState("");
    const [groupCity, setCity] = useState("");
    const [groupHandle, setHandle] = useState("");
    const [pagination, setPagination] = useState({})
    const [message, setMessage] = useState("")
    const [pages, setPage] = useState(1)

    const fetchGroups = async() =>{
        const params = new URLSearchParams({
            handle:groupHandle, 
            country: selectedCountry, 
            state: selectedState, 
            city: groupCity,
            page: pages, 
            limit:5
        })

        const res = await SearchGroupAPI(params)
        const data = await res.json()
        setGroups(data.data)
        setPagination(data.pagination)
    }

    useEffect(() =>{
        fetchGroups()
    },[pages])

    const handleJoinGroup = async(id) => {
      try {
        const res = await JoinGroupAPI(id)
        if(res.status === 200){
          // Update only the joined group
          setGroups(prevGroups =>
            prevGroups.map(g => g.ID === id ? { ...g, isJoined: true } : g)
          );
          setMessage(""); // optional, clear message
        } else {
          setMessage("Fail to Join");
        }
      } catch(error) {
        setMessage("Fail to Join");
        console.error("Fail to Join error", error);
      }
    }

  return (
    <>
    <label>Search by Handles</label><br />
    <SecureInput value={groupHandle} onChange={setHandle} allowSpace={true}/>
    <label>Country:</label><br />
        <select
          value={selectedCountry}
          onChange={(e) => {
            setSelectedCountry(e.target.value);
            setSelectedState("");
          }}
        >
          <option value="">Select a country</option>
          {countries.map((country) => (
            <option key={country.code2} value={country.name}>
              {country.name}
            </option>
          ))}
        </select>

        <br /><br />

        <label>State:</label><br />
        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          disabled={!selectedCountry}
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
        <br />
        <label>City:</label><br />
        <SecureInput value={groupCity} onChange={setCity} />


        <button onClick={()=> {setPage(1); fetchGroups();}}>Search</button>

        <ul>
            {groups.map((group) => (
                <li key={group.ID}>
                    <strong>{group.Name}</strong> ({group.Handle}) - {group.Country}
                    {group.Description} <br></br> {group.Type}
                    {group.SubscriberCount}
                    {group.isJoined ? (
                      <button disabled>✅ Joined</button>
                    ) : (
                      <button onClick={() => handleJoinGroup(group.ID)}>JOIN</button>
                    )}
                    <p>{message}</p>
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

export default Search