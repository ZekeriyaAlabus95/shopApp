import { useState } from "react";
import Product from "./product";
import Source from "./source";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("products");

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="brand">My Dashboard</h1>
        <nav className="tabs">
          {["products", "sources"].map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? "tab active" : "tab"}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </header>

      <main className="content">
        {activeTab === "products" && <Product />}
        {activeTab === "sources" && <Source />}
      </main>
    </div>
  );
}

export default App;
