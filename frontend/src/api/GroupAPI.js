import { apiUrl } from "./client";

export async function GroupRegisterAPI(payload){
    const response = await fetch(apiUrl("/api/group/register"), {
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
    const url = queryString ? apiUrl(`/api/group/search?${queryString}`) : apiUrl("/api/group/search");
    const response = await fetch(url, {
        credentials: "include"
    });
    return response
}

export async function JoinGroupAPI(groupID){
    const response = await fetch(apiUrl("/api/group/join"), {
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
    const url = queryString ? apiUrl(`/api/group/mygroups?${queryString}`) : apiUrl("/api/group/mygroups");
    const response = await fetch(url, {
        credentials: "include"
    });
    return response
}

export async function LeaveGroupAPI(groupID){
    const response = await fetch(apiUrl("/api/group/leave"), {
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
    return await fetch(apiUrl("/api/group/delete/request"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ groupID }),
    });
  };
  
  export const ConfirmDeleteGroupAPI = async (groupID, otp) => {
    return await fetch(apiUrl("/api/group/delete/confirm"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ groupID, otp }),
    });
  };

  export async function ViewGroupAPI(groupID) {
    const response = await fetch(apiUrl(`/api/groups/${groupID}`), {
      method: "GET",
      credentials: "include",
    });
  
    if (!response.ok) {
      throw new Error("Failed to fetch group");
    }
  
    return response.json();
  }
