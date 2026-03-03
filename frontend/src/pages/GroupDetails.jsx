import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ViewGroupAPI } from "../api/GroupAPI";
import PostCardMemo from "../components/PostCard";

function GroupDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["group", id],
    queryFn: () => ViewGroupAPI(id),
    enabled: !!id,
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Failed to load group</p>;
  if (!data?.group) return <p>Group not found</p>;

  const group = data.group;
  const subscribers = data.subscribers || [];
  const posts = data.posts || [];

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
          Subscribers ({subscribers.length})
        </h3>
      </div>

      <h3 style={{ color: "#fff", margin: "30px 0 20px" }}>
        Posts ({posts.length})
      </h3>

      {posts.length === 0 && <p>No posts yet.</p>}

      {posts.map((post) => (
        <PostCardMemo key={post.ID} post={{ post }} hideViewGroup />
      ))}
    </div>
  );
}

export default GroupDetails;