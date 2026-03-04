import React, { useState, memo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { GetCurrentUserAPI } from "../api/UserAPI";
import { VotePost, AddComment, DeleteComment, EditComment, GetComments, ResolvePost } from "../api/PostAPI";
import SecureInput from "../wrapper/SecureInput";
import { FiArrowUp, FiArrowDown, FiCheckCircle, FiMessageSquare, FiShare2 } from 'react-icons/fi';

// ---------------- PostCard Component ----------------
function PostCard({ post, onVote, onDelete, hideViewGroup = false }) {
  const realPost = post?.post || {};

  const [upvotes, setUpvotes] = useState(post?.upvotes || 0);
  const [downvotes, setDownvotes] = useState(post?.downvotes || 0);
  const [resolves, setResolves] = useState(post?.resolve_count || 0);
  const [commentsCount, setCommentsCount] = useState(post?.comment_count !== undefined ? post.comment_count : post?.comments || 0);

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const res = await GetCurrentUserAPI();
      if (!res.ok) throw new Error("Not logged in");
      return res.json();
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
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
    <div className="ig-post-card">
      <div className="ig-post-header">
        <div className="ig-post-header-left">
          <div className="ig-avatar">
            {realPost.User?.Name ? realPost.User.Name.charAt(0).toUpperCase() : "U"}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 'bold', fontSize: '0.95em', color: '#fff' }}>
              {realPost.User?.Name || "Unknown User"}
            </span>
            {!hideViewGroup && (
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8em" }}>
                in {realPost.Group?.Name || "Unknown Group"}
              </span>
            )}
          </div>
        </div>
        {!hideViewGroup && (
          <button style={{ background: 'none', border: 'none', color: '#F47D34', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85em' }} onClick={() => handleViewGroup(realPost.GroupID)}>
            View Group
          </button>
        )}
      </div>

      {/* -------------------------- CONTENT--------------------------- */}

      <div className="ig-post-content">
        <p style={{ margin: '0 0 10px 0', fontSize: '0.95em', lineHeight: '1.5' }}>{realPost.Content || ""}</p>

        {Array.isArray(realPost.Images) && realPost.Images.map((img) => {
        const imgSrc = img.URL.startsWith("https") ? img.URL : `http://localhost:8080/${img.URL}`;
        return (
          <img
            key={img.ID}
            src={imgSrc}
            alt=""
            style={{
              width: "100%",           // fill container width
              maxWidth: "600px",       // optional max width
              maxHeight: "400px",      // optional max height
              borderRadius: "8px",     // rounded corners
              marginTop: "10px",
              objectFit: "cover",      // maintain aspect ratio, crop if necessary
              display: "block",        // avoids inline spacing issues
              marginLeft: "auto",      // center image
              marginRight: "auto"
            }}
          />
        );
      })}

        <div style={{ marginTop: "10px" }}>
          {Array.isArray(realPost.Tags) && realPost.Tags.map((tag) => (
            <span key={tag.ID} style={{ marginRight: "8px", color: "#F47D34", fontSize: '0.9em' }}>#{tag.Name}</span>
          ))}
        </div>

        <div>
          {Array.isArray(realPost.Links) && realPost.Links.map((link) => (
            <div key={link.ID} style={{ marginTop: "5px" }}>
              <a href={link.URL} target="_blank" rel="noopener noreferrer" style={{ color: "#F47D34", fontSize: '0.9em' }}>{link.URL}</a>
            </div>
          ))}
        </div>
      </div>

      <div className="ig-post-actions">
        <div className="ig-action-icons">
          <button className="ig-action-btn" onClick={() => handleVote(1)} disabled={userVote === -1} style={{ color: userVote === 1 ? "#F47D34" : "#fff" }}>
            <FiArrowUp size={24} />
          </button>
          <button className="ig-action-btn" onClick={() => handleVote(-1)} disabled={userVote === 1} style={{ color: userVote === -1 ? "#F47D34" : "#fff" }}>
            <FiArrowDown size={24} />
          </button>
          <button className="ig-action-btn" onClick={toggleComments}>
            <FiMessageSquare size={24} />
          </button>
        </div>
        <button className="ig-action-btn" onClick={handleShare}>
          <FiShare2 size={24} />
        </button>
      </div>

      <div className="ig-post-stats">
        <span style={{ marginRight: '15px' }}>{upvotes} likes • {downvotes} dislikes • {resolves} resolved</span>
        <span>{commentsCount} comments</span>
      </div>

      {showComments && (
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <SecureInput
              className="ig-input"
              placeholder="Add a comment..."
              value={commentText}
              onChange={setCommentText}
              allowSpace={true}
              style={{ flex: 1, marginBottom: 0 }}
            />
            <button className="ig-btn" onClick={handleAddComment} style={{ width: 'auto', margin: 0 }}>Post</button>
          </div>

          <div style={{ marginTop: "10px", display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Array.isArray(commentList) && commentList.map((c) => (
              <div key={`comment-${c.ID}`} style={{ padding: "5px 0", fontSize: '0.9em' }}>
                <span style={{ fontWeight: 'bold', marginRight: '5px' }}>{c.User?.Name || "Unknown"}</span>
                {editingCommentId === c.ID ? (
                  <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                    <SecureInput
                      className="ig-input"
                      value={editingText}
                      onChange={setEditingText}
                      allowSpace={true}
                      style={{ marginBottom: 0, padding: '5px' }}
                    />
                    <button className="ig-btn" onClick={() => handleEditComment(c.ID)} style={{ width: 'auto', margin: 0, padding: '4px 8px' }}>Save</button>
                    <button className="ig-btn-outline" onClick={() => setEditingCommentId(null)} style={{ width: 'auto', margin: 0, padding: '4px 8px' }}>Cancel</button>
                  </div>
                ) : (
                  <>
                    <span style={{ color: 'rgba(255,255,255,0.9)' }}>{c.Content}</span>
                    {c.UserID === currentUser?.id && (
                      <div style={{ marginTop: '4px' }}>
                        <button style={{ background: 'none', border: 'none', color: '#aaa', fontSize: '0.8em', cursor: 'pointer', padding: 0, marginRight: '10px' }} onClick={() => { setEditingCommentId(c.ID); setEditingText(c.Content); }}>Edit</button>
                        <button style={{ background: 'none', border: 'none', color: '#ff4d4f', fontSize: '0.8em', cursor: 'pointer', padding: 0 }} onClick={() => handleDeleteComment(c.ID)}>Delete</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}

            {hasMoreComments && <button style={{ background: 'none', border: 'none', color: '#F47D34', cursor: 'pointer', textAlign: 'left', padding: 0, fontSize: '0.85em', marginTop: '5px' }} onClick={() => loadComments(commentsPage + 1)}>View more comments</button>}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: "0 16px 16px" }}>
        <small style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75em", textTransform: "uppercase" }}>
          {realPost.CreatedAt ? new Date(realPost.CreatedAt).toLocaleString() : ""}
        </small>

        {onDelete && (
          <button
            onClick={() => onDelete(realPost.ID)}
            style={{
              background: "transparent",
              color: "#ff4d4f",
              border: "1px solid rgba(255,77,79,0.3)",
              borderRadius: "20px",
              padding: "4px 10px",
              fontSize: "0.7em",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            Delete Post
          </button>
        )}
      </div>
    </div>
  );
}

const PostCardMemo = memo(PostCard);
export default PostCardMemo;