export async function DataAPI(){
    try{
        const csrfToken = localStorage.getItem("csrftoken")

        const res = await fetch("http://localhost:8080/api/secure",{
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": csrfToken
            }
        });
    
        return res.json()
    }catch(error){
       console.error("DataAPI error", error) 
    }
}