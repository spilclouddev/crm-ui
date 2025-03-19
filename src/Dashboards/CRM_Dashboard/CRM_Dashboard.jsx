import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Import components
import LeadsAndOpportunities from "../LeadsAndOpportunities";
import TaskManagement from "../TaskManagement";
import ContactManagement from "../ContactManagement";

const sections = [
  { id: "contact", name: "Contact Management" },
  { id: "leads", name: "Leads & Opportunities Tracking" },
  { id: "tasks", name: "Task Management" },
  { id: "reporting", name: "Dashboard" },
  { id: "logout", name: "Log Out" }
];

const Sidebar = ({ onSelect, selectedSection, onLogout }) => {
  return (
    <div className="w-64 bg-gray-800 h-screen fixed left-0 top-0 p-4 text-white overflow-auto">
      <h2 className="text-lg font-semibold mb-4"></h2>
      {sections.map((section) => (
        <button
          key={section.id}
          className={`block w-full text-left p-2 mb-2 ${
            selectedSection.id === section.id ? 'bg-gray-600' : 'bg-gray-700'
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
  );
};

const TopBar = () => {
  return (
    <div className="fixed top-0 left-64 right-0 bg-gray-900 text-white p-4 text-center text-lg font-semibold z-10">
      Spil Labs
    </div>
  );
};
// Main content renderer that switches between different components based on selection
const Content = ({ selectedSection }) => {
  switch(selectedSection.id) {
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
  
  // Check for authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Redirect to login if no token is found
      navigate('/');
    }
  }, [navigate]);
  
  const handleLogout = () => {
    // Clear authentication token
    localStorage.removeItem('token');
    // Redirect to login page
    navigate('/');
  };

  return (
    <div className="flex h-screen ">
      <Sidebar 
        onSelect={setSelectedSection} 
        selectedSection={selectedSection}
        onLogout={handleLogout}
      />
      <div className="flex flex-col ml-64 w-full">
        <TopBar title={selectedSection.name} />
        <div className="mt-16 flex justify-center">
          <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <Content selectedSection={selectedSection} />
          </div>
        </div>
      </div>
    </div>
  );
};
 
export default CRM_Dashboard;