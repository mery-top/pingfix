import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckStatusAPI } from "../api/AuthAPI";
import { GetPublicPostAPI } from "../api/PostAPI";

function truncateHalf(text = "") {
  if (!text) return "";
  const cut = Math.max(40, Math.floor(text.length / 2));
  return text.length > cut ? `${text.slice(0, cut)}...` : text;
}

function PublicPost() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [postData, setPostData] = React.useState(null);

  React.useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const [postRes, authRes] = await Promise.all([
          GetPublicPostAPI(token),
          CheckStatusAPI(),
        ]);

        if (!mounted) return;

        if (!postRes.ok) {
          const msg = await postRes.text();
          setError(msg || "Post not found");
          setLoading(false);
          return;
        }

        const data = await postRes.json();
        setPostData(data);

        if (authRes.ok && data?.post?.GroupID) {
          navigate(`/group/${data.post.GroupID}?post=${data.post.ID}`, { replace: true });
          return;
        }

        setLoading(false);
      } catch (err) {
        if (!mounted) return;
        setError("Unable to load shared post");
        setLoading(false);
      }
    }

    bootstrap();
    return () => {
      mounted = false;
    };
  }, [token, navigate]);

  if (loading) {
    return <div style={{ color: "#fff", textAlign: "center", marginTop: "60px" }}>Loading post...</div>;
  }

  if (error || !postData?.post) {
    return <div style={{ color: "#fff", textAlign: "center", marginTop: "60px" }}>{error || "Post not found"}</div>;
  }

  const post = postData.post;
  const previewContent = truncateHalf(post.Content || "");
  const firstImage = Array.isArray(post.Images) && post.Images.length > 0 ? post.Images[0].URL : "";

  return (
    <div style={{ minHeight: "100vh", background: "#0f1116", padding: "24px" }}>
      <div style={{ maxWidth: "640px", margin: "30px auto", background: "#1a1d25", borderRadius: "14px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", position: "relative" }}>
        <div style={{ padding: "18px 18px 8px", color: "#fff" }}>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: "0.9rem" }}>
            {post.User?.Name || "Anonymous"} in {post.Group?.Name || "Community"}
          </p>
        </div>

        {firstImage && (
          <img
            src={firstImage}
            alt="Shared post"
            style={{ width: "100%", maxHeight: "320px", objectFit: "cover", display: "block" }}
          />
        )}

        <div style={{ padding: "16px 18px 100px", color: "#fff", position: "relative" }}>
          <p style={{ margin: 0, lineHeight: 1.6 }}>{previewContent}</p>

          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: "130px",
              background: "linear-gradient(to top, rgba(26,29,37,1) 35%, rgba(26,29,37,0.25) 100%)",
            }}
          />
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, bottom: "14px", padding: "0 18px", display: "flex", gap: "10px" }}>
          <button
            onClick={() => navigate(`/login?next=${encodeURIComponent(`/public/post/${token}`)}`)}
            style={{ flex: 1, border: "none", borderRadius: "999px", background: "#f47d34", color: "#fff", fontWeight: 700, padding: "12px 14px", cursor: "pointer" }}
          >
            Log In To View Full Post
          </button>
          <button
            onClick={() => navigate("/register")}
            style={{ border: "1px solid #f47d34", borderRadius: "999px", background: "transparent", color: "#f47d34", fontWeight: 700, padding: "12px 14px", cursor: "pointer" }}
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}

export default PublicPost;
