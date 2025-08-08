export async function GroupRegisterAPI(payload){
    const response = await fetch("/api/groupregister", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload)
    });

    return response
}