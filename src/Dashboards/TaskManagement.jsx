import React, { useState, useEffect } from "react";

// API URL - adjust according to your backend setup
const API_URL = "http://localhost:5000/api";

// Task form component for adding/editing tasks
const TaskForm = ({ task, onSave, onCancel }) => {
  const [formData, setFormData] = useState(
    task || {
      title: "",
      description: "",
      assignedTo: "",
      status: "Not Started",
      priority: "Medium",
      dueDate: "",
      relatedTo: ""
    }
  );
  
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);

  // Fetch dropdown data when component mounts
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [usersResponse, companiesResponse] = await Promise.all([
          fetch(`${API_URL}/tasks/dropdown/users`).then(res => res.json()),
          fetch(`${API_URL}/tasks/dropdown/companies`).then(res => res.json())
        ]);
        
        setUsers(usersResponse);
        setCompanies(companiesResponse);
      } catch (err) {
        console.error("Error fetching dropdown data:", err);
      }
    };

    fetchDropdownData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  // Format the date for the date input
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">{task ? "Edit Task" : "Add New Task"}</h2>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              name="title"
              id="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              id="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            ></textarea>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">
                Assigned To
              </label>
              <select
                name="assignedTo"
                id="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select User</option>
                {users.map((user) => (
                  <option key={user._id} value={user.name}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="relatedTo" className="block text-sm font-medium text-gray-700">
                Related To
              </label>
              <select
                name="relatedTo"
                id="relatedTo"
                value={formData.relatedTo}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select Company</option>
                {companies.map((company, index) => (
                  <option key={index} value={company}>
                    {company}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                name="status"
                id="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                Priority
              </label>
              <select
                name="priority"
                id="priority"
                value={formData.priority}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                Due Date
              </label>
              <input
                type="date"
                name="dueDate"
                id="dueDate"
                value={formatDateForInput(formData.dueDate)}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {task ? "Update Task" : "Add Task"}
          </button>
        </div>
      </form>
    </div>
  );
};

const TaskManagement = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // Function to fetch tasks from API
  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/tasks`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch tasks. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, []);

  // Handle saving a task (create or update)
  const handleSaveTask = async (taskData) => {
    setIsLoading(true);
    
    try {
      if (currentTask) {
        // Update existing task
        const response = await fetch(
          `${API_URL}/tasks/${currentTask._id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(taskData)
          }
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const updatedTask = await response.json();
        
        // Update task in state
        setTasks(tasks.map(task => 
          task._id === currentTask._id ? updatedTask : task
        ));
      } else {
        // Create new task
        const response = await fetch(`${API_URL}/tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(taskData)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const newTask = await response.json();
        setTasks([...tasks, newTask]);
      }
      
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
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        // Remove task from state
        setTasks(tasks.filter(task => task._id !== taskId));
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
                         task.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.relatedTo.toLowerCase().includes(searchTerm.toLowerCase());
    
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
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="p-6">
      {/* Header and controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Task Management</h1>
        
        <button
          onClick={() => {
            setCurrentTask(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          + Add New Task
        </button>
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
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
          <div className="mb-4 md:mb-0 md:flex-1">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div className="mb-4 md:mb-0 w-full md:w-auto">
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
          
          <div className="w-full md:w-auto">
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
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No tasks found. {searchTerm || filterStatus !== "All" ? "Try adjusting your filters." : "Create a new task to get started."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.map((task) => (
                  <tr key={task._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{task.title}</div>
                      <div className="text-sm text-gray-500">{task.relatedTo}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{task.assignedTo}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(task.status)}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadgeColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(task.dueDate)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditTask(task)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
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