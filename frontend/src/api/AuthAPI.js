export async function LoginAPI(email, password){
    const response = await fetch("/api/login", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({email, password})
    });

    return response
}

export async function LogoutAPI(){
    const res = await fetch("/api/logout",{
        method: "POST",
        credentials: "include",
    });
}

export async function RegisterAPI(name,email, password){
    const response = await fetch("/api/register", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({name, email, password})
    });

    return response
}

export function LoginWithGoogle(){
    window.location.href = "/auth/google"
}

export async function CheckStatusAPI(){
    const response = await fetch("/api/status",{
        credentials: "include"
    });
    return response
}