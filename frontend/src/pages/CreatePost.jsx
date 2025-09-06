import React, { useState } from 'react'
import AsyncSelect from "react-select/async";
import { AsyncPaginate } from "react-select-async-paginate"; //will use it in future
import { SearchGroupAPI } from '../api/GroupAPI';

function CreatePost() {
  const [selectedGroups, setSelectedGroups] = useState([]);

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
    </>
  );
}

export default CreatePost;
