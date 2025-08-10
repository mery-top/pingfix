import React, { useState } from 'react'
import { GroupRegisterAPI } from '../api/GroupAPI';
import { SendOTPAPI, VerifyOTPAPI } from '../api/AuthAPI';
import { useNavigate } from 'react-router-dom'
import SecureInput from '../wrapper/SecureInput';
import countries from '../assets/countries.json'

function GroupRegister() {
    const [groupName, setGroupName] = useState("");
    const [groupDes, setGroupDes] = useState("");
    const [authEmail, setAuthEmail] = useState("");
    const [otp, setOTP] = useState("");
    const [selectedCountry, setSelectedCountry] = useState("");
    const [selectedState, setSelectedState] = useState("");
    const [groupCity, setCity] = useState("");
    const [groupHandle, setHandle] = useState("");
    const [groupType, setGroupType] = useState("");
    const[message, setMessage] = useState("")
    const navigate = useNavigate()

    const handleGroupRegister = async() =>{

      if (requiresAuthorityEmail(groupType)) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(authEmail)) {
            setMessage("Invalid email format");
            return;
        }
      }

      const payload = {
        name: groupName,
        description: groupDes,
        handle: groupHandle,
        type: groupType,
        country: selectedCountry,
        state: selectedState,
        city: groupCity,
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

    const requiresAuthorityEmail = (type)=>{
      return ["Organization", "NGO"].includes(type)
    }


  return (
    <>
    <h2>Register a Group</h2>
        <label>Group Name:</label><br />
        <SecureInput value={groupName} onChange={setGroupName} allowSpace={true}/>
        <p>{groupName.length}/150 characters</p>
        <label>Group Description:</label><br />
        <SecureInput value={groupDes} onChange={setGroupDes} allowSpace={true} maxLength={2000}/>
        <p>{groupDes.length}/2000 characters</p>

        <label htmlFor="">Group Type:</label>
        <select name="" value={groupType} onChange={(e)=> setGroupType(e.target.value)}>
              <option value="">Select Type</option>
                <option value="Public">Public</option>
                <option value="Local">Local</option>
                <option value="Organization">Organization</option>
                <option value="NGO">NGO</option>
        </select>
    <br />
        {requiresAuthorityEmail(groupType) && (
          <div>
            <label>Authorized Email:</label><br />
            <input
              type="email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
            />
            <button onClick={handleSendOTP}>SendOTP</button>
            <p>{message}</p>

            <label>OTP:</label><br />
            <SecureInput value={otp} onChange={setOTP} />
            <p>{message}</p>

            <button onClick={handleVerifyOTP}>VerifyOTP</button>
          </div>
        )}
        
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
 

        <label>Handle (e.g., @mygroup):</label><br />
        <SecureInput value={groupHandle} onChange={setHandle} />
    

        <button type="submit" onClick={handleGroupRegister}>Register Group</button>
        <p>{message}</p>
    </>
  )
}

export default GroupRegister