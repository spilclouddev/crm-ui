import React, { useEffect } from "react";

const NotificationsPopup = ({ isOpen, onClose, notifications, markAsRead, markAllAsRead }) => {
  // Add debugging to see what notifications are being passed
  useEffect(() => {
    if (isOpen && notifications.length > 0) {
      console.log("Notifications in popup:", notifications);
    }
  }, [isOpen, notifications]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter(notif => !notif.read).length;

  return (
    <>
      {/* Backdrop to capture outside clicks */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
      ></div>
      
      {/* Popup panel */}
      <div className="fixed right-0 top-16 md:right-4 z-50 w-80 bg-white rounded-md shadow-lg overflow-hidden">
        <div className="py-2 px-3 bg-gray-800 text-white flex justify-between items-center">
          <h3 className="text-sm font-medium">Notifications ({notifications.length})</h3>
          {unreadCount > 0 && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                markAllAsRead();
              }}
              className="text-xs text-blue-300 hover:text-blue-200"
            >
              Mark all as read
            </button>
          )}
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-4 px-3 text-gray-500 text-center">
              No notifications
            </div>
          ) : (
            notifications.map(notification => (
              <div 
                key={notification.id}
                className={`border-b border-gray-200 last:border-0 ${
                  notification.read ? 'bg-white' : 'bg-blue-50'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  markAsRead(notification.id);
                }}
              >
                <div className="py-3 px-4 cursor-pointer hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                    <span className="text-xs text-gray-500">{notification.timestamp}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="py-2 px-3 bg-gray-100 text-center">
          <button 
            className="text-sm text-blue-600 hover:text-blue-800"
            onClick={(e) => {
              e.stopPropagation();
              // Keep panel open when clicking this button
              // Add your view all notifications logic here
            }}
          >
            View all notifications
          </button>
        </div>
      </div>
    </>
  );
};

export default NotificationsPopup;