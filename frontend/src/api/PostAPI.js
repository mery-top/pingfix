export async function CreatePostAPI(groupID, content){
    const response = await fetch("/api/post/create", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            groupID: groupID,
            content: content,
          }),
    });
    return response
}