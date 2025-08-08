import React from 'react'

function SecureInput({value, onChange, allowSpace= false, maxLength = 150}) {
     const sanitizedInput = (value) =>{
        let sanitized =    value
                        .replace(/<script.*?>.*?<\/script>/gi, '')      // remove <script>...</script>
                        .replace(/<[^>]+>/g, '')                        // remove all HTML tags
                        .replace(/on\w+="[^"]*"/g, '')                  // remove inline JS events like onclick=""  
        if (allowSpace) {
            sanitized = sanitized.replace(/[^a-zA-Z0-9_@.\s-]/g, '');
        } else {
            sanitized = sanitized.replace(/[^a-zA-Z0-9_@.-]/g, '');   // disallow spaces
        }

        return sanitized.slice(0, maxLength);
     }

     const handleChange = (e) =>{
        const rawValue = e.target.value;
        const cleanValue = sanitizedInput(rawValue);
        onChange(cleanValue);
     }


  return (
    <div><input
    type="text"
    value={value}
    onChange={handleChange}
    autoComplete="off"
  /><br /><br /></div>
  )
}

export default SecureInput