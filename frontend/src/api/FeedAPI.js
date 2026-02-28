export async function FeedAPI(params) {
    const queryString = params.toString();
    const url = queryString
      ? `/api/post/feed?${queryString}`
      : `/api/post/feed`;
  
    const response = await fetch(url, {
      credentials: "include",
    });
  
    return response;
  }