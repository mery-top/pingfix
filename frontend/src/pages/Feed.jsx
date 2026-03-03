import React, { useRef, useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { FeedAPI } from "../api/FeedAPI";
import PostCardMemo from "../components/PostCard";

function Feed() {
  const observer = useRef();

  // ---------------- Fetch function ----------------
  const fetchPosts = async ({ pageParam = 1 }) => {
    const params = new URLSearchParams({ page: pageParam, limit: 5 });
    const res = await FeedAPI(params);
    const data = await res.json();

    return {
      posts: Array.isArray(data.posts) ? data.posts : [],
      nextPage: pageParam < (data.pagination?.pages || 0) ? pageParam + 1 : undefined,
    };
  };

  // ---------------- Infinite Query ----------------
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: fetchPosts,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  // ---------------- Infinite Scroll ----------------
  const lastPostRef = useCallback(
    (node) => {
      if (isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });

      if (node) observer.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  // ---------------- Sync Vote with Feed State ----------------
  const handleVoteInFeed = (postID, type) => {
    // Update cached data optimistically
    // TanStack Query has updateQueryData, but here keeping simple: mutate local copy
    if (!data) return;

    data.pages.forEach((page) => {
      page.posts.forEach((p) => {
        if (p?.ID === postID) {
          p.upvotes = type === 1 ? (p.upvotes || 0) + 1 : p.upvotes || 0;
          p.downvotes = type === -1 ? (p.downvotes || 0) + 1 : p.downvotes || 0;
        }
      });
    });
  };

  // ---------------- Render ----------------
  const allPosts = data?.pages.flatMap((p) => p.posts) || [];

  return (
    <div style={{ maxWidth: "600px", margin: "auto" }}>
      <h2 style={{ margin: "30px 0", textAlign: "center" }}>
        What's happening ?
      </h2>

      {allPosts.length === 0 && !isLoading && <p>No posts yet.</p>}

      {allPosts.map((post, index) => {
        const key = post?.ID;

        if (index === allPosts.length - 1) {
          return (
            <div ref={lastPostRef} key={`wrapper-${key}`}>
              <PostCardMemo post={post} onVote={handleVoteInFeed} />
            </div>
          );
        }

        return <PostCardMemo key={key} post={post} onVote={handleVoteInFeed} />;
      })}

      {(isLoading || isFetchingNextPage) && <p>Loading...</p>}
      {!hasNextPage && allPosts.length > 0 && <p>No more posts</p>}
    </div>
  );
}

export default Feed;