import React, { useState, useEffect } from 'react';
import { MyPostsAPI, DeletePostAPI } from '../api/PostAPI';
import PostCardMemo from '../components/PostCard'; // memoized PostCard
import { useNavigate } from 'react-router-dom';

function MyPosts() {
  const [pagination, setPagination] = useState({});
  const [pages, setPage] = useState(1);
  const [posts, setPosts] = useState([]);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const fetchPosts = async () => {
    const params = new URLSearchParams({
      page: pages,
      limit: 5,
    });

    try {
      const res = await MyPostsAPI(params);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      const data = await res.json();
      setPosts(data.posts);
      setPagination(data.pagination);
    } catch (error) {
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [pages]);

  const handleDelete = async (postID) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this post?");
    if (!confirmDelete) return;

    try {
      const res = await DeletePostAPI(postID);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to delete post");
      }
      fetchPosts(); // Refresh after deletion
      setMessage("");
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="container">
      <div className="top-nav-bar">
        <button className="btn-nav" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h2>My Posts</h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {message && <p style={{ color: "#ff4d4f", textAlign: "center", marginBottom: "10px" }}>{message}</p>}
        {posts.map((post) => (
          <PostCardMemo
            key={post.post.ID}
            post={post}
            hideViewGroup={false}
            onVote={() => { }} // optional: handle votes if needed
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Pagination */}
      <div className="pagination-bar">
        {pagination.page > 1 && (
          <button className="btn-nav" onClick={() => setPage(pages - 1)}>Previous</button>
        )}
        {pagination.page < pagination.pages && (
          <button className="btn-nav" onClick={() => setPage(pages + 1)}>Next</button>
        )}
      </div>
    </div>
  );
}

export default MyPosts;