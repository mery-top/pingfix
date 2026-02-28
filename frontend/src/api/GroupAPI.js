export async function GroupRegisterAPI(payload){
    const response = await fetch("/api/group/register", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload)
    });

    return response
}

export async function SearchGroupAPI(params){
    const queryString = params.toString();
    const url = queryString ? `/api/group/search?${queryString}` : `/api/group/search`;
    const response = await fetch(url, {
        credentials: "include"
    });
    return response
}

export async function JoinGroupAPI(groupID){
    const response = await fetch("/api/group/join", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({groupID})
    });

    return response
}


export async function MyGroupsAPI(params){
    const queryString = params.toString();
    const url = queryString ? `/api/group/mygroups?${queryString}` : `/api/group/mygroups`;
    const response = await fetch(url, {
        credentials: "include"
    });
    return response
}

export async function LeaveGroupAPI(groupID){
    const response = await fetch("/api/group/leave", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ groupID })
    })
    return response
}


export const RequestDeleteGroupAPI = async (groupID) => {
    return await fetch("/api/group/delete/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ groupID }),
    });
  };
  
  export const ConfirmDeleteGroupAPI = async (groupID, otp) => {
    return await fetch("/api/group/delete/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ groupID, otp }),
    });
  };

  export async function ViewGroupAPI(groupID) {
    const url = `/api/group/view?groupID=${groupID}`;
    const response = await fetch(url, {
      method: "GET",
      credentials: "include", // include session/cookies
    });
    return response;
  }