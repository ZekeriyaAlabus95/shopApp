import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function Source() {
  const [sourceList, setSourceList] = useState([]);
  const [editingSource, setEditingSource] = useState(null);
  const [editSourceForm, setEditSourceForm] = useState({ name: "", phone: "", address: "" });
  const [selectedSources, setSelectedSources] = useState([]);
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [newSource, setNewSource] = useState({ name: "", phone: "", address: "" });

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

  const toggleSelectSource = (id) => {
    setSelectedSources((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const toggleSelectAllSources = () => {
    if (selectedSources.length === sourceList.length) setSelectedSources([]);
    else setSelectedSources(sourceList.map((s) => s.source_id));
  };

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
    setEditSourceForm({
      name: source.name,
      phone: source.phone || "",
      address: source.address || "",
    });
  };

  const handleSaveSource = async (id) => {
    try {
      await axios.put("http://localhost:8080/api/sources/updateSource", {
        source_id: id,
        newName: editSourceForm.name,
        newPhone: editSourceForm.phone,
        newAddress: editSourceForm.address,
      });

      setSourceList(
        sourceList.map((s) =>
          s.source_id === id ? { ...s, ...editSourceForm } : s
        )
      );
      setEditingSource(null);
      alert("Source updated");
    } catch {
      alert("Error updating source");
    }
  };

  const handleAddSource = async () => {
    const { name, phone, address } = newSource;
    if (!name) {
      alert("Source name is required");
      return;
    }
    try {
      const res = await axios.post("http://localhost:8080/api/sources/addSource", {
        name,
        phone,
        address,
      });
      const created = { source_id: res.data.source_id, name, phone, address };
      setSourceList((prev) => [...prev, created]);
      setNewSource({ name: "", phone: "", address: "" });
      setShowAddSourceModal(false);
      alert("Source added");
    } catch {
      alert("Error adding source");
    }
  };

  return (
    <div className="app">
    

      {/* Content */}
      <div className="content">
        <h2>Sources</h2>

        <div>
          <button className="btn" onClick={() => setShowAddSourceModal(true)}>
            Add Source
          </button>
          <button className="btn" style={{ marginLeft: "10px" }} onClick={handleDeleteSources}>
            Delete Selected
          </button>
        </div>

        {/* Table */}
        <table className="product-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedSources.length === sourceList.length && sourceList.length > 0}
                  onChange={toggleSelectAllSources}
                />
              </th>
              <th>Name</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sourceList.map((s) => (
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
                    <input
                      type="text"
                      value={editSourceForm.name}
                      onChange={(e) =>
                        setEditSourceForm({ ...editSourceForm, name: e.target.value })
                      }
                    />
                  ) : (
                    s.name
                  )}
                </td>
                <td>
                  {editingSource === s.source_id ? (
                    <input
                      type="text"
                      value={editSourceForm.phone}
                      onChange={(e) =>
                        setEditSourceForm({ ...editSourceForm, phone: e.target.value })
                      }
                    />
                  ) : (
                    s.phone
                  )}
                </td>
                <td>
                  {editingSource === s.source_id ? (
                    <input
                      type="text"
                      value={editSourceForm.address}
                      onChange={(e) =>
                        setEditSourceForm({ ...editSourceForm, address: e.target.value })
                      }
                    />
                  ) : (
                    s.address
                  )}
                </td>
                <td className="actions">
                  {editingSource === s.source_id ? (
                    <>
                      <button className="btn" onClick={() => handleSaveSource(s.source_id)}>
                        Save
                      </button>
                      <button className="btn" onClick={() => setEditingSource(null)}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button className="btn" onClick={() => handleEditSource(s)}>Edit</button>
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

      {/* Add Source Modal */}
      {showAddSourceModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add Source</h3>
            <input
              type="text"
              placeholder="Name"
              value={newSource.name}
              onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Phone"
              value={newSource.phone}
              onChange={(e) => setNewSource({ ...newSource, phone: e.target.value })}
            />
            <input
              type="text"
              placeholder="Address"
              value={newSource.address}
              onChange={(e) => setNewSource({ ...newSource, address: e.target.value })}
            />
            <div style={{ textAlign: "right", marginTop: "1rem" }}>
              <button className="btn" onClick={handleAddSource}>Save</button>
              <button className="btn" style={{ marginLeft: "10px" }} onClick={() => setShowAddSourceModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Source;
