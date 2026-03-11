import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Clock, X, Info } from 'lucide-react';
import { adminApi } from '../services/api';
import './AdminNotifications.css';

export default function AdminNotifications() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    // Simulated data if backend isn't ready
    const mockNotifications = [
        { id: 1, title: 'Yangi Bemor Ro\'yxati', message: 'Klinikaga yangi bemor ro\'yxatdan o\'tdi.', type: 'info', createdAt: new Date().toISOString(), isRead: false },
        { id: 2, title: 'To\'lov muvaffaqiyatli', message: 'Tizim orqali yangi to\'lov qabul qilindi', type: 'success', createdAt: new Date(Date.now() - 3600000).toISOString(), isRead: false },
        { id: 3, title: 'Tizim xabarnomasi', message: 'Serverda texnik ishlar olib borilmoqda', type: 'warning', createdAt: new Date(Date.now() - 86400000).toISOString(), isRead: true },
    ];

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getNotifications();
            setNotifications(data || []);
            setUnreadCount(data?.filter(n => !n.isRead).length || 0);
        } catch (error) {
            console.warn("Real xabarnomalar olinmadi, mock ishlatilmoqda.");
            setNotifications(mockNotifications);
            setUnreadCount(mockNotifications.filter(n => !n.isRead).length);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Polling for new notifications every 30s
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const markAsRead = async (id, e) => {
        e.stopPropagation();
        try {
            await adminApi.markNotificationAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Xatoni o'qilgan belgishda", error);
            // Optmistic UI update
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };

    const markAllAsRead = async () => {
        try {
            await adminApi.markAllNotificationsAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            // Optmistic UI update
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        }
    };

    const formatTimeAgo = (dateString) => {
        const diff = Date.now() - new Date(dateString).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${Math.max(1, mins)} daq oldin`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} soat oldin`;
        return `${Math.floor(hours / 24)} kun oldin`;
    };

    const getIconForType = (type) => {
        switch (type) {
            case 'success': return <Check size={16} color="#10b981" />;
            case 'warning': return <Clock size={16} color="#f59e0b" />;
            default: return <Info size={16} color="#3b82f6" />;
        }
    };

    return (
        <div className="notifications-container" ref={dropdownRef}>
            <button className="action-btn notification-btn" onClick={() => setIsOpen(!isOpen)} title="Bildirishnomalar">
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="badge pulse">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className="notifications-dropdown slide-down">
                    <div className="notifications-header">
                        <div className="header-title">
                            <h3>Bildirishnomalar</h3>
                            {unreadCount > 0 && <span className="unread-badge">{unreadCount} ta yangi</span>}
                        </div>
                        {unreadCount > 0 && (
                            <button className="mark-all-btn" onClick={markAllAsRead}>
                                Barchasini o'qilgan qilish
                            </button>
                        )}
                    </div>

                    <div className="notifications-list">
                        {loading && notifications.length === 0 ? (
                            <div className="empty-state">Yuklanmoqda...</div>
                        ) : notifications.length === 0 ? (
                            <div className="empty-state">
                                <Bell size={32} color="#cbd5e1" />
                                <p>Yangi bildirishnomalar yo'q</p>
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div key={notification.id} className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}>
                                    <div className={`notification-icon-wrapper ${notification.type || 'info'}`}>
                                        {getIconForType(notification.type)}
                                    </div>
                                    <div className="notification-content">
                                        <div className="notification-title-bar">
                                            <h4>{notification.title}</h4>
                                            {!notification.isRead && (
                                                <button className="mark-read-icon" onClick={(e) => markAsRead(notification.id, e)} title="O'qilgan qilish">
                                                    <Check size={14} />
                                                </button>
                                            )}
                                        </div>
                                        <p>{notification.message}</p>
                                        <span className="notification-time">{formatTimeAgo(notification.createdAt)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
