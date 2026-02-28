import React, { useEffect, useState, useRef, useCallback, memo } from "react";
import { FeedAPI } from "../api/FeedAPI";
import { VotePost, AddComment, DeleteComment, EditComment, GetComments } from "../api/PostAPI";

function Feed() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const observer = useRef();

  // ---------------- Infinite Scroll ----------------
  const lastPostRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // ---------------- Fetch Posts ----------------
  const fetchPosts = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 5 });

    try {
      const res = await FeedAPI(params);
      const data = await res.json();
      setPosts(prev => [...prev, ...data.posts]);

      if (page >= data.pagination.pages) setHasMore(false);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    }

    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, [page]);

  // ---------------- Sync Vote with Feed State ----------------
  const handleVoteInFeed = (postID, type) => {
    setPosts(prevPosts =>
      prevPosts.map(p =>
        p.post.ID === postID
          ? {
              ...p,
              upvotes: type === 1 ? p.upvotes + 1 : p.upvotes,
              downvotes: type === -1 ? p.downvotes + 1 : p.downvotes
            }
          : p
      )
    );
  };

  return (
    <div style={{ maxWidth: "600px", margin: "auto" }}>
      <h2>Dashboard Feed</h2>

      {posts.map((post, index) => {
        const key = `post-${post.post.ID}-${index}`;

        if (index === posts.length - 1) {
          return (
            <div ref={lastPostRef} key={`wrapper-${key}`}>
              <PostCardMemo key={key} post={post} onVote={handleVoteInFeed} />
            </div>
          );
        }

        return <PostCardMemo key={key} post={post} onVote={handleVoteInFeed} />;
      })}

      {loading && <p>Loading...</p>}
      {!hasMore && <p>No more posts</p>}
    </div>
  );
}

// ---------------- PostCard Component ----------------
function PostCard({ post, onVote }) {
  const realPost = post.post;

  const [upvotes, setUpvotes] = useState(post.upvotes);
  const [downvotes, setDownvotes] = useState(post.downvotes);
  const [commentsCount, setCommentsCount] = useState(post.comments);
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
  // 1 = upvoted, -1 = downvoted, 0 = no vote
  // ---------------- Toggle Comments ----------------
  const toggleComments = async () => {
    if (!showComments && !commentsLoaded) {
      await loadComments(1);
    }
    setShowComments(!showComments);
  };

  // ---------------- Load Comments ----------------
  const loadComments = async (page = 1) => {
    try {
      const res = await GetComments(realPost.ID, page, COMMENTS_LIMIT);
      const newComments = Array.isArray(res.comments) ? res.comments : [];

      setCommentList(prev => page === 1 ? newComments : [...prev, ...newComments]);
      setCommentsLoaded(true);

      // Pagination check
      setHasMoreComments(page < res.pagination.pages);
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
    setCommentsCount(prev => prev + 1);
    setCommentText("");
  };

  //----------------- View Group -----------------
  const handleViewGroup = async (groupID) => {
    try {
      const res = await ViewGroupAPI(groupID);
      if (!res.ok) throw new Error("Failed to fetch group details");
      const data = await res.json();
  
      console.log("Group Data:", data);
  
      // e.g., navigate to a Group Details page with the data
      // router.push({ pathname: "/group-details", state: { groupData: data } });
      setGroupDetails(data); // if using local state
    } catch (err) {
      console.error(err);
    }
  };

  // ---------------- Delete Comment ----------------
  const handleDeleteComment = async (id) => {
    const ok = await DeleteComment(id);
    if (ok) {
      setCommentList(commentList.filter(c => c.ID !== id));
      setCommentsCount(prev => prev - 1);
    }
  };


  // ---------------- Edit Comment ----------------
  const handleEditComment = async (id) => {
    if (!editingText.trim()) return;
    const updatedComment = await EditComment(id, editingText);
    setCommentList(commentList.map(c => (c.ID === id ? updatedComment : c)));
    setEditingCommentId(null);
    setEditingText("");
  };

  // ---------------- Vote ----------------
  const handleVote = (type) => {
    // type: 1 = upvote, -1 = downvote
  
    // Optimistic update
    if (userVote === type) {
      // Undo vote
      setUserVote(0);
      if (type === 1) setUpvotes(prev => prev - 1);
      else setDownvotes(prev => prev - 1);
  
      if (onVote) onVote(realPost.ID, 0); // optional: update Feed state
    } else {
      // Remove previous vote if exists
      if (userVote === 1) setUpvotes(prev => prev - 1);
      if (userVote === -1) setDownvotes(prev => prev - 1);
  
      // Apply new vote
      setUserVote(type);
      if (type === 1) setUpvotes(prev => prev + 1);
      else setDownvotes(prev => prev + 1);
  
      if (onVote) onVote(realPost.ID, type);
    }
  
    // Send API call (optimistic)
    VotePost(realPost.ID, type).catch(err => {
      console.error("Vote failed:", err);
      // Optionally rollback userVote and counts
    });
  };

  // ---------------- Share ----------------
  const handleShare = () => {
    navigator.clipboard.writeText(post.share_url);
    alert("Share link copied!");
  };

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: "10px", padding: "15px", marginBottom: "20px", background: "white" }}>
      <p>
        <strong>{realPost.User?.Name}</strong> in <span style={{ color: "gray" }}>{realPost.Group?.Name}</span>
      </p>
      <button onClick={() => handleViewGroup(post.post.GroupID)}>
        View Group
      </button>

      <p>{realPost.Content}</p>

      {realPost.Images?.map(img => (
        <img key={img.ID} src={`http://localhost:8080/${img.URL}`} alt="" style={{ width: "100%", borderRadius: "8px", marginTop: "10px" }} />
      ))}

      <div style={{ marginTop: "8px" }}>
        {realPost.Tags?.map(tag => (
          <span key={tag.ID} style={{ marginRight: "8px", color: "#007bff" }}>#{tag.Name}</span>
        ))}
      </div>

      <div>
        {realPost.Links?.map(link => (
          <div key={link.ID}>
            <a href={link.URL} target="_blank" rel="noopener noreferrer">{link.URL}</a>
          </div>
        ))}
      </div>

      <hr style={{ margin: "10px 0" }} />

      {/* ACTION BAR */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
      <div>
        <button 
          onClick={() => handleVote(1)}
          disabled={userVote === -1} // disable if downvoted
          style={{ 
            color: userVote === 1 ? "black" : "gray" 
          }}
        >
          👍
        </button> 
        {upvotes}

        <button 
          onClick={() => handleVote(-1)}
          disabled={userVote === 1} // disable if upvoted
          style={{ 
            color: userVote === -1 ? "black" : "gray" 
          }}
        >
          👎
        </button> 
        {downvotes}
      </div>

        <div>
          <button onClick={toggleComments} style={{ background: "none", border: "none", cursor: "pointer" }}>
            💬 {commentsCount} comments
          </button>
        </div>

        <button onClick={handleShare}>🔗 Share</button>
      </div>

      {/* COMMENT SECTION */}
      {showComments && (
        <div style={{ marginTop: "10px" }}>
          <input
            type="text"
            placeholder="Write a comment..."
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            style={{ width: "80%" }}
          />
          <button onClick={handleAddComment}>Post</button>

          <div style={{ marginTop: "10px" }}>
            {Array.isArray(commentList) && commentList.map(c => (
              <div key={`comment-${c.ID}`} style={{ borderTop: "1px solid #eee", padding: "5px 0" }}>
                <strong>{c.User?.Name}</strong>:
                {editingCommentId === c.ID ? (
                  <>
                    <input
                      type="text"
                      value={editingText}
                      onChange={e => setEditingText(e.target.value)}
                      style={{ marginLeft: "5px", width: "60%" }}
                    />
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

            {hasMoreComments && (
              <button onClick={() => loadComments(commentsPage + 1)} style={{ marginTop: "5px" }}>
                Load more comments
              </button>
            )}
          </div>
        </div>
      )}

      <small style={{ color: "gray", display: "block", marginTop: "10px" }}>
        {new Date(realPost.CreatedAt).toLocaleString()}
      </small>
    </div>
  );
}

const PostCardMemo = memo(PostCard);

export default Feed;