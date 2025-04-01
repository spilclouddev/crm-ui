import React, { useState, useEffect } from 'react';

const TaskCalendar = ({ tasks, onTaskClick, viewMode = 'month' }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarMode, setCalendarMode] = useState(viewMode);
  const [calendar, setCalendar] = useState([]);
  const [tasksByDate, setTasksByDate] = useState({});

  // Generate calendar days based on current month/week
  useEffect(() => {
    if (calendarMode === 'month') {
      generateMonthView();
    } else if (calendarMode === 'week') {
      generateWeekView();
    }
  }, [currentDate, calendarMode, tasks]);

  // Group tasks by date
  useEffect(() => {
    const grouped = {};
    
    tasks.forEach(task => {
      if (!task.dueDate) return;
      
      const dueDate = new Date(task.dueDate);
      const dateKey = dueDate.toISOString().split('T')[0];
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      
      grouped[dateKey].push(task);
    });
    
    setTasksByDate(grouped);
  }, [tasks]);

  // Generate month view
  const generateMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of the month
    const firstDay = new Date(year, month, 1);
    // Get last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the day of the week for the first day (0-6, where 0 is Sunday)
    const firstDayOfWeek = firstDay.getDay();
    
    // Calculate days from previous month to show
    const daysFromPrevMonth = firstDayOfWeek;
    
    // Get the last day of the previous month
    const lastDayOfPrevMonth = new Date(year, month, 0).getDate();
    
    // Total days to show (42 for a 6-week calendar grid)
    const totalDays = 42;
    
    let days = [];
    
    // Add days from previous month
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, lastDayOfPrevMonth - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: isSameDay(date, new Date()),
      });
    }
    
    // Add days from current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: isSameDay(date, new Date()),
      });
    }
    
    // Add days from next month
    const remainingDays = totalDays - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: isSameDay(date, new Date()),
      });
    }
    
    setCalendar(days);
  };

  // Generate week view
  const generateWeekView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = currentDate.getDate();
    
    // Get the day of the week for the current date (0-6)
    const dayOfWeek = currentDate.getDay();
    
    // Get the start of the week (Sunday)
    const startDate = new Date(year, month, date - dayOfWeek);
    
    let days = [];
    
    // Generate 7 days for the week
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push({
        date,
        isCurrentMonth: date.getMonth() === month,
        isToday: isSameDay(date, new Date()),
      });
    }
    
    setCalendar(days);
  };

  // Helper to check if two dates are the same day
  const isSameDay = (date1, date2) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  // Navigate to previous month/week
  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (calendarMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  // Navigate to next month/week
  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (calendarMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  // Navigate to today
  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  // Change the calendar view mode
  const changeViewMode = (mode) => {
    setCalendarMode(mode);
  };

  // Format date to YYYY-MM-DD for tasksByDate lookup
  const formatDateKey = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Get tasks for a specific date
  const getTasksForDate = (date) => {
    const dateKey = formatDateKey(date);
    return tasksByDate[dateKey] || [];
  };

  // Handle click on a calendar cell
  const handleCellClick = (date) => {
    const tasks = getTasksForDate(date);
    if (tasks.length > 0) {
      onTaskClick(tasks);
    }
  };

  // Get day of month
  const getDayOfMonth = (date) => {
    return date.getDate();
  };

  // Format month and year for display
  const formatMonthYear = () => {
    const options = { month: 'long', year: 'numeric' };
    return currentDate.toLocaleDateString(undefined, options);
  };

  // Format week range for display
  const formatWeekRange = () => {
    const startOfWeek = calendar[0]?.date;
    const endOfWeek = calendar[6]?.date;
    
    if (!startOfWeek || !endOfWeek) return '';
    
    const startMonth = startOfWeek.toLocaleDateString(undefined, { month: 'short' });
    const endMonth = endOfWeek.toLocaleDateString(undefined, { month: 'short' });
    
    const startDay = startOfWeek.getDate();
    const endDay = endOfWeek.getDate();
    
    const year = endOfWeek.getFullYear();
    
    if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
      return `${startMonth} ${startDay} - ${endDay}, ${year}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
    }
  };

  // Get abbreviated day names
  const getDayNames = () => {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex space-x-2">
          <button
            onClick={navigatePrevious}
            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            &lt;
          </button>
          <button
            onClick={navigateToday}
            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            Today
          </button>
          <button
            onClick={navigateNext}
            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            &gt;
          </button>
        </div>
        
        <h2 className="text-lg font-semibold">
          {calendarMode === 'month' ? formatMonthYear() : formatWeekRange()}
        </h2>
        
        <div className="flex space-x-2">
          <button
            onClick={() => changeViewMode('month')}
            className={`px-2 py-1 rounded ${
              calendarMode === 'month' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => changeViewMode('week')}
            className={`px-2 py-1 rounded ${
              calendarMode === 'week' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Week
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {getDayNames().map((day, index) => (
          <div key={index} className="text-center text-sm font-medium py-1">
            {day}
          </div>
        ))}
        
        {calendar.map((day, index) => {
          const tasks = getTasksForDate(day.date);
          const hasEvents = tasks.length > 0;
          
          return (
            <div
              key={index}
              onClick={() => handleCellClick(day.date)}
              className={`border rounded min-h-[80px] p-1 cursor-pointer transition-colors ${
                day.isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'
              } ${
                day.isToday ? 'border-indigo-400 border-2' : 'border-gray-200'
              } hover:bg-gray-50`}
            >
              <div className="flex justify-between">
                <span className={`text-sm font-medium ${day.isToday ? 'text-indigo-600' : ''}`}>
                  {getDayOfMonth(day.date)}
                </span>
                {hasEvents && (
                  <span className="flex h-2 w-2 rounded-full bg-indigo-500"></span>
                )}
              </div>
              
              <div className="mt-1 space-y-1 overflow-y-auto max-h-[60px]">
                {tasks.slice(0, 3).map((task, i) => (
                  <div
                    key={i}
                    className={`text-xs px-1 py-0.5 rounded truncate ${
                      task.status === 'Completed'
                        ? 'bg-green-100 text-green-800'
                        : task.priority === 'High'
                        ? 'bg-red-100 text-red-800'
                        : task.priority === 'Medium'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {task.title}
                  </div>
                ))}
                {tasks.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{tasks.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskCalendar;