import React, { useEffect, useState, useRef, useCallback } from "react";
import { FeedAPI } from "../api/FeedAPI";
import { VotePost, AddComment, DeleteComment , EditComment, GetComments} from "../api/PostAPI";

function Feed() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const observer = useRef();

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

  const fetchPosts = async () => {
    setLoading(true);

    const params = new URLSearchParams({
      page: page,
      limit: 5,
    });

    try {
      const res = await FeedAPI(params);
      const data = await res.json();

      setPosts(prev => [...prev, ...data.posts]);

      if (page >= data.pagination.pages) {
        setHasMore(false);
      }
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [page]);

  

  return (
    <div style={{ maxWidth: "600px", margin: "auto" }}>
      <h2>Dashboard Feed</h2>

      {posts.map((post, index) => {
      if (index === posts.length - 1) {
        return (
          <div ref={lastPostRef} key={post.post.ID}>
            <PostCard post={post} />
          </div>
        );
      }
      return <PostCard key={post.post.ID} post={post} />;
    })}

      {loading && <p>Loading...</p>}
      {!hasMore && <p>No more posts</p>}
    </div>
  );
}

function PostCard({ post }) {
  const realPost = post.post;
  const [upvotes, setUpvotes] = useState(post.upvotes);
  const [downvotes, setDownvotes] = useState(post.downvotes);
  const [commentsCount, setCommentsCount] = useState(post.comments);
  const [commentText, setCommentText] = useState("");
  const [commentList, setCommentList] = useState(realPost.Comments || []);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [showComments, setShowComments] = useState(false);
  
  const toggleComments = async () => {
    if (!showComments) {
      // Fetch comments from backend
      const comments = await GetComments(realPost.ID);
      setCommentList(comments);
    }
    setShowComments(!showComments);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(post.share_url);
    alert("Share link copied!");
  };

  const handleVote = async (type) => {
    await VotePost(realPost.ID, type);
    if (type === 1) setUpvotes(upvotes + 1);
    else setDownvotes(downvotes + 1);
  };

  const handleAddComment = async () => {
    if (!commentText) return;
    const newComment = await AddComment(realPost.ID, commentText);
    setCommentList([newComment, ...commentList]);
    setCommentsCount(commentsCount + 1);
    setCommentText("");
  };

  const handleDeleteComment = async (id) => {
    const ok = await DeleteComment(id);
    if (ok) {
      setCommentList(commentList.filter(c => c.ID !== id));
      setCommentsCount(commentsCount - 1);
    }
  };

  const handleEditComment = async (id) => {
    if (!editingText) return;
    const updatedComment = await EditComment(id, editingText);
    setCommentList(commentList.map(c => c.ID === id ? updatedComment : c));
    setEditingCommentId(null);
    setEditingText("");
  };

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: "10px", padding: "15px", marginBottom: "20px", background: "white" }}>
      <p>
        <strong>{realPost.User?.Name}</strong> in <span style={{ color: "gray" }}>{realPost.Group?.Name}</span>
      </p>

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
          <button onClick={() => handleVote(1)}>👍</button> {upvotes}
          <button onClick={() => handleVote(-1)} style={{ marginLeft: "8px" }}>👎</button> {downvotes}
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
            {commentList.map(c => (
              <div key={c.ID} style={{ borderTop: "1px solid #eee", padding: "5px 0" }}>
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
          </div>
        </div>
      )}

      <small style={{ color: "gray", display: "block", marginTop: "10px" }}>
        {new Date(realPost.CreatedAt).toLocaleString()}
      </small>
    </div>
  );
}

export default Feed;