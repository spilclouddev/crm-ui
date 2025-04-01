import React, { useState, useEffect } from "react";
import TaskForm from "../Dashboards/Task management/taskForm";

// API URL - adjust according to your backend setup
const API_URL = "https://crm-be.fly.dev/api";

// Local storage keys
const TASKS_STORAGE_KEY = "crm_tasks";
const REMINDER_CHECK_INTERVAL = 15000; // Check every 15 seconds for testing

const TaskManagement = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // Function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error("Authentication required");
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // Function to load tasks from local storage
  const loadTasksFromStorage = () => {
    const storedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
    if (storedTasks) {
      return JSON.parse(storedTasks);
    }
    return [];
  };

  // Function to save tasks to local storage
  const saveTasksToStorage = (taskData) => {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(taskData));
  };

  // Function to fetch tasks - now checks local storage first, then API as fallback
  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      // Get auth headers (will throw if no token)
      const headers = getAuthHeaders();

      // Try API first
      const response = await fetch(`${API_URL}/tasks`, { headers });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setTasks(data);
      
      // Save to local storage
      saveTasksToStorage(data);
      setError(null);
    } catch (err) {
      console.error("API fetch error:", err);
      
      // If API fails, try to load from local storage
      try {
        const localTasks = loadTasksFromStorage();
        if (localTasks.length > 0) {
          console.log("Using cached tasks from local storage");
          setTasks(localTasks);
          setError("Using cached data. Reconnect to update.");
        } else {
          setError('Failed to fetch tasks. Please check your connection.');
        }
      } catch (storageErr) {
        setError('Failed to fetch tasks. Please try again later.');
        console.error(storageErr);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load tasks on component mount and set up reminder checking
  useEffect(() => {
    console.log("TaskManagement component mounted");
    fetchTasks();

    // Check for reminders immediately on mount
    console.log("Running initial reminder check...");
    setTimeout(checkTaskReminders, 1000);
    
    // Set up interval to check for due reminders
    console.log("Setting up reminder check interval...");
    const reminderInterval = setInterval(checkTaskReminders, REMINDER_CHECK_INTERVAL);
    
    // Clean up interval on unmount
    return () => {
      console.log("Cleaning up reminder interval");
      clearInterval(reminderInterval);
    };
  }, []);

  // Function to check for task reminders
  const checkTaskReminders = async () => {
    console.log("Checking for task reminders...");
    try {
      // First try to get current user info to check only for tasks assigned to this user
      const token = localStorage.getItem('token');
      if (!token) {
        console.log("No authentication token, skipping reminder check");
        return;
      }
      
      // Try to get current user to only create notifications for tasks assigned to them
      let currentUsername = null;
      try {
        const userResponse = await fetch(`${API_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          currentUsername = userData.name;
          console.log(`Current user: ${currentUsername}`);
        }
      } catch (err) {
        console.error("Error fetching current user:", err);
        // Continue without username - we'll check all local tasks
      }
      
      const allTasks = loadTasksFromStorage();
      console.log(`Checking ${allTasks.length} tasks for reminders`);
      
      const now = new Date();
      
      let updatedTasks = [...allTasks];
      let hasUpdates = false;
      
      // Process each task
      for (let i = 0; i < updatedTasks.length; i++) {
        const task = updatedTasks[i];
        
        // Skip tasks not assigned to current user (for notifications only)
        if (currentUsername && task.assignedTo !== currentUsername) {
          console.log(`Skipping notification for task not assigned to current user: ${task.title}`);
          continue;
        }
        
        // Check for reminders
        if (task.reminderDate && task.reminderTime && !task.reminderNotified) {
          console.log(`Checking reminder for task: ${task.title}`);
          
          try {
            // Combine the date and time strings
            const reminderDateTime = new Date(`${task.reminderDate}T${task.reminderTime}`);
            
            // Check if reminder time has passed
            if (!isNaN(reminderDateTime.getTime()) && reminderDateTime <= now) {
              console.log("Reminder time has passed! Creating notification...");
              
              // Mark as notified
              updatedTasks[i] = {
                ...task,
                reminderNotified: true
              };
              
              hasUpdates = true;
              
              // Create notification
              const notification = {
                id: `task-reminder-${task._id || task.id || Date.now()}`,
                title: `Reminder: ${task.title}`,
                message: `${task.description || ""}. Due: ${formatDate(task.dueDate)}.`,
                timestamp: "Just now",
                read: false,
                taskId: task._id || task.id
              };
              
              console.log("Created notification:", notification);
              
              // Add notification to local storage directly
              const existingNotifications = JSON.parse(localStorage.getItem('crm_notifications') || '[]');
              const updatedNotifications = [notification, ...existingNotifications];
              localStorage.setItem('crm_notifications', JSON.stringify(updatedNotifications));
              
              // Dispatch event
              try {
                const event = new CustomEvent('taskReminder', {
                  detail: { notification }
                });
                window.dispatchEvent(event);
                console.log("Event dispatched successfully");
              } catch (err) {
                console.error("Error dispatching event:", err);
              }
            } else {
              console.log("Reminder time has not passed yet");
            }
          } catch (err) {
            console.error("Error processing reminder:", err);
          }
        }
        
        // Handle due dates - clear reminders for past due tasks
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        if (dueDate && dueDate < now && task.reminderDate) {
          console.log(`Clearing reminder for past due task: ${task.title}`);
          updatedTasks[i] = {
            ...task,
            reminderDate: "", 
            reminderTime: "", 
            reminderNotified: false
          };
          hasUpdates = true;
        }
      }
      
      // Update storage and state if changes were made
      if (hasUpdates) {
        console.log("Saving updated tasks to storage");
        saveTasksToStorage(updatedTasks);
        setTasks(updatedTasks);
      }
    } catch (err) {
      console.error("Error in checkTaskReminders:", err);
    }
  };

  // Handle saving a task (create or update)
  const handleSaveTask = async (taskData) => {
    setIsLoading(true);
    
    try {
      // Add creation date if it's a new task
      if (!currentTask) {
        taskData.createdAt = new Date().toISOString();
      }
      
      // Generate a local ID if API fails
      if (!taskData._id && !taskData.id) {
        taskData.id = `local-${Date.now()}`;
      }

      let updatedTasks = [];
      const headers = getAuthHeaders();
      
      try {
        if (currentTask) {
          // Try to update existing task via API
          const response = await fetch(
            `${API_URL}/tasks/${currentTask._id}`,
            {
              method: 'PUT',
              headers,
              body: JSON.stringify(taskData)
            }
          );
          
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          
          const updatedTask = await response.json();
          
          // Update task in state
          updatedTasks = tasks.map(task => 
            task._id === currentTask._id ? updatedTask : task
          );
        } else {
          // Try to create new task via API
          const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers,
            body: JSON.stringify(taskData)
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          
          const newTask = await response.json();
          updatedTasks = [...tasks, newTask];
        }
      } catch (apiErr) {
        console.error("API error, falling back to local storage:", apiErr);
        
        // Fall back to local storage if API fails
        if (currentTask) {
          // Update task in local array
          updatedTasks = tasks.map(task => 
            (task._id === currentTask._id || task.id === currentTask.id) ? taskData : task
          );
        } else {
          // Add new task to local array
          updatedTasks = [...tasks, taskData];
        }
      }
      
      // Update state
      setTasks(updatedTasks);
      
      // Save to local storage
      saveTasksToStorage(updatedTasks);
      
      // Reset form state
      setShowForm(false);
      setCurrentTask(null);
      setError(null);
    } catch (err) {
      setError('Failed to save task. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting a task
  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setIsLoading(true);
      
      try {
        const headers = getAuthHeaders();
        
        try {
          // Try to delete from API
          const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'DELETE',
            headers
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
        } catch (apiErr) {
          console.error("API delete failed, falling back to local storage:", apiErr);
          // Continue with local deletion even if API fails
        }
        
        // Remove task from state
        const updatedTasks = tasks.filter(task => (task._id !== taskId && task.id !== taskId));
        setTasks(updatedTasks);
        
        // Update local storage
        saveTasksToStorage(updatedTasks);
        
        setError(null);
      } catch (err) {
        setError('Failed to delete task. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Edit task handler
  const handleEditTask = (task) => {
    setCurrentTask(task);
    setShowForm(true);
  };

  // Filter tasks based on status and search term
  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filterStatus === "All" || task.status === filterStatus;
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (task.assignedTo && task.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (task.relatedTo && task.relatedTo.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesSearch;
  });

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch(status) {
      case "Not Started": return "bg-yellow-100 text-yellow-800";
      case "In Progress": return "bg-blue-100 text-blue-800";
      case "Completed": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Get priority badge color
  const getPriorityBadgeColor = (priority) => {
    switch(priority) {
      case "High": return "bg-red-100 text-red-800";
      case "Medium": return "bg-orange-100 text-orange-800";
      case "Low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return ""; // Return empty string if invalid date
      return date.toLocaleDateString();
    } catch (e) {
      console.error("Error formatting date:", e);
      return "";
    }
  };

  return (
    <div className="w-full h-full">
      {/* Header and controls */}
      <div className="flex flex-col sm:flex-row sm:items-center mb-6 gap-4">
  {/* <h1 className="text-xl sm:text-2xl font-bold">Task Management</h1> */}
  
  <div className="flex flex-col sm:flex-row gap-3">
    <button
      onClick={() => {
        setCurrentTask(null);
        setShowForm(true);
      }}
      className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      + Add New Task
    </button>
    <button
      className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      Export
    </button>
  </div>
</div>
      
      {/* Task form (conditionally shown) */}
      {showForm && (
        <div className="mb-6">
          <TaskForm
            task={currentTask}
            onSave={handleSaveTask}
            onCancel={() => {
              setShowForm(false);
              setCurrentTask(null);
            }}
          />
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {/* Filters & search */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4">
          <div className="w-full">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div className="w-full sm:w-auto">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="All">All Statuses</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          
          <div className="w-full sm:w-auto">
            <button
              onClick={fetchTasks}
              className="w-full px-4 py-2 border border-gray-300 bg-white rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
      
      {/* Tasks list */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden w-full">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No tasks found. {searchTerm || filterStatus !== "All" ? "Try adjusting your filters." : "Create a new task to get started."}
          </div>
        ) : (
          <div className="w-full">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task Info
                  </th>
                  <th scope="col" className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status/Priority
                  </th>
                  <th scope="col" className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right sm:text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.map((task) => (
                  <tr key={task._id || task.id} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{task.title}</div>
                      <div className="text-sm text-gray-500">{task.relatedTo}</div>
                      {/* Mobile-only assigned to */}
                      <div className="sm:hidden text-xs text-gray-500 mt-1">
                        Assigned: {task.assignedTo}
                      </div>
                      {/* Mobile-only due date */}
                      <div className="md:hidden text-xs text-gray-500 mt-1">
                        Due: {formatDate(task.dueDate)}
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4">
                      <div className="text-sm text-gray-900">{task.assignedTo}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(task.status)}`}>
                        {task.status}
                      </span>
                      <div className="mt-2">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadgeColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 text-sm text-gray-500">
                      {formatDate(task.dueDate)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right sm:text-center text-sm font-medium">
                      <div className="flex flex-col sm:flex-row justify-end sm:justify-center space-y-2 sm:space-y-0 sm:space-x-2">
                        <button
                          onClick={() => handleEditTask(task)}
                          className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-2 py-1 rounded"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task._id || task.id)}
                          className="text-red-600 hover:text-red-900 bg-red-50 px-2 py-1 rounded"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskManagement;