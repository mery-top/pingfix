import React, { useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import { VotePost, AddComment, DeleteComment, EditComment, GetComments } from "../api/PostAPI";

// ---------------- PostCard Component ----------------
function PostCard({ post, onVote, hideViewGroup = false }) {
  const realPost = post?.post || {};

  const [upvotes, setUpvotes] = useState(post?.upvotes || 0);
  const [downvotes, setDownvotes] = useState(post?.downvotes || 0);
  const [commentsCount, setCommentsCount] = useState(post?.comments || 0);
  const [commentText, setCommentText] = useState("");
  const [commentList, setCommentList] = useState([]);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentsPage, setCommentsPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const COMMENTS_LIMIT = 5;
  const [userVote, setUserVote] = useState(0);

  const navigate = useNavigate();

  // ---------------- Toggle Comments ----------------
  const toggleComments = async () => {
    if (!showComments && !commentsLoaded) await loadComments(1);
    setShowComments(!showComments);
  };

  // ---------------- Load Comments ----------------
  const loadComments = async (page = 1) => {
    try {
      const res = await GetComments(realPost.ID, page, COMMENTS_LIMIT);
      const newComments = Array.isArray(res.comments) ? res.comments : [];
      setCommentList((prev) => (page === 1 ? newComments : [...prev, ...newComments]));
      setCommentsLoaded(true);
      setHasMoreComments(page < (res.pagination?.pages || 0));
      setCommentsPage(page);
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    }
  };

  // ---------------- Add Comment ----------------
  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    const newComment = await AddComment(realPost.ID, commentText);
    setCommentList([newComment, ...commentList]);
    setCommentsCount((prev) => prev + 1);
    setCommentText("");
  };

  // ---------------- View Group -----------------
  const handleViewGroup = (groupID) => navigate(`/group/${groupID}`);

  // ---------------- Delete Comment ----------------
  const handleDeleteComment = async (id) => {
    const ok = await DeleteComment(id);
    if (ok) {
      setCommentList(commentList.filter((c) => c.ID !== id));
      setCommentsCount((prev) => prev - 1);
    }
  };

  // ---------------- Edit Comment ----------------
  const handleEditComment = async (id) => {
    if (!editingText.trim()) return;
    const updatedComment = await EditComment(id, editingText);
    setCommentList(commentList.map((c) => (c.ID === id ? updatedComment : c)));
    setEditingCommentId(null);
    setEditingText("");
  };

  // ---------------- Vote ----------------
  const handleVote = (type) => {
    if (userVote === type) {
      setUserVote(0);
      type === 1 ? setUpvotes((prev) => prev - 1) : setDownvotes((prev) => prev - 1);
      onVote && onVote(realPost.ID, 0);
    } else {
      userVote === 1 && setUpvotes((prev) => prev - 1);
      userVote === -1 && setDownvotes((prev) => prev - 1);
      setUserVote(type);
      type === 1 ? setUpvotes((prev) => prev + 1) : setDownvotes((prev) => prev + 1);
      onVote && onVote(realPost.ID, type);
    }
    VotePost(realPost.ID, type).catch((err) => console.error("Vote failed:", err));
  };

  // ---------------- Share ----------------
  const handleShare = () => {
    if (post?.share_url) {
      navigator.clipboard.writeText(post.share_url);
      alert("Share link copied!");
    }
  };

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: "10px", padding: "15px", marginBottom: "20px", background: "white" }}>
      <p>
        <strong>{realPost.User?.Name || "Unknown User"}</strong>
        {!hideViewGroup && (
          <> in <span style={{ color: "gray" }}>{realPost.Group?.Name || "Unknown Group"}</span></>
        )}
      </p>

      {!hideViewGroup && (
        <button onClick={() => handleViewGroup(realPost.GroupID)}>View Group</button>
      )}

      <p>{realPost.Content || ""}</p>

      {Array.isArray(realPost.Images) && realPost.Images.map((img) => (
        <img key={img.ID} src={`http://localhost:8080/${img.URL}`} alt="" style={{ width: "100%", borderRadius: "8px", marginTop: "10px" }} />
      ))}

      <div style={{ marginTop: "8px" }}>
        {Array.isArray(realPost.Tags) && realPost.Tags.map((tag) => (
          <span key={tag.ID} style={{ marginRight: "8px", color: "#007bff" }}>#{tag.Name}</span>
        ))}
      </div>

      <div>
        {Array.isArray(realPost.Links) && realPost.Links.map((link) => (
          <div key={link.ID}>
            <a href={link.URL} target="_blank" rel="noopener noreferrer">{link.URL}</a>
          </div>
        ))}
      </div>

      <hr style={{ margin: "10px 0" }} />

      {/* ACTION BAR */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <button onClick={() => handleVote(1)} disabled={userVote === -1} style={{ color: userVote === 1 ? "black" : "gray" }}>👍</button> {upvotes}
          <button onClick={() => handleVote(-1)} disabled={userVote === 1} style={{ color: userVote === -1 ? "black" : "gray" }}>👎</button> {downvotes}
        </div>

        <div>
          <button onClick={toggleComments} style={{ background: "none", border: "none", cursor: "pointer" }}>💬 {commentsCount} comments</button>
        </div>

        <button onClick={handleShare}>🔗 Share</button>
      </div>

      {/* COMMENT SECTION */}
      {showComments && (
        <div style={{ marginTop: "10px" }}>
          <input type="text" placeholder="Write a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} style={{ width: "80%" }} />
          <button onClick={handleAddComment}>Post</button>

          <div style={{ marginTop: "10px" }}>
            {Array.isArray(commentList) && commentList.map((c) => (
              <div key={`comment-${c.ID}`} style={{ borderTop: "1px solid #eee", padding: "5px 0" }}>
                <strong>{c.User?.Name || "Unknown"}</strong>:
                {editingCommentId === c.ID ? (
                  <>
                    <input type="text" value={editingText} onChange={(e) => setEditingText(e.target.value)} style={{ marginLeft: "5px", width: "60%" }} />
                    <button onClick={() => handleEditComment(c.ID)} style={{ marginLeft: "5px" }}>Save</button>
                    <button onClick={() => setEditingCommentId(null)} style={{ marginLeft: "5px" }}>Cancel</button>
                  </>
                ) : (
                  <>
                    <span style={{ marginLeft: "5px" }}>{c.Content}</span>
                    {c.UserID === realPost.UserID && (
                      <>
                        <button onClick={() => { setEditingCommentId(c.ID); setEditingText(c.Content); }} style={{ marginLeft: "10px" }}>Edit</button>
                        <button onClick={() => handleDeleteComment(c.ID)} style={{ marginLeft: "5px", color: "red" }}>Delete</button>
                      </>
                    )}
                  </>
                )}
              </div>
            ))}

            {hasMoreComments && <button onClick={() => loadComments(commentsPage + 1)} style={{ marginTop: "5px" }}>Load more comments</button>}
          </div>
        </div>
      )}

      <small style={{ color: "gray", display: "block", marginTop: "10px" }}>
        {realPost.CreatedAt ? new Date(realPost.CreatedAt).toLocaleString() : ""}
      </small>
    </div>
  );
}

const PostCardMemo = memo(PostCard);
export default PostCardMemo;