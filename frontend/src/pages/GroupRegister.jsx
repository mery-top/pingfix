import React, { useState } from 'react'
import { GroupRegisterAPI } from '../api/GroupAPI';
import { SendOTPAPI, VerifyOTPAPI } from '../api/AuthAPI';
import { useNavigate } from 'react-router-dom'
import { sanitizeInput } from '../utils/sanitizer';
import countries from '../assets/countries.json'
import Modal from '../components/Modal';

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
  const [message, setMessage] = useState("")
  const [isSuccessModalOpen, setSuccessModalOpen] = useState(false);
  const navigate = useNavigate()

  const handleGroupRegister = async () => {
    // Basic required field validation
    if (!groupName.trim() || !groupDes.trim() || !groupType || !selectedCountry || !selectedState || !groupCity.trim() || !groupHandle.trim()) {
      setMessage("All fields are required");
      return;
    }

    if (requiresAuthorityEmail(groupType)) {
      if (!authEmail.trim()) {
        setMessage("Authorized Email is required for " + groupType);
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(authEmail)) {
        setMessage("Invalid email format");
        return;
      }
      // Note: Assuming OTP verification is required as well if authEmail is present
      if (!otp.trim()) {
        setMessage("OTP verification is required");
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
        setSuccessModalOpen(true);
        setMessage("");
      } else if (res.status === 409) {
        setMessage("Handle already exists. Try another one.");
      } else {
        setMessage(message || "Registration failed");
      }
    } catch (error) {
      console.error("Register error", error);
      setMessage("Something went wrong");
    }

  }
  const handleSendOTP = async () => {
    if (!authEmail.trim()) {
      setMessage("Enter Authorized Email first");
      return;
    }
    try {
      const res = await SendOTPAPI(authEmail)
      if (res.status === 200) {
        setMessage("Sent OTP")
      } else {
        setMessage("Enter Correct Details, Register Failed")
      }
    } catch (error) {
      setMessage("OTP Not Sent")
      console.error("Register error", error)
    }
  }

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      setMessage("Enter OTP first");
      return;
    }
    try {
      const res = await VerifyOTPAPI(authEmail, otp)
      if (res.status === 200) {
        setMessage("OTP Verified Success")
      } else {
        setMessage("Enter Correct Details, Register Failed")
      }
    } catch (error) {
      setMessage("OTP Not Verified")
      console.error("Register error", error)
    }
  }

  const requiresAuthorityEmail = (type) => {
    return ["Organization", "NGO"].includes(type)
  }


  return (
    <div className="container" style={{ maxWidth: '700px', margin: '40px auto' }}>
      <div className="top-nav-bar">
        <button className="btn-nav" onClick={() => navigate(-1)}>
          ←
        </button>
      </div>
      <div className="tg-card">
        <h2 style={{ marginBottom: '25px', color: '#fff' }}>Register a Group</h2>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ color: '#aaa', fontSize: '0.9em', marginBottom: '5px', display: 'block' }}>Group Name:</label>
          <input
            type="text"
            className="ig-input"
            value={groupName}
            onChange={e => setGroupName(sanitizeInput(e.target.value, { allowSpace: true }))}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', marginBottom: 0 }}
          />
          <p style={{ fontSize: '0.8em', color: '#666', marginTop: '5px' }}>{groupName.length}/150 characters</p>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ color: '#aaa', fontSize: '0.9em', marginBottom: '5px', display: 'block' }}>Group Description:</label>
          <textarea
            value={groupDes}
            onChange={e => setGroupDes(sanitizeInput(e.target.value, { allowSpace: true, maxLength: 2000 }))}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', minHeight: '100px', fontFamily: 'inherit' }}
          />
          <p style={{ fontSize: '0.8em', color: '#666', marginTop: '5px' }}>{groupDes.length}/2000 characters</p>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ color: '#aaa', fontSize: '0.9em', marginBottom: '5px', display: 'block' }}>Group Type:</label>
          <select value={groupType} onChange={(e) => setGroupType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff' }}>
            <option value="">Select Type</option>
            <option value="Public">Public</option>
            <option value="Local">Local</option>
            <option value="Organization">Organization</option>
            <option value="NGO">NGO</option>
          </select>
        </div>

        {requiresAuthorityEmail(groupType) && (
          <div style={{ marginBottom: '15px', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(244,125,52,0.2)' }}>
            <label style={{ color: '#aaa', fontSize: '0.9em', marginBottom: '5px', display: 'block' }}>Authorized Email:</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="email"
                className="ig-input"
                placeholder='Authorized Email'
                value={authEmail}
                onChange={e => setAuthEmail(sanitizeInput(e.target.value))}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', marginBottom: 0 }}
              />
              <button className="btn-nav" style={{ minWidth: '100px' }} onClick={handleSendOTP}>Send OTP</button>
            </div>

            <label style={{ color: '#aaa', fontSize: '0.9em', marginBottom: '5px', marginTop: '15px', display: 'block' }}>OTP:</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                className="ig-input"
                value={otp}
                onChange={e => setOTP(sanitizeInput(e.target.value))}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', marginBottom: 0 }}
              />
              <button className="btn-nav" style={{ minWidth: '100px' }} onClick={handleVerifyOTP}>Verify OTP</button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: '#aaa', fontSize: '0.9em', marginBottom: '5px', display: 'block' }}>Country:</label>
            <select
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                setSelectedState("");
              }}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff' }}
            >
              <option value="">Select a country</option>
              {countries.map((country) => (
                <option key={country.code2} value={country.name}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ color: '#aaa', fontSize: '0.9em', marginBottom: '5px', display: 'block' }}>State:</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              disabled={!selectedCountry}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff' }}
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
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ color: '#aaa', fontSize: '0.9em', marginBottom: '5px', display: 'block' }}>City:</label>
          <input
            type="text"
            className="ig-input"
            value={groupCity}
            onChange={e => setCity(sanitizeInput(e.target.value, { allowSpace: true }))}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', marginBottom: 0 }}
          />
        </div>

        <div style={{ marginBottom: '25px' }}>
          <label style={{ color: '#aaa', fontSize: '0.9em', marginBottom: '5px', display: 'block' }}>Handle (e.g., @mygroup):</label>
          <input
            type="text"
            className="ig-input"
            value={groupHandle}
            onChange={e => setHandle(sanitizeInput(e.target.value))}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', marginBottom: 0 }}
          />
        </div>

        <button className="ig-btn" type="submit" onClick={handleGroupRegister}>Register Group</button>
        {message && <p style={{ color: '#F47D34', textAlign: 'center', marginTop: '15px' }}>{message}</p>}
      </div>

      <Modal
        isOpen={isSuccessModalOpen}
        title="Welcome!"
        message="Your group has been registered successfully."
        confirmText="Go to Dashboard"
        onConfirm={() => navigate("/login")}
        onClose={() => navigate("/login")}
      />
    </div>
  )
}

export default GroupRegister