import { Menu, Search, Sun, Moon, Maximize, Grid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminNotifications from './AdminNotifications';
import './Header.css';

const Header = ({ toggleSidebar, isSidebarOpen, isDarkMode, toggleTheme }) => {
    const navigate = useNavigate();

    return (
        <header className="main-header">
            {/* Left: Menu Button */}
            <div className="header-left">
                <button className="sidebar-toggle" onClick={toggleSidebar}>
                    <Menu size={20} />
                </button>
            </div>

            {/* Center: Search Bar */}
            <div className="header-center">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input type="text" placeholder="Search..." />
                </div>
            </div>

            {/* Right: Actions + User */}
            <div className="header-right">
                <div className="header-actions">
                    <button className="action-btn" onClick={toggleTheme} title="Toggle Theme">
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    <AdminNotifications />

                    <button className="action-btn" title="Messages">
                        <Grid size={20} />
                    </button>

                    <button className="action-btn" title="Fullscreen">
                        <Maximize size={20} />
                    </button>
                </div>

                <div className="user-menu" onClick={() => navigate('/admin/profile')}>
                    <img src="https://medicare-dashboard-template.multipurposethemes.com/bs5/images/avatar/1.jpg" alt="User" className="user-img" />
                    <div className="user-details">
                        <span className="user-name">Dr. Jhon Doe</span>
                        <span className="user-role">Administrator</span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
