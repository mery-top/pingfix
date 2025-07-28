import React, { useState } from 'react'

function GroupRegister() {
    const [groupName, setGroupName] = useState("");
    const [groupDes, setGroupDes] = useState("");
    const [authEmail, setAuthEmail] = useState("");
    const [otp, setOTP] = useState("");
    const [location, setLocation] = useState("");
    const [handle, setHandle] = useState("");

    //send data to backend as a payload on changing e 
  return (
    <>
    <h2>Register a Group</h2>
      <form onSubmit={handleSubmit}>
        <label>Group Name:</label><br />
        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        /><br /><br />

        <label>Group Description:</label><br />
        <input
          type="text"
          value={groupDes}
          onChange={(e) => setGroupDes(e.target.value)}
        /><br /><br />

        <label>Authorized Email:</label><br />
        <input
          type="email"
          value={authEmail}
          onChange={(e) => setAuthEmail(e.target.value)}
        /><br /><br />

        <label>OTP:</label><br />
        <input
          type="text"
          value={otp}
          onChange={(e) => setOTP(e.target.value)}
        /><br /><br />

        <label>Location:</label><br />
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        /><br /><br />

        <label>Handle (e.g., @mygroup):</label><br />
        <input
          type="text"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
        /><br /><br />

        <button type="submit">Register Group</button>
      </form>
    </>
  )
}

export default GroupRegister