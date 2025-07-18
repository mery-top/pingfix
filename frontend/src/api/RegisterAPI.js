export async function RegisterAPI(name,email, password){
    const response = await fetch("http://localhost:8080/api/register", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({name, email, password})
    });

    return response.json()
}