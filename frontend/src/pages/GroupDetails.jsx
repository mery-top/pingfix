import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ViewGroupAPI } from "../api/GroupAPI";

function GroupDetails() {
  const { id } = useParams(); // group ID from URL
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const res = await ViewGroupAPI(id);
        if (!res.ok) throw new Error("Failed to fetch group details");
        const data = await res.json();
        setGroup(data);
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
      <h2>{group.name}</h2>
      <p>{group.description}</p>
      <p>Subscribers: {group.subscribers?.length || 0}</p>
      {/* Add Join, Leave buttons if needed */}
    </div>
  );
}

export default GroupDetails;