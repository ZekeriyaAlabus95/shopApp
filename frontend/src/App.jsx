import { useState } from "react";
import Product from "./product";
import Source from "./source";
import EditPrice from "./editPrice"; // Capitalized
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("products");

  // Display name for the tabs
  const tabLabels = {
    products: "Products",
    sources: "Sources",
    editPrice: "Edit Price",
  };

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="brand">Shop Admin</h1>
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
