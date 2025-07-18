export async function LoginAPI(email, password){
    const response = await fetch("http://localhost:8080/api/login", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "http://localhost:8080/api/login"
        },
        body: JSON.stringify({email, password})
    });

    const csrfToken = res.headers.get("X-CSRF-Token")
    localStorage.setItem("csrfToken", csrfToken)
    return res.json()
}

