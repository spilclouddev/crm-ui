import React, { useState, useEffect } from "react";
import * as XLSX from 'xlsx';
import TaskForm from "../Dashboards/Task management/taskForm";
import TaskCalendar from "../Dashboards/MyTasks/TaskCalendar"; // Import the calendar component

import config from '../config';

const API_URL = config.API_URL;

// Local storage keys
const TASKS_STORAGE_KEY = "crm_tasks";
const USER_INFO_KEY = "user_info";

const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [calendarSelectedTasks, setCalendarSelectedTasks] = useState(null);

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

  // Function to get current user info
  const getCurrentUser = async () => {
    try {
      const headers = getAuthHeaders();
      // Use the correct endpoint for your authentication system
      const response = await fetch(`${API_URL}/auth/me`, { headers });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const userData = await response.json();
      setCurrentUser(userData);
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(userData));
      return userData;
    } catch (err) {
      console.error("Error fetching current user:", err);
      
      // Try to get from local storage as fallback
      const storedUser = localStorage.getItem(USER_INFO_KEY);
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setCurrentUser(userData);
        return userData;
      }
      
      setError("Failed to get user information. Please log in again.");
      return null;
    }
  };

  // Function to fetch tasks assigned to current user
  const fetchTasks = async () => {
    if (isLoading) return; // Prevent multiple simultaneous fetches
    
    setIsLoading(true);
    setError(null); // Clear previous errors
    
    try {
      // First get the current user info
      const user = await getCurrentUser();
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      // Get auth headers
      const headers = getAuthHeaders();

      // First try the dedicated endpoint for my tasks
      try {
        console.log("Fetching tasks from /tasks/my endpoint");
        const response = await fetch(`${API_URL}/tasks/my`, { headers });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const myTasksData = await response.json();
        console.log(`Fetched ${myTasksData.length} tasks from /tasks/my endpoint`);
        setMyTasks(myTasksData);
        // Reset calendar selection when fetching new data
        setCalendarSelectedTasks(null);
        setError(null);
        
        // Also fetch all tasks for potential operations (silent background fetch)
        try {
          const allTasksResponse = await fetch(`${API_URL}/tasks`, { headers });
          if (allTasksResponse.ok) {
            const allTasksData = await allTasksResponse.json();
            setTasks(allTasksData);
            // Save to local storage
            saveTasksToStorage(allTasksData);
          }
        } catch (allTasksErr) {
          console.error("Failed to fetch all tasks, but my tasks were fetched:", allTasksErr);
          // No need to show error, since my tasks were fetched successfully
        }
      } catch (myTasksErr) {
        console.error("API error for /tasks/my, trying fallback:", myTasksErr);
        
        // If /tasks/my fails, try the general tasks endpoint and filter
        try {
          const response = await fetch(`${API_URL}/tasks`, { headers });
          
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          
          const allTasks = await response.json();
          setTasks(allTasks);
          
          // Filter for current user's tasks
          const assignedTasks = allTasks.filter(task => task.assignedTo === user.name);
          console.log(`Filtered ${assignedTasks.length} tasks for current user from all tasks`);
          setMyTasks(assignedTasks);
          // Reset calendar selection when fetching new data
          setCalendarSelectedTasks(null);
          setError(null);
          
          // Save to local storage
          saveTasksToStorage(allTasks);
        } catch (allTasksErr) {
          throw allTasksErr; // Throw to outer catch for local storage fallback
        }
      }
    } catch (err) {
      console.error("All API fetch attempts failed:", err);
      
      // If API fails, try to load from local storage
      try {
        const localTasks = loadTasksFromStorage();
        if (localTasks.length > 0) {
          console.log("Using cached tasks from local storage");
          setTasks(localTasks);
          
          // Filter tasks for current user from local storage
          if (currentUser) {
            const assignedTasks = localTasks.filter(task => task.assignedTo === currentUser.name);
            console.log(`Found ${assignedTasks.length} tasks for current user in local storage`);
            setMyTasks(assignedTasks);
            // Reset calendar selection when fetching new data
            setCalendarSelectedTasks(null);
          }
          
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

  // Function to export tasks to Excel
  const handleExportTasks = () => {
    // Use filtered tasks if there's a search term or filter, otherwise use all tasks
    const dataToExport = filteredTasks;
    
    if (dataToExport.length === 0) {
      alert("No tasks to export.");
      return;
    }
    
    setIsExporting(true);
    
    try {
      // Transform tasks to a format suitable for Excel
      const exportData = dataToExport.map(task => ({
        'Title': task.title || '',
        'Description': task.description || '',
        'Status': task.status || '',
        'Priority': task.priority || '',
        'Assigned To': task.assignedTo || '',
        'Related To': task.relatedTo || '',
        'Due Date': formatDate(task.dueDate),
        'Reminder Date': formatDate(task.reminderDate),
        'Reminder Time': task.reminderTime || '',
        'Created At': formatDate(task.createdAt)
      }));
      
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'My Tasks');
      
      // Generate Excel file and download
      XLSX.writeFile(workbook, `MyTasks_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
      
      console.log("Successfully exported tasks to Excel");
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export tasks. " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Load tasks on component mount - only once
  useEffect(() => {
    console.log("MyTasks component mounted");
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply filters (search, status, calendar selection) when dependencies change
  useEffect(() => {
    let result = myTasks;

    // If there are calendar selected tasks, filter by those first
    if (calendarSelectedTasks && calendarSelectedTasks.length > 0) {
      // Create a set of task IDs for efficient lookup
      const selectedTaskIds = new Set(
        calendarSelectedTasks.map(task => task._id || task.id)
      );
      result = result.filter(task => 
        selectedTaskIds.has(task._id || task.id)
      );
    }

    // Then apply search filter
    if (searchTerm.trim() !== '') {
      result = result.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.relatedTo && task.relatedTo.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Then apply status filter
    if (filterStatus !== 'All') {
      result = result.filter(task => task.status === filterStatus);
    }

    setFilteredTasks(result);
  }, [myTasks, searchTerm, filterStatus, calendarSelectedTasks]);

  // Handle task selection from calendar
  const handleCalendarTaskSelect = (selectedTasks) => {
    setCalendarSelectedTasks(selectedTasks);
  };

  // Clear calendar selection
  const clearCalendarSelection = () => {
    setCalendarSelectedTasks(null);
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
      
      // Update myTasks as well
      if (currentUser) {
        const assignedTasks = updatedTasks.filter(task => task.assignedTo === currentUser.name);
        setMyTasks(assignedTasks);
      }
      
      // Save to local storage
      saveTasksToStorage(updatedTasks);
      
      // Reset form state
      setShowForm(false);
      setCurrentTask(null);
      setError(null);
      
      // Clear any calendar selection
      setCalendarSelectedTasks(null);
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
        
        // Update myTasks as well
        if (currentUser) {
          const assignedTasks = updatedTasks.filter(task => task.assignedTo === currentUser.name);
          setMyTasks(assignedTasks);
        }
        
        // Update local storage
        saveTasksToStorage(updatedTasks);
        
        // Clear calendar selection if the deleted task was part of it
        if (calendarSelectedTasks) {
          const remainingTasks = calendarSelectedTasks.filter(
            task => task._id !== taskId && task.id !== taskId
          );
          
          if (remainingTasks.length !== calendarSelectedTasks.length) {
            // If there are still selected tasks, update the selection
            if (remainingTasks.length > 0) {
              setCalendarSelectedTasks(remainingTasks);
            } else {
              // If all selected tasks were deleted, clear the selection
              setCalendarSelectedTasks(null);
            }
          }
        }
        
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
    <div className="w-full h-full p-6">
      {/* Unified Action Bar - All controls in one panel */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input - Takes priority on mobile, full width on desktop */}
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          {/* Filters and Buttons Container - Stack on mobile, side by side on large screens */}
          <div className="flex flex-col sm:flex-row gap-2 lg:gap-3">
            {/* Status Filter */}
            <div className="w-full sm:w-40">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="All">All Statuses</option>
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={fetchTasks}
                disabled={isLoading}
                className="px-3 py-2 flex items-center text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <svg className="mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </button>
              <button 
                onClick={handleExportTasks}
                disabled={isExporting}
                className="px-3 py-2 flex items-center text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {isExporting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Exporting...
                  </span>
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export
                  </>
                )}
              </button>
              <button 
                onClick={() => {
                  setCurrentTask(null);
                  setShowForm(true);
                }}
                className="px-3 py-2 flex items-center text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Task
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {/* Calendar view */}
      <TaskCalendar 
        tasks={myTasks} 
        onTaskClick={handleCalendarTaskSelect} 
      />
      
      {/* Tasks list with calendar filter indicator */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden w-full">
        {/* Calendar filter indicator */}
        {calendarSelectedTasks && (
          <div className="bg-indigo-50 p-3 border-b border-indigo-100 flex justify-between items-center">
            <span className="text-indigo-700">
              <span className="font-medium">Filtered by calendar:</span> {calendarSelectedTasks.length} task(s) on {formatDate(new Date(calendarSelectedTasks[0].dueDate))}
            </span>
            <button 
              onClick={clearCalendarSelection}
              className="text-indigo-600 hover:text-indigo-800"
            >
              Clear filter
            </button>
          </div>
        )}
      
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No tasks assigned to you found. {searchTerm || filterStatus !== "All" || calendarSelectedTasks ? "Try adjusting your filters." : ""}
          </div>
        ) : (
          <div className="w-full">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task Info
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
                      <div className="text-sm text-gray-500">{task.relatedTo || "N/A"}</div>
                      <div className="text-sm text-gray-500 mt-1">{task.description || ""}</div>
                      {/* Mobile-only due date */}
                      <div className="md:hidden text-xs text-gray-500 mt-1">
                        Due: {formatDate(task.dueDate)}
                      </div>
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
      
      {/* Task form (conditionally shown) */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">{currentTask ? "Edit Task" : "Create Task"}</h2>
              <TaskForm
                task={currentTask}
                onSave={handleSaveTask}
                onCancel={() => {
                  setShowForm(false);
                  setCurrentTask(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTasks;