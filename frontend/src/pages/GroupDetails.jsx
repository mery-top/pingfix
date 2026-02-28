import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ViewGroupAPI } from "../api/GroupAPI";
import PostCardMemo from "../components/PostCard"; // memoized PostCard

function GroupDetails() {
  const { id } = useParams();
  const [group, setGroup] = useState(null);
  const [subscribers, setSubscribers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div style={{ maxWidth: "600px", margin: "auto" }}>
      <h2>{group.name} ({group.handle})</h2>
      <p>{group.description}</p>
      <p>Type: {group.type}</p>
      <p>Location: {group.city}, {group.state}, {group.country}</p>

      <p>Subscribers ({subscribers.length}):</p>
      <ul>
        {subscribers.map((sub) => (
          <li key={sub.ID || sub.id}>{sub.Name || sub.name}</li>
        ))}
      </ul>

      <p>Joined: {group.isJoined ? "Yes" : "No"}</p>

      <h3>Posts ({posts.length})</h3>
      {posts.length === 0 && <p>No posts yet.</p>}

      {posts.map((post) => (
        <PostCardMemo key={post.post.ID} post={post} hideViewGroup={true} />
      ))}
    </div>
  );
}

export default GroupDetails;