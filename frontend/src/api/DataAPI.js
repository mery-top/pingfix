export async function DataAPI(){
    const csrfToken = localStorage.getItem("csrftoken")

    const res = await fetch("/api/secure",{
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken
        }
    });

    return res.json()
}