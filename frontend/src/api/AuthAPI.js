import { API_BASE_URL, apiUrl } from "./client";

export async function LoginAPI(email, password){
    const response = await fetch(apiUrl("/api/login"), {
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
    const res = await fetch(apiUrl("/api/logout"),{
        method: "POST",
        credentials: "include",
    });
}

export async function RegisterAPI(name,email, password){
    const response = await fetch(apiUrl("/api/register"), {
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
    window.location.href = `${API_BASE_URL}/auth/google`
}

export async function CheckStatusAPI(){
    const response = await fetch(apiUrl("/api/status"),{
        credentials: "include"
    });
    return response
}

export async function SendOTPAPI(email){
    const response = await fetch(apiUrl("/api/send-otp"),{
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({email})
    });
    return response
}

export async function VerifyOTPAPI(email, otp){
    const response = await fetch(apiUrl("/api/verify-otp"),{
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({email,otp})
    });
    return response
}

