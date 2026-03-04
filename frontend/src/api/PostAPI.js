import { apiUrl } from "./client";

export async function CreatePostAPI(formData) {
  const response = await fetch(apiUrl("/api/post/create"), {
    method: "POST",
    credentials: "include",
    body: formData, // NO Content-Type header!
  });
  return response;
}

export async function MyPostsAPI(params) {
  const queryString = params.toString();
  const url = queryString ? apiUrl(`/api/post/myposts?${queryString}`) : apiUrl("/api/post/myposts");
  const response = await fetch(url, {
    credentials: "include"
  });
  return response
}

export async function DeletePostAPI(postID) {
  const response = await fetch(apiUrl(`/api/post/delete?id=${postID}`), {
    method: "DELETE",
    credentials: "include"
  })
  return response
}

export async function VotePost(post_id, vote_type) {
  const res = await fetch(apiUrl("/api/post/vote"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ post_id, vote_type }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Vote failed");
  }
  return res.json();
}

export async function ResolvePost(post_id) {
  const res = await fetch(apiUrl("/api/post/resolve"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ post_id }),
  });
  return res.ok;
}

export async function AddComment(post_id, content) {
  const res = await fetch(apiUrl("/api/post/comment"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ post_id, content }),
  });
  return res.json();
}

export async function DeleteComment(comment_id) {
  const res = await fetch(apiUrl(`/api/post/comment/${comment_id}`), {
    method: "DELETE",
    credentials: "include",
  });
  return res.ok;
}

export async function EditComment(comment_id, content) {
  const res = await fetch(apiUrl(`/api/comment/edit/${comment_id}`), {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  return res.json();
}

export async function GetPublicPostAPI(token) {
  return fetch(apiUrl(`/api/public/post/${token}`), {
    method: "GET",
    credentials: "include",
  });
}

export async function GetComments(post_id) {
  const res = await fetch(apiUrl(`/api/post/comments/${post_id}`), {
    credentials: "include"
  });
  return res.json(); // should return an array of comments
}
