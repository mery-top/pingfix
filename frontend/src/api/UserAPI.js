export async function GetCurrentUserAPI(){
    const response = await fetch("/api/user",{
        credentials: "include"
    });
    return response
}