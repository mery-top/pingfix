import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AsyncSelect from "react-select/async";
import { SearchGroupAPI } from '../api/GroupAPI';
import SecureInput from '../wrapper/SecureInput';
import { CreatePostAPI } from '../api/PostAPI';

function CreatePost() {

  // -------------------- STATE --------------------
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [linksInput, setLinksInput] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate()

  /*--------------------------------------------------------------
  import { AsyncPaginate } from "react-select-async-paginate"; 
  // will use it in future

  FOR PAGINATION
  ----------------------------------------------------------------
  */

  // Fetch options from API dynamically
  const loadOptions = async (inputValue) => {
    const params = new URLSearchParams({
      handle: inputValue, // user’s search text
      page: 1,            // start at page 1
      limit: 20
    });

    const res = await SearchGroupAPI(params);
    const data = await res.json();

    return data.data.map((group) => ({
      value: group.ID,
      label: group.Handle,
    }));
  };

  // -------------------- CREATE POST --------------------
  const handleCreatePost = async () => {
    try {

      const groupIDs = selectedGroups.map(group => group.value);

      const formData = new FormData();

      // Append group IDs
      groupIDs.forEach(id => {
        formData.append("groupID", id);
      });

      formData.append("content", content);

      // Append images (files)
      images.forEach(file => {
        formData.append("images", file);
      });

      // Append links
      linksInput.split(",").map(l => l.trim()).filter(Boolean)
        .forEach(link => formData.append("links", link));

      // Append tags
      tagsInput.split(",").map(t => t.trim()).filter(Boolean)
        .forEach(tag => formData.append("tags", tag));

      const res = await CreatePostAPI(formData);
      const msg = await res.text();

      if (res.status === 201) {
        setMessage("Create Post Successfully");
        setSelectedGroups([]);
        setContent("");
        setImages([]);
        setLinksInput("");
        setTagsInput("");
      } else {
        setMessage(msg || "Post Creation failed");
      }

    } catch (error) {
      console.error("Create Post error", error);
      setMessage("Something went wrong");
    }
  };

  return (
    <div className="container" style={{ maxWidth: '700px', margin: '40px auto' }}>
      <button className="ig-btn" style={{ width: 'auto', margin: '0 0 20px 0', padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid #F47D34', color: '#F47D34' }} onClick={() => navigate(-1)}>
        ← Back
      </button>
      <div className="tg-card">
        <h2 style={{ marginBottom: "25px", textAlign: "center", color: "#fff" }}>Create Post</h2>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ color: "#aaa", fontSize: "0.9em", marginBottom: "5px", display: "block" }}>Groups:</label>
          <AsyncSelect
            cacheOptions
            defaultOptions
            loadOptions={loadOptions}
            value={selectedGroups}
            onChange={(selectedOptions) => setSelectedGroups(selectedOptions || [])}
            placeholder="Select Groups"
            isMulti
            closeMenuOnSelect={false}
            styles={{
              control: (base) => ({
                ...base,
                backgroundColor: "rgba(0, 0, 0, 0.2)",
                borderColor: "#555",
                color: "#fff"
              }),
              menu: (base) => ({
                ...base,
                backgroundColor: "#350E25",
                color: "#fff"
              }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isFocused ? "rgba(244, 125, 52, 0.2)" : "transparent",
                color: "#fff"
              }),
              multiValue: (base) => ({
                ...base,
                backgroundColor: "rgba(244, 125, 52, 0.2)"
              }),
              multiValueLabel: (base) => ({
                ...base,
                color: "#fff"
              })
            }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ color: "#aaa", fontSize: "0.9em", marginBottom: "5px", display: "block" }}>Content:</label>
          <div style={{ width: "100%" }}>
            <SecureInput
              value={content}
              onChange={setContent}
              allowSpace={true}
              maxLength={2000}
              isTextArea={true} /* Custom handler, or if it doesn't support we use height */
              style={{ width: "100%", height: "150px", padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff' }}
            />
          </div>
          <p style={{ fontSize: "0.8em", color: "#666", textAlign: "right", margin: "5px 0 0 0" }}>{content.length}/2000 characters</p>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ color: "#aaa", fontSize: "0.9em", marginBottom: "5px", display: "block" }}>Upload Images:</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setImages(Array.from(e.target.files))}
            style={{ width: "100%", padding: "10px 0", color: "#fff" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ color: "#aaa", fontSize: "0.9em", marginBottom: "5px", display: "block" }}>Links (comma separated):</label>
          <input
            type="text"
            value={linksInput}
            onChange={(e) => setLinksInput(e.target.value)}
            placeholder="https://example.com, https://another.com"
            style={{ width: "100%", padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff' }}
          />
        </div>

        <div style={{ marginBottom: "25px" }}>
          <label style={{ color: "#aaa", fontSize: "0.9em", marginBottom: "5px", display: "block" }}>Tags (comma separated):</label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="roads, animals, emergency"
            style={{ width: "100%", padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff' }}
          />
        </div>

        <button className="ig-btn" style={{ padding: "12px", fontSize: "1em", marginTop: "10px" }} onClick={handleCreatePost}>Create Post</button>

        {message && <p style={{ color: "#F47D34", textAlign: "center", marginTop: "15px" }}>{message}</p>}
      </div>
    </div>
  );
}

export default CreatePost;