import React, { useEffect, useState, useRef, useCallback } from "react";
import { FeedAPI } from "../api/FeedAPI";

function Feed() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const observer = useRef();

  const lastPostRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const fetchPosts = async () => {
    setLoading(true);

    const params = new URLSearchParams({
      page: page,
      limit: 5,
    });

    try {
      const res = await FeedAPI(params);
      const data = await res.json();

      setPosts(prev => [...prev, ...data.posts]);

      if (page >= data.pagination.pages) {
        setHasMore(false);
      }
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [page]);

  return (
    <div style={{ maxWidth: "600px", margin: "auto" }}>
      <h2>Dashboard Feed</h2>

      {posts.map((post, index) => {
        if (index === posts.length - 1) {
          return (
            <div ref={lastPostRef} key={post.ID}>
              <PostCard post={post} />
            </div>
          );
        }
        return <PostCard key={post.ID} post={post} />;
      })}

      {loading && <p>Loading...</p>}
      {!hasMore && <p>No more posts</p>}
    </div>
  );
}

function PostCard({ post }) {
  return (
    <div style={{
      border: "1px solid #ddd",
      borderRadius: "10px",
      padding: "15px",
      marginBottom: "20px",
      background: "white"
    }}>

      <p>
        <strong>{post.User?.Name}</strong> in{" "}
        <span style={{ color: "gray" }}>{post.Group?.Name}</span>
      </p>

      <p>{post.Content}</p>

      {post.Images?.map(img => (
        <img
          key={img.ID}
          src={`http://localhost:8080/${img.URL}`}
          alt=""
          style={{ width: "100%", borderRadius: "8px", marginTop: "10px" }}
        />
      ))}

      <div style={{ marginTop: "8px" }}>
        {post.Tags?.map(tag => (
          <span key={tag.ID} style={{ marginRight: "8px", color: "#007bff" }}>
            #{tag.Name}
          </span>
        ))}
      </div>

      <div>
        {post.Links?.map(link => (
          <div key={link.ID}>
            <a href={link.URL} target="_blank" rel="noopener noreferrer">
              {link.URL}
            </a>
          </div>
        ))}
      </div>

      <small style={{ color: "gray" }}>
        {new Date(post.CreatedAt).toLocaleString()}
      </small>
    </div>
  );
}

export default Feed;