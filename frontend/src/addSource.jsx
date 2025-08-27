import { useState } from "react";
import axios from "axios";

export default function AddSource({ onSourceAdded, onClose }) {
  const [source, setSource] = useState({ name: "", phone: "", address: "" });
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!source.name.trim()) {
      alert("Source name is required");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8080/api/sources/addSource", source);
      alert(res.data.message);
      onSourceAdded({
        source_id: res.data.source_id,
        ...source,
      });
      setSource({ name: "", phone: "", address: "" });
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error adding source");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Add Source</h3>
        <input
          type="text"
          placeholder="Name"
          value={source.name}
          onChange={(e) => setSource({ ...source, name: e.target.value })}
        />
        <input
          type="text"
          placeholder="Phone"
          value={source.phone}
          onChange={(e) => setSource({ ...source, phone: e.target.value })}
        />
        <input
          type="text"
          placeholder="Address"
          value={source.address}
          onChange={(e) => setSource({ ...source, address: e.target.value })}
        />

        <div style={{ textAlign: "right", marginTop: "1rem" }}>
          <button className="btn" onClick={handleAdd} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
          <button className="btn" style={{ marginLeft: "10px" }} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
