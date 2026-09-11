// src/components/Notifications/NotificationList.jsx

import React, { useState, useEffect } from 'react';
import { getUnreadNotifications, markNotificationAsRead } from '../../api';

/**
 * NotificationList Component
 * Floating bell with the signed-in user's unread notifications (polled every 30 seconds)
 */
const NotificationList = ({ token }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true); // Start minimized by default
  const [position, setPosition] = useState('top-right'); // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Fetch notifications from API
  useEffect(() => {
    if (!token) return undefined;
    let firstLoad = true;

    const fetchNotifications = async () => {
      try {
        if (firstLoad) setLoading(true);
        const data = await getUnreadNotifications(token);
        setNotifications(data.notifications || []);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        firstLoad = false;
        setLoading(false);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [token]);

  // Add global mouse move and mouse up listeners for dragging
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        e.preventDefault();
      }
    };

    const handleGlobalMouseUp = (e) => {
      if (isDragging) {
        handleDragEnd(e);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  const markAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(token, notificationId);
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };
  // Handle drag start
  const handleDragStart = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // Handle drag end - snap to nearest corner
  const handleDragEnd = (e) => {
    if (!isDragging) return;
    setIsDragging(false);

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    // Determine which corner is closest
    const isLeft = mouseX < windowWidth / 2;
    const isTop = mouseY < windowHeight / 2;

    const newPosition = `${isTop ? 'top' : 'bottom'}-${isLeft ? 'left' : 'right'}`;
    setPosition(newPosition);
  };

  // Get position styles based on current position
  const getPositionStyles = () => {
    const [vertical, horizontal] = position.split('-');
    return {
      [vertical]: '20px',
      [horizontal]: '20px'
    };
  };
  // Simple CSS styles for the notification box
  const styles = {
    container: {
      position: 'fixed',
      ...getPositionStyles(),
      width: isMinimized ? '50px' : '300px',
      zIndex: 1000,
      fontFamily: 'Arial, sans-serif',
      transition: isDragging ? 'none' : 'all 0.3s ease',
      cursor: isDragging ? 'grabbing' : 'auto'
    },
    bellIcon: {
      backgroundColor: '#667eea',
      color: '#fff',
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      position: 'relative',
      userSelect: 'none'
    },
    badge: {
      position: 'absolute',
      top: '-5px',
      right: '-5px',
      backgroundColor: '#f5576c',
      color: '#fff',
      borderRadius: '50%',
      width: '22px',
      height: '22px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: 'bold',
      border: '2px solid #fff'
    },
    header: {
      backgroundColor: '#667eea',
      color: '#fff',
      padding: '10px 15px',
      borderRadius: '5px 5px 0 0',
      fontSize: '16px',
      fontWeight: 'bold',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      cursor: isDragging ? 'grabbing' : 'grab',
      userSelect: 'none'
    },
    dragHandle: {
      fontSize: '12px',
      opacity: 0.7,
      marginRight: '10px',
      cursor: 'grab'
    },
    toggleButton: {
      background: 'transparent',
      border: 'none',
      color: '#fff',
      fontSize: '18px',
      cursor: 'pointer',
      padding: '0 5px',
      transition: 'transform 0.2s'
    },
    list: {
      backgroundColor: '#fff',
      border: '1px solid #ddd',
      borderTop: 'none',
      borderRadius: '0 0 5px 5px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      maxHeight: '400px',
      overflowY: 'auto',
      display: isMinimized ? 'none' : 'block'
    },
    item: {
      padding: '15px',
      borderBottom: '1px solid #eee',
      cursor: 'pointer',
      transition: 'background 0.2s',
      '&:hover': { backgroundColor: '#f5f5f5' }
    },
    title: {
      fontWeight: 'bold',
      marginBottom: '5px',
      display: 'block',
      color: '#1a1a1a'
    },
    body: {
      fontSize: '14px',
      color: '#555',
      margin: 0,
      marginBottom: '8px'
    },
    timestamp: {
      fontSize: '12px',
      color: '#999'
    },
    emptyState: {
      padding: '20px',
      textAlign: 'center',
      color: '#999'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        {isMinimized ? (
          <div 
            style={styles.bellIcon}
            onMouseDown={handleDragStart}
            onMouseUp={handleDragEnd}
            onClick={(e) => {
              if (!isDragging) {
                setIsMinimized(false);
              }
            }}
          >
            🔔
          </div>
        ) : (
          <>
            <div 
              style={styles.header} 
              onMouseDown={handleDragStart}
              onMouseUp={handleDragEnd}
            >
              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <span style={styles.dragHandle}>⋮⋮</span>
                <span>Notifications</span>
              </div>
              <button 
                style={styles.toggleButton}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(true);
                }}
              >
                ▲
              </button>
            </div>
            <div style={styles.emptyState}>Loading...</div>
          </>
        )}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {isMinimized ? (
        <div 
          style={styles.bellIcon}
          onMouseDown={handleDragStart}
          onMouseUp={handleDragEnd}
          onClick={(e) => {
            if (!isDragging) {
              setIsMinimized(false);
            }
          }}
        >
          🔔
          {notifications.length > 0 && (
            <span style={styles.badge}>{notifications.length}</span>
          )}
        </div>
      ) : (
        <>
          <div 
            style={styles.header} 
            onMouseDown={handleDragStart}
            onMouseUp={handleDragEnd}
          >
            <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <span style={styles.dragHandle}>⋮⋮</span>
              <span>🔔 Notifications ({notifications.length})</span>
            </div>
            <button 
              style={styles.toggleButton}
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(true);
              }}
            >
              ▲
            </button>
          </div>
          <div style={styles.list}>
            {notifications.length === 0 ? (
              <div style={styles.emptyState}>No new notifications</div>
            ) : (
              notifications.map((note) => (
                <div 
                  key={note.id} 
                  style={styles.item}
                  onClick={() => markAsRead(note.id)}
                >
                  <span style={styles.title}>
                    {note.type === 'reminder' && '⏰ '}
                    {note.type === 'milestone' && '🎉 '}
                    {note.type === 'alert' && '⚠️ '}
                    {note.title}
                  </span>
                  <p style={styles.body}>{note.message}</p>
                  <span style={styles.timestamp}>
                    {new Date(note.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationList;