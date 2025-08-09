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

