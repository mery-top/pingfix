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

  // -------------------- UI --------------------
  return (
    <>
      <div>Create Post</div>

      <label>Groups:</label><br />
      <AsyncSelect
        cacheOptions
        defaultOptions      // shows some groups on load
        loadOptions={loadOptions}
        value={selectedGroups}
        onChange={(selectedOptions) => setSelectedGroups(selectedOptions || [])}
        placeholder="Select Groups"
        isMulti
        closeMenuOnSelect={false}
      />

      <br /><br />

      <label>Content:</label><br />
      <SecureInput
        value={content}
        onChange={setContent}
        allowSpace={true}
        maxLength={2000}
      />
      <p>{content.length}/2000 characters</p>

      <br />

      <label>Upload Images:</label><br />
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => setImages(Array.from(e.target.files))}
      />

      <br /><br />

      <label>Links (comma separated):</label><br />
      <input
        type="text"
        value={linksInput}
        onChange={(e) => setLinksInput(e.target.value)}
        placeholder="https://example.com, https://another.com"
        style={{ width: "100%" }}
      />

      <br /><br />

      <label>Tags (comma separated):</label><br />
      <input
        type="text"
        value={tagsInput}
        onChange={(e) => setTagsInput(e.target.value)}
        placeholder="roads, animals, emergency"
        style={{ width: "100%" }}
      />

      <br /><br />

      <button onClick={handleCreatePost}>Create</button>

      <p>{message}</p>
    </>
  );
}

export default CreatePost;