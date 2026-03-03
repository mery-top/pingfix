import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MyPostsAPI, DeletePostAPI } from '../api/PostAPI';
import PostCardMemo from '../components/PostCard';
import { useNavigate } from 'react-router-dom';

function MyPosts() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ---------------- Fetch posts with TanStack Query ----------------
  const { data, isLoading, isError } = useQuery({
    queryKey: ['myPosts', page, filter],
    queryFn: async () => {
      const params = new URLSearchParams({ page, limit: 5 });
      if (filter === 'resolved') params.append('resolved', 'true');
      if (filter === 'unresolved') params.append('resolved', 'false');
  
      const res = await MyPostsAPI(params);
      if (!res.ok) throw new Error('Failed to fetch posts');
      return res.json();
    },
    keepPreviousData: true,
    staleTime: 1000 * 60, // 1 minute
  });
  // ---------------- Delete post mutation ----------------
  const deleteMutation = useMutation({
    mutationFn: async (postID) => {
      const res = await DeletePostAPI(postID);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to delete post');
      }
      return postID;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myPosts', page, filter] }),
  });

  // ---------------- Render ----------------
  return (
    <div className="container">
      <div className="top-nav-bar">
        <button className="btn-nav" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h2>My Posts</h2>
      </div>

      {/* Filter buttons */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
        {['all', 'resolved', 'unresolved'].map((f) => (
          <button
            key={f}
            onClick={() => { setPage(1); setFilter(f); }}
            style={{ fontWeight: filter === f ? 'bold' : 'normal' }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {isLoading && <p style={{ textAlign: "center" }}>Loading posts...</p>}
        {isError && <p style={{ color: "#ff4d4f", textAlign: "center" }}>Error loading posts</p>}

        {data?.posts?.map((post) => (
          <PostCardMemo
            key={post.ID}
            post={post}
            hideViewGroup={false}
            onVote={() => {}}
            onDelete={() => deleteMutation.mutate(post.ID)}
          />
        ))}
      </div>

      {/* Pagination */}
      <div className="pagination-bar" style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
        {data?.pagination?.page > 1 && (
          <button className="btn-nav" onClick={() => setPage(page - 1)}>Previous</button>
        )}
        {data?.pagination?.page < data?.pagination?.pages && (
          <button className="btn-nav" onClick={() => setPage(page + 1)}>Next</button>
        )}
      </div>
    </div>
  );
}

export default MyPosts;