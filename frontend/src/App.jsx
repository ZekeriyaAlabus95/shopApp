import { useState } from "react";
import Product from "./product";
import Source from "./source";
import EditPrice from "./editPrice"; // Capitalized
import Login from "./Login";
import { useUser } from "./UserContext";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("products");
  const { user, login, logout, loading, isAuthenticated } = useUser();

  // Display name for the tabs
  const tabLabels = {
    products: "Products",
    sources: "Sources",
    editPrice: "Edit Price",
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={login} />;
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="brand">Shop Admin</h1>
        <div className="user-info">
          <span className="welcome-text">Welcome, {user.username}!</span>
          <button className="logout-button" onClick={logout}>
            Logout
          </button>
        </div>
        <nav className="tabs">
          {Object.keys(tabLabels).map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? "tab active" : "tab"}
              onClick={() => setActiveTab(tab)}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </nav>
      </header>

      <main className="content">
        {activeTab === "products" && <Product />}
        {activeTab === "sources" && <Source />}
        {activeTab === "editPrice" && <EditPrice />}
      </main>
    </div>
  );
}

export default App;
