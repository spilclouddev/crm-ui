import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Import components
import LeadsAndOpportunities from "../LeadsAndOpportunities";
import TaskManagement from "../TaskManagement";
import ContactManagement from "../ContactManagement";
import NotificationsPopup from "../CRM_Dashboard/notificationPopup";
import { Menu, X, Bell } from "lucide-react";

// Local storage key for notifications
const NOTIFICATIONS_STORAGE_KEY = "crm_notifications";
const API_BASE_URL = `https://crm-be.fly.dev/api`; // Adjust this to match your backend URL

const sections = [
  { id: "contact", name: "Contact Management" },
  { id: "leads", name: "Leads & Opportunities Tracking" },
  { id: "tasks", name: "Task Management" },
  { id: "reporting", name: "Dashboard" },
  { id: "logout", name: "Log Out" },
];

const Sidebar = ({
  onSelect,
  selectedSection,
  onLogout,
  isMobileMenuOpen,
  setMobileMenuOpen,
}) => {
  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden md:block w-64 bg-gray-800 h-screen fixed left-0 top-0 p-4 text-white overflow-auto">
        <h2 className="text-lg font-semibold mb-4">SPIL CRM</h2>
        {sections.map((section) => (
          <button
            key={section.id}
            className={`block w-full text-left p-2 mb-2 ${
              selectedSection.id === section.id ? "bg-gray-600" : "bg-gray-700"
            } hover:bg-gray-600 rounded`}
            onClick={() => {
              if (section.id === "logout") {
                onLogout();
              } else {
                onSelect(section);
              }
            }}
          >
            {section.name}
          </button>
        ))}
      </div>

      {/* Mobile Sidebar - Slides in from left */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setMobileMenuOpen(false)}
          ></div>

          {/* Mobile menu */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gray-800 text-white shadow-xl">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>

            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <h2 className="text-lg font-semibold">Spil Labs</h2>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    className={`block w-full text-left p-3 mb-2 ${
                      selectedSection.id === section.id
                        ? "bg-gray-600"
                        : "bg-gray-700"
                    } hover:bg-gray-600 rounded`}
                    onClick={() => {
                      if (section.id === "logout") {
                        onLogout();
                      } else {
                        onSelect(section);
                        setMobileMenuOpen(false);
                      }
                    }}
                  >
                    {section.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const TopBar = ({
  title,
  setMobileMenuOpen,
  toggleNotifications,
  unreadCount,
}) => {
  return (
    <div className="fixed top-0 left-0 right-0 md:left-64 bg-gray-900 text-white p-4 flex items-center z-10">
      {/* Mobile menu button */}
      <button
        className="md:hidden mr-4 text-white focus:outline-none"
        onClick={() => setMobileMenuOpen(true)}
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Title */}
      <div className="flex-1 text-center md:text-left text-lg font-semibold">
        {title || "Spil Labs"}
      </div>

      {/* Notification Bell Icon */}
      <button
        className="relative text-white p-2 rounded-full hover:bg-gray-700 focus:outline-none"
        onClick={toggleNotifications}
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};

// Main content renderer that switches between different components based on selection
const Content = ({ selectedSection }) => {
  switch (selectedSection.id) {
    case "contact":
      return <ContactManagement />;
    case "leads":
      return <LeadsAndOpportunities />;
    case "tasks":
      return <TaskManagement />;
    default:
      return (
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">{selectedSection.name}</h1>
          <p>Content for {selectedSection.name} will be displayed here.</p>
        </div>
      );
  }
};

const CRM_Dashboard = () => {
  const navigate = useNavigate();
  const [selectedSection, setSelectedSection] = useState(sections[0]);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Function to fetch pending notifications from backend
  const fetchPendingNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      console.log("Checking for pending notifications from backend...");

      const response = await fetch(
        `${API_BASE_URL}/tasks/notifications/pending`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const newNotifications = await response.json();

      if (newNotifications.length > 0) {
        console.log(
          `Found ${newNotifications.length} new notifications for your tasks:`,
          newNotifications
        );

        // Add new notifications to state (avoiding duplicates)
        setNotifications((prev) => {
          // Debug logging
          console.log("Current notifications:", prev);

          // Filter out notifications we already have
          const uniqueNewNotifications = newNotifications.filter((newNotif) => {
            // Convert IDs to strings for reliable comparison
            const newId = newNotif.reminderId && newNotif.reminderId.toString();

            // Check if this notification already exists in our current list
            const exists = prev.some((existingNotif) => {
              const existingId =
                existingNotif.reminderId && existingNotif.reminderId.toString();
              return existingNotif.id === newNotif.id || existingId === newId;
            });

            return !exists;
          });

          if (uniqueNewNotifications.length > 0) {
            console.log(
              `Adding ${uniqueNewNotifications.length} unique new notifications:`,
              uniqueNewNotifications
            );

            // Show notification panel first
            setShowNotifications(true);

            // Delay marking as processed to ensure user sees the notification
            setTimeout(() => {
              uniqueNewNotifications.forEach(async (notification) => {
                if (notification.reminderId) {
                  try {
                    await fetch(
                      `${API_BASE_URL}/tasks/notifications/${notification.reminderId}/processed`,
                      {
                        method: "PUT",
                        headers: {
                          Authorization: `Bearer ${token}`,
                          "Content-Type": "application/json",
                        },
                      }
                    );
                    console.log(
                      `Marked notification ${notification.reminderId} as processed on backend`
                    );
                  } catch (err) {
                    console.error(
                      "Error marking notification as processed:",
                      err
                    );
                  }
                }
              });
            }, 10000); // 10 second delay

            // Return combined notifications (new ones first)
            return [...uniqueNewNotifications, ...prev];
          }

          return prev;
        });
      }
    } catch (error) {
      console.error("Error fetching notifications from backend:", error);
    }
  };

  // Set up polling for backend notifications
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    console.log("Setting up notification polling from backend");

    // Check for backend notifications more frequently (10 seconds)
    const backendCheckInterval = setInterval(fetchPendingNotifications, 10000);

    // Initial check on mount
    fetchPendingNotifications();

    return () => {
      console.log("Cleaning up notification polling");
      clearInterval(backendCheckInterval);
    };
  }, []);

  // Load notifications from storage on mount - with user filtering
  useEffect(() => {
    // Load initial notifications from storage
    const loadNotifications = async () => {
      console.log("Loading notifications from storage");
      const storedNotifications = localStorage.getItem(
        NOTIFICATIONS_STORAGE_KEY
      );

      if (storedNotifications) {
        try {
          // Parse stored notifications
          const parsed = JSON.parse(storedNotifications);
          console.log("All stored notifications:", parsed);

          // Get the current user information to filter notifications
          const token = localStorage.getItem("token");
          if (!token) return;

          try {
            // Get user profile to know current username (this is just an example - adjust to how your app gets current user)
            const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (userResponse.ok) {
              const userData = await userResponse.json();
              const currentUsername = userData.name;

              console.log(
                `Filtering notifications for current user: ${currentUsername}`
              );

              // Set notifications state with only notifications for this user
              setNotifications((prev) => {
                // If we already have notifications from API, don't override with storage
                if (prev.length > 0) return prev;

                // Your stored notifications might not have user info - if not, you'll need to adapt this
                // This assumes each notification has some assigned user information
                // If your stored notifications don't have this, you may need to fetch fresh ones from API
                return parsed;
              });

              // Check if there are unread notifications
              const hasUnread = parsed.some((notif) => !notif.read);
              if (hasUnread) {
                console.log(
                  "Found unread notifications, showing notification panel"
                );
                setShowNotifications(true);
              }
            }
          } catch (err) {
            console.error("Error fetching user data:", err);
          }
        } catch (err) {
          console.error("Error parsing stored notifications:", err);
        }
      }
    };

    loadNotifications();

    // Listen for task reminder events (from local event system)
    const handleTaskReminder = (event) => {
      console.log("Task reminder event received:", event.detail);

      if (event.detail && event.detail.notification) {
        const { notification } = event.detail;

        // Add notification to the list and show notification panel
        setNotifications((prev) => {
          // Check if notification with this ID already exists to avoid duplicates
          const exists = prev.some((n) => n.id === notification.id);
          if (exists) return prev;
          return [notification, ...prev];
        });

        // Force show notifications
        setShowNotifications(true);
      } else {
        console.error("Invalid event detail received:", event.detail);
      }
    };

    // Add event listener for task reminders
    window.addEventListener("taskReminder", handleTaskReminder);

    // Cleanup
    return () => {
      window.removeEventListener("taskReminder", handleTaskReminder);
    };
  }, []);

  // Save notifications to storage whenever they change
  useEffect(() => {
    localStorage.setItem(
      NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify(notifications)
    );
  }, [notifications]);

  const unreadCount = notifications.filter((notif) => !notif.read).length;

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const closeNotifications = () => {
    setShowNotifications(false);
  };

  const markAsRead = (id) => {
    setNotifications(
      notifications.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((notif) => ({ ...notif, read: true })));
  };

  // Check for authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      // Redirect to login if no token is found
      navigate("/");
    }
  }, [navigate]);

  const handleLogout = () => {
    // Clear authentication token
    localStorage.removeItem("token");
    // Clear notifications from local storage for security
    localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
    // Redirect to login page
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        onSelect={setSelectedSection}
        selectedSection={selectedSection}
        onLogout={handleLogout}
        isMobileMenuOpen={isMobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />
      <div className="flex flex-col w-full md:ml-64">
        <TopBar
          title={selectedSection.name}
          setMobileMenuOpen={setMobileMenuOpen}
          toggleNotifications={toggleNotifications}
          unreadCount={unreadCount}
        />
        <NotificationsPopup
          isOpen={showNotifications}
          onClose={closeNotifications}
          notifications={notifications}
          markAsRead={markAsRead}
          markAllAsRead={markAllAsRead}
        />
        <div className="mt-16 px-4 py-6 sm:px-6 lg:px-8 w-full">
          <Content selectedSection={selectedSection} />
        </div>
      </div>
    </div>
  );
};

export default CRM_Dashboard;
