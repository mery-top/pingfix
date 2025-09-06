import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AsyncSelect from "react-select/async";
import { SearchGroupAPI } from '../api/GroupAPI';
import SecureInput from '../wrapper/SecureInput';
import { CreatePostAPI } from '../api/PostAPI';

function CreatePost() {
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [content, setContent] = useState("")
  const[message, setMessage] = useState("")
  const navigate = useNavigate()
  /*--------------------------------------------------------------
  import { AsyncPaginate } from "react-select-async-paginate"; //will use it in future
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

  const handleCreatePost = async ()=>{
    try {

      const groupIDs = selectedGroups.map(group => group.value);
      const res = await CreatePostAPI(groupIDs, content);
      const message = await res.text();
  
      if (res.status === 201) {
        setMessage("Create Post Successfully");
        
      } else {
        setMessage(message || "Post Creation failed");
      }
    } catch (error) {
      console.error("Create Post error", error);
      setMessage("Something went wrong");
    }

  }


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

      <label> Content:</label><br />
        <SecureInput value={content} onChange={setContent} allowSpace={true} maxLength={2000}/>
        <p>{content.length}/2000 characters</p>

      <button onClick={handleCreatePost}>Create</button>
      <p>{message}</p>
    </>
  );
}

export default CreatePost;
