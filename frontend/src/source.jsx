import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import AddSource from "./addSource"; // make sure filename matches
import "./App.css";

function Source() {
  const [sourceList, setSourceList] = useState([]);
  const [editingSource, setEditingSource] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", address: "" });
  const [selectedSources, setSelectedSources] = useState([]);
  const [activeTab, setActiveTab] = useState("list");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("none");

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/sources/list");
      setSourceList(res.data.sources || []);
      setSelectedSources([]);
    } catch {
      alert("Error fetching sources");
    }
  };

  // --------------- CRUD -----------------
  const handleDeleteSources = async () => {
    if (selectedSources.length === 0) {
      alert("Select at least one source");
      return;
    }
    if (!window.confirm("Delete selected sources?")) return;

    try {
      await axios.delete("http://localhost:8080/api/sources/deleteSource", {
        data: { source_ids: selectedSources },
      });
      setSourceList(sourceList.filter((s) => !selectedSources.includes(s.source_id)));
      setSelectedSources([]);
      alert("Sources deleted");
    } catch {
      alert("Error deleting sources");
    }
  };

  const handleEditSource = (source) => {
    setEditingSource(source.source_id);
    setEditForm({
      name: source.name,
      phone: source.phone || "",
      address: source.address || "",
    });
  };

  const handleSaveSource = async (id) => {
    if (!editForm.name.trim()) {
      alert("Name is required");
      return;
    }

    try {
      await axios.put("http://localhost:8080/api/sources/updateSource", {
        source_id: id,
        newName: editForm.name,
        newPhone: editForm.phone,
        newAddress: editForm.address,
      });

      setSourceList(
        sourceList.map((s) =>
          s.source_id === id ? { ...s, ...editForm } : s
        )
      );
      setEditingSource(null);
      alert("Source updated");
    } catch {
      alert("Error updating source");
    }
  };

  const toggleSelectSource = (id) => {
    setSelectedSources((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const toggleSelectAllSources = () => {
    if (selectedSources.length === sourceList.length) setSelectedSources([]);
    else setSelectedSources(sourceList.map((s) => s.source_id));
  };

  // ----------------- Sorting & Search -----------------
  const visibleSources = useMemo(() => {
    let rows = [...sourceList];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (s) =>
          (s.name || "").toLowerCase().includes(q) ||
          (s.phone || "").toLowerCase().includes(q) ||
          (s.address || "").toLowerCase().includes(q)
      );
    }

    // Sorting
    switch (sortBy) {
      case "name-asc":
        rows.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      case "name-desc":
        rows.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
        break;
      
    }

    return rows;
  }, [sourceList, search, sortBy]);

  // ----------------- Tab content -----------------
  const renderTabContent = () => {
    switch (activeTab) {
      case "add":
        return (
          <AddSource
            onSourceAdded={(newSource) =>
              setSourceList((prev) => [...prev, newSource])
            }
            onClose={() => setActiveTab("list")}
          />
        );

      case "list":
      default:
        return (
          <>
            {/* --- Controls --- */}
            <div
              className="controls"
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                margin: "1rem 0",
                alignItems: "center",
              }}
            >
              <div style={{ position: "relative", flexGrow: 0.4 }}>
                <input
                  type="text"
                  placeholder="Search by name, phone, address"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input"
                  style={{ width: "85%", paddingRight: "25px" }}
                />
                {search && (
                  <span
                   style={{
                      position: "absolute",
                      right: "110px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      cursor: "pointer",
                      borderRadius: "50%",
                      width: "25px",
                      height: "25px",
                      textAlign: "center",
                      lineHeight: "25px",
                      fontWeight: "bold",
                      fontSize: "2rem"
                    }}
                    onClick={() => setSearch("")}
                  >
                    ×
                  </span>
                )}
              </div>

              <button
                className="btn"
                onClick={() =>
                  setSortBy(sortBy === "name-asc" ? "name-desc" : "name-asc")
                }
              >
                Name {sortBy.includes("name") ? (sortBy === "name-asc" ? "↑" : "↓") : "↕"}
              </button>

              

              <button
                className="btn danger"
                onClick={handleDeleteSources}
                disabled={selectedSources.length === 0}
              >
                Delete Selected
              </button>
            </div>

            {/* --- Table --- */}
            <div className="table-wrap">
              <table className="product-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={
                          selectedSources.length === sourceList.length && sourceList.length > 0
                        }
                        onChange={toggleSelectAllSources}
                      />
                    </th>
                    <th>Actions</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Address</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleSources.map((s) => (
                    <tr key={s.source_id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedSources.includes(s.source_id)}
                          onChange={() => toggleSelectSource(s.source_id)}
                        />
                      </td>
                      <td>
                        {editingSource === s.source_id ? (
                          <>
                            <button
                              className="btn xs"
                              onClick={() => handleSaveSource(s.source_id)}
                            >
                              Save
                            </button>
                            <button
                              className="btn xs danger"
                              onClick={() => setEditingSource(null)}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            className="btn xs"
                            onClick={() => handleEditSource(s)}
                          >
                            Edit
                          </button>
                        )}
                      </td>
                      <td>
                        {editingSource === s.source_id ? (
                          <input
                            className="input"
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm({ ...editForm, name: e.target.value })
                            }
                          />
                        ) : (
                          s.name
                        )}
                      </td>
                      <td>
                        {editingSource === s.source_id ? (
                          <input
                            className="input"
                            value={editForm.phone}
                            onChange={(e) =>
                              setEditForm({ ...editForm, phone: e.target.value })
                            }
                          />
                        ) : (
                          s.phone || "-"
                        )}
                      </td>
                      <td>
                        {editingSource === s.source_id ? (
                          <input
                            className="input"
                            value={editForm.address}
                            onChange={(e) =>
                              setEditForm({ ...editForm, address: e.target.value })
                            }
                          />
                        ) : (
                          s.address || "-"
                        )}
                      </td>
                    </tr>
                  ))}
                  {sourceList.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center" }}>
                        No sources found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        );
    }
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Sources Dashboard</h2>
        <div className="tabs">
          {["list", "add"].map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? "tab active" : "tab"}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {renderTabContent()}
    </section>
  );
}

export default Source;
