export async function getCSRFToken(){
    const res = await fetch("/api/csrf-token",{
        credentials: "include"
    });
    const data = await res.json()
    return data.csrfToken;
}