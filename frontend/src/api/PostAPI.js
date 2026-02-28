export async function CreatePostAPI(formData){
    const response = await fetch("/api/post/create", {
        method: "POST",
        credentials: "include",
        body: formData, // NO Content-Type header!
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