import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlusSquare, FiUsers, FiSearch } from 'react-icons/fi';

const TopHeader = ({ user }) => {
    const navigate = useNavigate();

    return (
        <div className="top-header-symbols">
            <button
                className="symbol-btn"
                onClick={() => navigate('/post/createpost')}
                title="Create Post"
            >
                <FiPlusSquare size={24} />
            </button>
            <button
                className="symbol-btn"
                onClick={() => navigate('/group/search')}
                title="Search for Groups"
            >
                <FiSearch size={24} />
            </button>
            <button
                className="symbol-btn"
                onClick={() => navigate('/group/register')}
                title="Create Group"
            >
                <FiUsers size={24} />
            </button>

            {/* Profile Section */}
            <div className="header-profile">
                <div className="header-avatar">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="header-user-info">
                    <span className="header-user-name">{user?.name || "User"}</span>
                </div>
            </div>
        </div>
    );
};

export default TopHeader;
