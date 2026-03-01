import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlusSquare, FiUsers, FiSearch, FiMenu } from 'react-icons/fi';
import logo from '../assets/logo.png';

const TopHeader = ({ user, onToggleSidebar }) => {
    const navigate = useNavigate();

    return (
        <div className="top-header-symbols">
            {/* Menu and Logo on the Left */}
            <div className="header-left-section">
                <button
                    className="sidebar-toggle-in-header"
                    onClick={onToggleSidebar}
                    title="Menu"
                >
                    <FiMenu size={24} />
                </button>
                <img src={logo} alt="Pingfix Logo" className="header-logo" />
            </div>

            {/* Action Symbols in the Center */}
            <div className="center-symbols">
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
            </div>
        </div>
    );
};

export default TopHeader;
