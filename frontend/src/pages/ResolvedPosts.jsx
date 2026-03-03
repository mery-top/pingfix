import React, { useEffect, useState } from "react";
import { MyPostsAPI } from "../api/PostAPI";

function ResolvedPosts() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    async function fetchResolved() {
      const params = new URLSearchParams();
      params.append("resolved", "true");

      const res = await MyPostsAPI(params);

      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    }

    fetchResolved();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Resolved Posts</h2>

      {posts.length === 0 && <p>No resolved posts yet.</p>}

      {posts.map(post => (
        <div key={post.ID} className="post-card">
          <h4>{post.content}</h4>
        </div>
      ))}
    </div>
  );
}

export default ResolvedPosts;