import React, { useState, useEffect } from 'react';
import { getUnreadNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../../api';

/**
 * NotificationBell - Çan İkonu Bileşeni
 * FR17: In-App Notifications
 * 
 * Bu bileşen kullanıcının okunmamış bildirimlerini gösterir.
 * Sağ üstte çan ikonu olarak görünür ve tıklandığında dropdown açılır.
 */
const NotificationBell = ({ token }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Bildirimleri backend'den çek
  const fetchNotifications = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const data = await getUnreadNotifications(token);
      setNotifications(data.notifications || []);
      setUnreadCount(data.count || 0);
    } catch (error) {
      console.error('Bildirimler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  // Komponent yüklendiğinde ve her 30 saniyede bir bildirimleri çek
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30 saniye polling
    return () => clearInterval(interval);
  }, [token]);

  // Tek bir bildirimi okundu işaretle
  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(token, notificationId);
      await fetchNotifications(); // Listeyi yenile
    } catch (error) {
      console.error('Bildirim işaretlenemedi:', error);
    }
  };

  // Tüm bildirimleri okundu işaretle
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(token);
      await fetchNotifications(); // Listeyi yenile
    } catch (error) {
      console.error('Bildirimler işaretlenemedi:', error);
    }
  };

  // Bildirim tipine göre emoji döndür
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'alert': return '⚠️';
      case 'milestone': return '🎉';
      case 'reminder': return '⏰';
      case 'system': return '📢';
      default: return '📬';
    }
  };

  // Bildirim tipine göre renk döndür
  const getNotificationColor = (type) => {
    switch (type) {
      case 'alert': return '#ff9800';
      case 'milestone': return '#4caf50';
      case 'reminder': return '#2196f3';
      case 'system': return '#9c27b0';
      default: return '#666';
    }
  };

  // Zaman farkını hesapla (örn: "5 dakika önce")
  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffMs = now - notifTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  const styles = {
    container: {
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000
    },
    bell: {
      position: 'relative',
      background: 'white',
      border: '2px solid #667eea',
      borderRadius: '50%',
      width: '50px',
      height: '50px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      fontSize: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      transition: 'all 0.3s ease'
    },
    badge: {
      position: 'absolute',
      top: '-5px',
      right: '-5px',
      background: '#f44336',
      color: 'white',
      borderRadius: '50%',
      width: '22px',
      height: '22px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: 'bold',
      border: '2px solid white'
    },
    dropdown: {
      position: 'absolute',
      top: '60px',
      right: '0',
      width: '360px',
      maxHeight: '500px',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      overflow: 'hidden',
      display: isOpen ? 'flex' : 'none',
      flexDirection: 'column'
    },
    header: {
      padding: '16px',
      borderBottom: '1px solid #e0e0e0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: '#f5f5f5'
    },
    headerTitle: {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#333'
    },
    markAllButton: {
      background: 'none',
      border: 'none',
      color: '#667eea',
      fontSize: '13px',
      cursor: 'pointer',
      padding: '4px 8px',
      borderRadius: '4px',
      transition: 'background 0.2s'
    },
    notificationList: {
      maxHeight: '400px',
      overflowY: 'auto'
    },
    notificationItem: {
      padding: '16px',
      borderBottom: '1px solid #f0f0f0',
      cursor: 'pointer',
      transition: 'background 0.2s',
      display: 'flex',
      gap: '12px'
    },
    notificationIcon: {
      fontSize: '24px',
      flexShrink: 0
    },
    notificationContent: {
      flex: 1
    },
    notificationTitle: {
      fontSize: '14px',
      fontWeight: 'bold',
      marginBottom: '4px',
      color: '#333'
    },
    notificationMessage: {
      fontSize: '13px',
      color: '#666',
      lineHeight: '1.4'
    },
    notificationTime: {
      fontSize: '11px',
      color: '#999',
      marginTop: '4px'
    },
    emptyState: {
      padding: '40px 20px',
      textAlign: 'center',
      color: '#999',
      fontSize: '14px'
    },
    emptyIcon: {
      fontSize: '48px',
      marginBottom: '12px'
    }
  };

  return (
    <div style={styles.container}>
      {/* Çan İkonu */}
      <div 
        style={styles.bell}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        🔔
        {unreadCount > 0 && (
          <div style={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</div>
        )}
      </div>

      {/* Bildirim Dropdown */}
      <div style={styles.dropdown}>
        {/* Header */}
        <div style={styles.header}>
          <span style={styles.headerTitle}>
            Notifications {unreadCount > 0 && `(${unreadCount})`}
          </span>
          {unreadCount > 0 && (
            <button 
              style={styles.markAllButton}
              onClick={handleMarkAllAsRead}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Bildirim Listesi */}
        <div style={styles.notificationList}>
          {loading ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>⏳</div>
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>✅</div>
              No new notifications
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                style={styles.notificationItem}
                onClick={() => handleMarkAsRead(notif.id)}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f9f9f9'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
              >
                <div style={styles.notificationIcon}>
                  {getNotificationIcon(notif.type)}
                </div>
                <div style={styles.notificationContent}>
                  <div style={{
                    ...styles.notificationTitle,
                    color: getNotificationColor(notif.type)
                  }}>
                    {notif.title}
                  </div>
                  <div style={styles.notificationMessage}>{notif.message}</div>
                  <div style={styles.notificationTime}>{getTimeAgo(notif.timestamp)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationBell;

