import { apiUrl } from "./client";

export async function FeedAPI(params) {
    const queryString = params.toString();
    const url = queryString
      ? apiUrl(`/api/post/feed?${queryString}`)
      : apiUrl("/api/post/feed");
  
    const response = await fetch(url, {
      credentials: "include",
    });
  
    return response;
  }
