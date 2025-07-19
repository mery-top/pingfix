export async function LoginAPI(email, password){
    const response = await fetch("http://localhost:8080/api/login", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({email, password})
    });
}

