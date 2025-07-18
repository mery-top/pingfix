export async function getCSRFToken(){
    const res = await fetch("http://localhost:8080/api/csrf-token",{
        credentials: "include"
    });
    const data = await res.json()
    return data.csrfToken;
}