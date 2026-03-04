import { apiUrl } from "./client";

export async function getCSRFToken(){
    const res = await fetch(apiUrl("/api/csrf-token"),{
        credentials: "include"
    });
    const data = await res.json()
    return data.csrfToken;
}
