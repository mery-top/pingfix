import React, { useState, useEffect } from 'react';
import { MyPostsAPI, DeletePostAPI } from '../api/PostAPI';
import PostCardMemo from '../components/PostCard'; // memoized PostCard
import { useNavigate } from 'react-router-dom';

function MyPosts() {
  const [pagination, setPagination] = useState({});
  const [pages, setPage] = useState(1);
  const [posts, setPosts] = useState([]);
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
      console.log(error);
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
        throw new Error(text);
      }
      fetchPosts(); // Refresh after deletion
    } catch (error) {
      console.log(error);
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
        {posts.map((post) => (
          <div key={post.ID}>
            <PostCardMemo
              post={post}
              hideViewGroup={false}
              onVote={() => { }} // optional: handle votes if needed
            />
            {/* Delete Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '5px' }}>
              <button
                onClick={() => handleDelete(post.ID)}
                style={{
                  padding: "6px 12px",
                  background: "transparent",
                  color: "#ff4d4f",
                  border: "1px solid rgba(255,77,79,0.3)",
                  borderRadius: "20px",
                  cursor: "pointer",
                  fontSize: "0.85em",
                  fontWeight: "bold"
                }}
              >
                Delete Post
              </button>
            </div>
          </div>
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