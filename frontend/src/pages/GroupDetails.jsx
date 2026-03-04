import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { ViewGroupAPI } from "../api/GroupAPI";
import PostCardMemo from "../components/PostCard";

function GroupDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch group info (single fetch)
  const { data: groupData, isLoading: groupLoading, error: groupError } = useQuery({
    queryKey: ["group", id],
    queryFn: () => ViewGroupAPI(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // cache 5 min
  });

  // Infinite query for posts
  const {
    data: postsPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["groupPosts", id],
    queryFn: async ({ pageParam = 0 }) => {
      const limit = 20;
      const response = await ViewGroupAPI(id + `?limit=${limit}&offset=${pageParam}`);
      return response.posts;
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === 20 ? allPages.flat().length : undefined, // if 20 posts fetched, fetch next
    enabled: !!id,
    staleTime: 1000 * 60 * 2, // cache posts 2 min
  });

  if (groupLoading) return <p>Loading group...</p>;
  if (groupError) return <p>Failed to load group</p>;
  if (!groupData?.group) return <p>Group not found</p>;

  const group = groupData.group;
  const subscribers = groupData.subscribers || [];
  const posts = postsPages ? postsPages.pages.flat() : [];

  return (
    <div className="container" style={{ maxWidth: "700px", margin: "40px auto" }}>
      <button
        className="ig-btn"
        style={{
          width: "auto",
          margin: "0 0 20px 0",
          padding: "8px 16px",
          backgroundColor: "transparent",
          border: "1px solid #F47D34",
          color: "#F47D34",
        }}
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      <div className="tg-card">
        <h2 style={{ marginBottom: "15px", color: "#fff" }}>
          {group.name}{" "}
          <span style={{ fontSize: "0.8em", color: "#aaa", fontWeight: "normal" }}>
            ({group.handle})
          </span>
        </h2>

        <p style={{ color: "rgba(255,255,255,0.8)", marginBottom: "15px" }}>
          {group.description}
        </p>

        <h3 style={{ color: "#F47D34" }}>
          Subscribers: {group.subscriberCount || subscribers.length}
        </h3>
      </div>

      <h3 style={{ color: "#fff", margin: "30px 0 20px" }}>Posts</h3>

      {posts.length === 0 && <p>No posts yet.</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {posts.map((post) => (
          <PostCardMemo key={post.ID} post={post} hideViewGroup />
        ))}
      </div>

      {hasNextPage && (
        <div style={{ textAlign: "center", margin: "20px 0" }}>
          <button
            className="ig-btn"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}

export default GroupDetails; 