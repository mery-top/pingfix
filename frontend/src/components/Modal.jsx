import React from "react"
import SecureInput from "../wrapper/SecureInput"

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0,0,0,0.6)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000
}

const modalStyle = {
  background: "#1a1a1a",
  padding: "40px",
  borderRadius: "16px",
  width: "450px",
  position: "relative",
  textAlign: "center",
  border: "1px solid rgba(244, 125, 52, 0.3)",
  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
  color: "#fff"
}

const closeStyle = {
  position: "absolute",
  top: "15px",
  right: "20px",
  cursor: "pointer",
  fontSize: "24px",
  color: "#666",
  fontWeight: "300"
}

const inputStyle = {
  padding: "12px",
  width: "100%",
  marginTop: "20px",
  backgroundColor: "rgba(244, 125, 52, 0.05)",
  border: "1px solid rgba(244, 125, 52, 0.2)",
  borderRadius: "8px",
  color: "#fff",
  outline: "none"
}

function Modal({
  isOpen,
  title,
  message,
  showInput,
  inputValue,
  onInputChange,
  confirmText,
  onConfirm,
  onClose,
  loading
}) {
  if (!isOpen) return null

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <span style={closeStyle} onClick={onClose}>
          ×
        </span>

        <h2>{title}</h2>
        <p>{message}</p>

        {showInput && (
          <SecureInput
            value={inputValue}
            onChange={onInputChange}
            style={inputStyle}
            placeholder="Enter OTP"
          />
        )}

        <div style={{ marginTop: "30px" }}>
          <button
            className="ig-btn"
            onClick={onConfirm}
            disabled={loading}
            style={{ margin: 0, width: '100%' }}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Modal