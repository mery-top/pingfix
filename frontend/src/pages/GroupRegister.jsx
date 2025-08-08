import React, { useState } from 'react'
import { GroupRegisterAPI } from '../api/GroupAPI';
import { SendOTPAPI, VerifyOTPAPI } from '../api/AuthAPI';
import { useNavigate } from 'react-router-dom'

function GroupRegister() {
    const [groupName, setGroupName] = useState("");
    const [groupDes, setGroupDes] = useState("");
    const [authEmail, setAuthEmail] = useState("");
    const [otp, setOTP] = useState("");
    const [groupLocation, setLocation] = useState("");
    const [groupHandle, setHandle] = useState("");
    const[message, setMessage] = useState("")
    const navigate = useNavigate()

    const handleGroupRegister = async() =>{

      const payload = {
        name: groupName,
        description: groupDes,
        handle: groupHandle,
        location: groupLocation,
        authorityEmail: authEmail,
      };

          try {
            const res = await GroupRegisterAPI(payload);
            const message = await res.text();
        
            if (res.status === 201) {
              setMessage("Registered Successfully");
              navigate("/login");
            }if (res.status === 409) {
              setMessage("Handle already exists. Try another one.");
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
        <button onClick={handleSendOTP}>SendOTP</button>
        <p>{message}</p>

        <label>OTP:</label><br />
        <input
          type="text"
          value={otp}
          onChange={(e) => setOTP(e.target.value)}
        /><br /><br />
        <p>{message}</p>

        <button onClick={handleVerifyOTP}>VerifyOTP</button>

        <label>Location:</label><br />
        <input
          type="text"
          value={groupLocation}
          onChange={(e) => setLocation(e.target.value)}
        /><br /><br />

        <label>Handle (e.g., @mygroup):</label><br />
        <input
          type="text"
          value={groupHandle}
          onChange={(e) => setHandle(e.target.value)}
        /><br /><br />

        <button type="submit" onClick={handleGroupRegister}>Register Group</button>
        <p>{message}</p>
    </>
  )
}

export default GroupRegister