import React from 'react'
import { MyPostsAPI } from '../api/PostAPI'
import { useState, useEffect } from 'react'
function MyPosts() {
    const [pagination, setPagination] = useState({})
    const [message, setMessage] = useState("")
    const [pages, setPage] = useState(1)
    const [posts, setPosts] = useState([]) 

    const fetchPosts = async () =>{
        const params = new URLSearchParams({
            page: pages,
            limit: 5,
        })

        try{
            const res = await MyPostsAPI(params)
            if (!res.ok) {
                const text = await res.text()  
                throw new Error(text)
            }

            const data = await res.json()
            setPosts(data.posts) 
            setPagination(data.pagination)
        }catch(error){
            console.log(error)
        }
    }

    useEffect(() => {
        fetchPosts()
      }, [pages]) 

  return (
    <>
    <div>MyPosts</div>

    <ul>
        {posts.map((post) => (
          <li key={post.id} style={{ marginBottom: '1rem' }}>
            <p><strong>{post.username}</strong> in <em>{post.group_name}</em></p>
            <p>{post.content}</p>
            <small>Posted on {new Date(post.created_at).toLocaleString()}</small>
          </li>
        ))}
      </ul>


    <div>
        {pagination.page > 1 && (
            <button onClick={() => setPage(pages - 1)}>Previous</button>
        )}

        {pagination.page < pagination.pages && (
            <button onClick={() => setPage(pages + 1)}>Next</button>
        )}
    </div>
    </>
  )
}
export default MyPosts