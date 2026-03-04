import { apiUrl } from "./client";

export async function DataAPI(){
    const csrfToken = localStorage.getItem("csrftoken")

    const res = await fetch(apiUrl("/api/secure"),{
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken
        }
    });

    return res.json()
}
