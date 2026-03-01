import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ViewGroupAPI } from "../api/GroupAPI";
import PostCardMemo from "../components/PostCard"; // memoized PostCard

function GroupDetails() {
  const { id } = useParams();
  const [group, setGroup] = useState(null);
  const [subscribers, setSubscribers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const res = await ViewGroupAPI(id);
        if (!res.ok) throw new Error("Failed to fetch group details");
        const data = await res.json();

        // Set group info
        setGroup(data.group);

        // Set subscribers correctly
        setSubscribers(data.subscribers || []);

        // Map posts to match PostCard shape
        const formattedPosts = (data.posts || []).map((p) => ({
          post: {
            ...p.post,
            User: p.post.User || data.group.creator, // fallback to creator if User missing
            Group: p.post.Group || {
              ID: data.group.id,
              Name: data.group.name,
            },
          },
          upvotes: p.upvotes || 0,
          downvotes: p.downvotes || 0,
          comments: p.comments || 0,
          share_url: p.share_url || "",
        }));

        setPosts(formattedPosts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (!group) return <p>Group not found</p>;

  return (
    <div className="container" style={{ maxWidth: '700px', margin: '40px auto' }}>
      <button className="ig-btn" style={{ width: 'auto', margin: '0 0 20px 0', padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid #F47D34', color: '#F47D34' }} onClick={() => navigate(-1)}>
        ← Back
      </button>
      <div className="tg-card">
        <h2 style={{ marginBottom: "15px", color: "#fff" }}>{group.name} <span style={{ fontSize: "0.8em", color: "#aaa", fontWeight: "normal" }}>({group.handle})</span></h2>

        <p style={{ color: "rgba(255,255,255,0.8)", marginBottom: "15px", lineHeight: "1.5" }}>{group.description}</p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginBottom: "20px", padding: "15px", background: "rgba(0,0,0,0.2)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ flex: 1 }}>
            <span style={{ color: "#aaa", fontSize: "0.85em", display: "block", marginBottom: "5px" }}>Type</span>
            <strong style={{ color: "#fff" }}>{group.type}</strong>
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ color: "#aaa", fontSize: "0.85em", display: "block", marginBottom: "5px" }}>Location</span>
            <strong style={{ color: "#fff" }}>{group.city}, {group.state}, {group.country}</strong>
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ color: "#aaa", fontSize: "0.85em", display: "block", marginBottom: "5px" }}>Joined</span>
            <strong style={{ color: group.isJoined ? "#4caf50" : "#F47D34" }}>{group.isJoined ? "Yes" : "No"}</strong>
          </div>
        </div>

        <div>
          <h3 style={{ color: "#F47D34", fontSize: "1.1em", marginBottom: "10px" }}>Subscribers ({subscribers.length})</h3>
          <ul style={{ listStyle: "none", padding: 0, display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {subscribers.map((sub) => (
              <li key={sub.ID || sub.id} style={{ background: "rgba(255,255,255,0.05)", padding: "5px 10px", borderRadius: "15px", fontSize: "0.9em", color: "#fff" }}>
                {sub.Name || sub.name}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <h3 style={{ color: "#fff", margin: "30px 0 20px" }}>Posts ({posts.length})</h3>
      {posts.length === 0 && <p style={{ color: "rgba(255,255,255,0.6)", textAlign: "center", padding: "40px", background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>No posts yet.</p>}

      {posts.map((post) => (
        <PostCardMemo key={post.post.ID} post={post} hideViewGroup={true} />
      ))}
    </div>
  );
}

export default GroupDetails;