export async function CreatePostAPI(data) {
    const response = await fetch("/api/post/create", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response;
}

export async function MyPostsAPI(params){
    const queryString = params.toString();
    const url = queryString ? `/api/post/myposts?${queryString}` : `/api/post/myposts`;
    const response = await fetch(url, {
        credentials: "include"
    });
    return response
}