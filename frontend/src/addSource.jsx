import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function AddSource({ onSourceAdded }) {
  const [newSource, setNewSource] = useState({ name: "", phone: "", address: "" });
  const [loading, setLoading] = useState(false);

  const handleAddSource = async () => {
    const { name, phone } = newSource;

    if (!name.trim()) {
      alert("Name is required");
      return;
    }

    // Phone validation: digits only
    if (phone && !/^\d+$/.test(phone)) {
      alert("Phone must contain digits only");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8080/api/sources/addSource", newSource);
      alert(res.data.message);
      onSourceAdded({ source_id: res.data.source_id, ...newSource });
      setNewSource({ name: "", phone: "", address: "" });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Error adding source");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Add Source</h2>
      </div>

      <div className="form">
        <div className="form-group">
          <label>Name</label>
          <input
            className="input"
            value={newSource.name}
            onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Phone</label>
          <input
            className="input"
            value={newSource.phone}
            onChange={(e) => setNewSource({ ...newSource, phone: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Address</label>
          <input
            className="input"
            value={newSource.address}
            onChange={(e) => setNewSource({ ...newSource, address: e.target.value })}
          />
        </div>
      </div>

      <div className="form-actions">
        <button className="btn" onClick={handleAddSource} disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </button>
        <button
          className="btn danger"
          onClick={() => setNewSource({ name: "", phone: "", address: "" })}
        >
          Cancel
        </button>
      </div>
    </section>
  );
}

export default AddSource;
