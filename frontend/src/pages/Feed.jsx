import React, { useEffect, useState, useRef, useCallback, memo } from "react";
import { FeedAPI } from "../api/FeedAPI";
import { VotePost, AddComment, DeleteComment, EditComment, GetComments } from "../api/PostAPI";
import { useNavigate } from "react-router-dom";
import PostCardMemo from "../components/PostCard";

function Feed() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const observer = useRef();

  // ---------------- Infinite Scroll ----------------
  const lastPostRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  // ---------------- Fetch Posts ----------------
  const fetchPosts = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 5 });

    try {
      const res = await FeedAPI(params);
      const data = await res.json();

      // Ensure posts is always an array
      const postsArray = Array.isArray(data.posts) ? data.posts : [];
      const totalPages = data.pagination?.pages || 0;

      setPosts((prev) => [...prev, ...postsArray]);
      setHasMore(page < totalPages);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [page]);

  // ---------------- Sync Vote with Feed State ----------------
  const handleVoteInFeed = (postID, type) => {
    setPosts((prevPosts) =>
      prevPosts.map((p) =>
        p?.post?.ID === postID
          ? {
              ...p,
              upvotes: type === 1 ? (p.upvotes || 0) + 1 : p.upvotes || 0,
              downvotes: type === -1 ? (p.downvotes || 0) + 1 : p.downvotes || 0,
            }
          : p
      )
    );
  };

  return (
    <div style={{ maxWidth: "600px", margin: "auto" }}>

      <h2 style={{ margin: "30px 0", textAlign: "center" }}>
        What's happening ?
      </h2>

      {posts.length === 0 && !loading && <p>No posts yet.</p>}

      {posts.map((post, index) => {
          const key = post?.ID;

          if (index === posts.length - 1) {
            return (
              <div ref={lastPostRef} key={`wrapper-${key}`}>
                <PostCardMemo
                  post={post}
                  onVote={handleVoteInFeed}
                />
              </div>
            );
          }

          return (
            <PostCardMemo
              key={key}
              post={post}
              onVote={handleVoteInFeed}
            />
          );
        })}

      {loading && <p>Loading...</p>}
      {!hasMore && <p>No more posts</p>}
    </div>
  );
}



export default Feed;