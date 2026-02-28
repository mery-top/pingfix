import React from "react"

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
  background: "white",
  padding: "30px",
  borderRadius: "12px",
  width: "400px",
  position: "relative",
  textAlign: "center"
}

const closeStyle = {
  position: "absolute",
  top: "10px",
  right: "15px",
  cursor: "pointer",
  fontSize: "18px",
  fontWeight: "bold"
}

const inputStyle = {
  padding: "8px",
  width: "100%",
  marginTop: "10px"
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
          <input
            type="text"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            style={inputStyle}
            placeholder="Enter OTP"
          />
        )}

        <div style={{ marginTop: "20px" }}>
          <button onClick={onConfirm} disabled={loading}>
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Modal