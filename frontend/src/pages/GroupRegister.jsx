import React, { useState } from 'react'
import { GroupRegisterAPI } from '../api/GroupAPI';
import { SendOTPAPI, VerifyOTPAPI } from '../api/AuthAPI';

function GroupRegister() {
    const [groupName, setGroupName] = useState("");
    const [groupDes, setGroupDes] = useState("");
    const [authEmail, setAuthEmail] = useState("");
    const [otp, setOTP] = useState("");
    const [location, setLocation] = useState("");
    const [handle, setHandle] = useState("");
    const[message, setMessage] = useState("")

    const handleSubmit = async(e) =>{
      e.preventDefault();

      const payload = {
        name: groupName,
        description: groupDes,
        handle: handle,
        location: location,
        authorityEmail: authEmail,
      };

          try {
            const res = await GroupRegisterAPI(payload);
            const message = await res.text();
        
            if (res.status === 201) {
              setMessage("Registered Successfully");
              // navigate("/login");
            } else {
              setMessage(message || "Registration failed");
            }
          } catch (error) {
            console.error("Register error", error);
            setMessage("Something went wrong");
          }

    }
    const handleSendOTP = async() =>{
      try{
        const res = await SendOTPAPI(authEmail)
        if(res.status === 200){
          setMessage("Sent OTP")
        }else{
              setMessage("Enter Correct Details, Register Failed")
        }
      }catch(error){
          setMessage("OTP Not Sent")
          console.error("Register error", error)
      }
    }
  
    const handleVerifyOTP = async() =>{
      try{
        const res = await VerifyOTPAPI(authEmail,otp)
        if(res.status === 200){
          setMessage("OTP Verified Success")
        }else{
              setMessage("Enter Correct Details, Register Failed")
        }
      }catch(error){
          setMessage("OTP Not Verified")
          console.error("Register error", error)
      }
    }
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

        <button onClick={handleSendOTP}>SendOTP</button>
        <button onClick={handleVerifyOTP}>SendOTP</button>

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

        <button type="submit" onClick={handleSubmit}>Register Group</button>
      </form>
    </>
  )
}

export default GroupRegister