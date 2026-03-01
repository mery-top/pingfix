import React from 'react'

function SecureInput({ value, onChange, allowSpace = false, maxLength = 150, style, isTextArea = false }) {
  const sanitizedInput = (value) => {
    let sanitized = value
      // Remove <script>...</script>
      .replace(/<script.*?>.*?<\/script>/gi, '')
      .normalize("NFKC")

      // Remove all HTML tags
      .replace(/<[^>]+>/g, '')
      // Remove inline JS events like onclick=""
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '')
      // Remove javascript: URIs
      .replace(/javascript:[^'"]*/gi, '')
      // Remove SQL meta-characters that could be injection points
      .replace(/(['";`])/g, '')
      .replace(/(--|#|\/\*|\*\/)/g, '')
      // Remove URL-encoded dangerous characters (%27 = ', %22 = ")
      .replace(/(%27|%22|%2D%2D|%3B)/gi, '')

    if (allowSpace) {
      sanitized = sanitized.replace(/[^a-zA-Z0-9_@.\s,?!-]/g, '');
    } else {
      sanitized = sanitized.replace(/[^a-zA-Z0-9_@.,?!-]/g, '');   // disallow spaces
    }

    return sanitized.slice(0, maxLength);
  }

  const handleChange = (e) => {
    const rawValue = e.target.value;
    const cleanValue = sanitizedInput(rawValue);
    onChange(cleanValue);
  }

  if (isTextArea) {
    return (
      <textarea
        value={value}
        onChange={handleChange}
        style={style}
      />
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      autoComplete="off"
      style={style}
    />
  )
}

export default SecureInput