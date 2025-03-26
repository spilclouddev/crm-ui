import React from 'react';

// Function to add mock tasks with upcoming reminders for testing
export const addMockTasksForTesting = () => {
  // Check if we already have tasks in storage
  const existingTasks = JSON.parse(localStorage.getItem('crm_tasks') || '[]');
  if (existingTasks.length > 0) {
    console.log('Mock tasks already exist, skipping...');
    return;
  }

  // Create date objects for testing
  const now = new Date();
  
  // Set reminder time to 15 seconds from now
  const reminderDate = new Date(now);
  reminderDate.setSeconds(reminderDate.getSeconds() + 15);
  
  // Format date and time for the task
  const formatDateForStorage = (date) => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  };
  
  const formatTimeForStorage = (date) => {
    return date.toTimeString().split(' ')[0]; // HH:MM:SS
  };

  // Create mock tasks
  const mockTasks = [
    {
      id: 'mock-1',
      title: 'Test Task with Reminder',
      description: 'This is a test task with a reminder that should trigger shortly.',
      assignedTo: 'Test User',
      relatedTo: 'Test Company',
      status: 'Not Started',
      priority: 'High',
      dueDate: formatDateForStorage(new Date(now.getTime() + 86400000)), // tomorrow
      reminderDate: formatDateForStorage(reminderDate),
      reminderTime: formatTimeForStorage(reminderDate),
      reminderNotified: false,
      createdAt: now.toISOString()
    },
    {
      id: 'mock-2',
      title: 'Another Test Task',
      description: 'This is another test task without a reminder.',
      assignedTo: 'Test User',
      relatedTo: 'Test Company',
      status: 'In Progress',
      priority: 'Medium',
      dueDate: formatDateForStorage(new Date(now.getTime() + 172800000)), // day after tomorrow
      createdAt: now.toISOString()
    }
  ];

  // Save mock tasks to localStorage
  localStorage.setItem('crm_tasks', JSON.stringify(mockTasks));
  console.log('Added mock tasks with upcoming reminder');
  
  // Alert the user
  alert('Test tasks added. A notification will appear in about 15 seconds!');
};

// Create a TestButton component that can be added anywhere in your app
export const TestButton = () => {
  return (
    <button 
      onClick={addMockTasksForTesting}
      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
    >
      Add Test Tasks with Reminder
    </button>
  );
};

// Export a function to clear all notifications (useful for testing)
export const clearAllNotifications = () => {
  localStorage.setItem('crm_notifications', '[]');
  alert('All notifications cleared!');
  window.location.reload();
};

// Export a button to clear notifications
export const ClearNotificationsButton = () => {
  return (
    <button 
      onClick={clearAllNotifications}
      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
    >
      Clear All Notifications
    </button>
  );
};