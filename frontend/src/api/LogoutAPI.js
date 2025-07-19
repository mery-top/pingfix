export async function LogoutAPI(){
    const res = await fetch("http://localhost:8080/api/logout",{
        method: "POST",
        credentials: "include",
    });
}