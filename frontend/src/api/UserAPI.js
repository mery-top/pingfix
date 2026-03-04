import { apiUrl } from "./client";

export async function GetCurrentUserAPI(){
    const response = await fetch(apiUrl("/api/user"),{
        credentials: "include"
    });
    return response
}
