import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import BarcodeScannerComponent from "react-qr-barcode-scanner";
import "./App.css";
import Sell from "./sell";
import AddProduct from "./addProduct";

function Product() {
  const [products, setProducts] = useState([]);
  const [sourceList, setSourceList] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    barcode: "",
    name: "",
    price: "",
    category: "",
    quantity: "",
    source_id: "",
  });
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("list");
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("none");
  const [scanBarcode, setScanBarcode] = useState(false);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    console.log(today)
    fetchProducts();
    fetchSources();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/products/list");
      setProducts(res.data.products || []);
      setSelectedProducts([]);
    } catch (err) {
      alert("Error fetching products");
    }
  };

  const fetchSources = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/sources/list");
      setSourceList(res.data.sources || []);
    } catch (err) {
      alert("Error fetching sources");
    }
  };

  // ------------------- CRUD -------------------
  const handleDeleteProducts = async () => {
    if (selectedProducts.length === 0) {
      alert("Select at least one product");
      return;
    }
    if (!window.confirm("Delete selected products?")) return;
    try {
      await axios.delete("http://localhost:8080/api/products/deleteProduct", {
        data: { product_ids: selectedProducts },
      });
      await fetchProducts();
      alert("Products deleted");
    } catch {
      alert("Error deleting products");
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product.product_id);
    setEditForm({
      barcode: product.barcode,
      name: product.product_name,
      price: product.price,
      category: product.category || "",
      quantity: product.quantity,
      source_id: product.source_id,
    });
    setEditError("");
  };

  const handleSaveProduct = async (id) => {
    // Frontend numeric validation
    if (isNaN(editForm.price) || Number(editForm.price) < 0) {
      setEditError("Price must be a positive number");
      return;
    }
    if (!Number.isInteger(Number(editForm.quantity)) || Number(editForm.quantity) < 0) {
      setEditError("Quantity must be a positive integer");
      return;
    }

    try {
      const res = await axios.put("http://localhost:8080/api/products/update", {
        product_id: id,
        barcode: editForm.barcode,
        product_name: editForm.name,
        price: editForm.price,
        category: editForm.category,
        quantity: editForm.quantity,
        source_id: editForm.source_id,
      });
      await fetchProducts();
      setEditingProduct(null);
      alert(res.data.message);
    } catch (err) {
      setEditError(
        err.response?.data?.error || "Error updating product"
      );
    }
  };

  // ------------------- Filters & Sorting -------------------
  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => p.category && set.add(p.category));
    return Array.from(set).sort();
  }, [products]);

  const visibleProducts = useMemo(() => {
    let rows = [...products];

    // Filters
    if (sourceFilter !== "all")
      rows = rows.filter((p) => Number(p.source_id) === Number(sourceFilter));
    if (categoryFilter !== "all")
      rows = rows.filter(
        (p) => (p.category || "").toLowerCase() === categoryFilter.toLowerCase()
      );
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (p) =>
          (p.product_name || "").toLowerCase().includes(q) ||
          (p.barcode || "").toLowerCase().includes(q) ||
          (p.category || "").toLowerCase().includes(q) ||
          (p.price + "").includes(q)
      );
    }

    // Sorting
    switch (sortBy) {
      case "price-asc":
        rows.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case "price-desc":
        rows.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case "name-asc":
        rows.sort((a, b) =>
          (a.product_name || "").localeCompare(b.product_name || "")
        );
        break;
      case "name-desc":
        rows.sort((a, b) =>
          (b.product_name || "").localeCompare(a.product_name || "")
        );
        break;
      case "date-asc":
        rows.sort((a, b) => new Date(a.date_accepted) - new Date(b.date_accepted));
        break;
      case "date-desc":
        rows.sort((a, b) => new Date(b.date_accepted) - new Date(a.date_accepted));
        break;
      default:
        break;
    }

    return rows;
  }, [products, sourceFilter, categoryFilter, search, sortBy]);

  // ------------------- Tab content -------------------
  const renderTabContent = () => {
    switch (activeTab) {
      case "sell":
        return <Sell onSaleComplete={fetchProducts} />;
      case "add":
        return <AddProduct onProductAdded={fetchProducts} />;
      case "list":
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
                  placeholder="Search by name, barcode, category, price"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input"
                  style={{ width: "85%", paddingRight: "25px" }}
                />
                {search && (
                  <span
                    style={{
                      position: "absolute",
                      right: "50px",
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

              <select
                className="input"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
              >
                <option value="all">All Sources</option>
                {sourceList.map((s) => (
                  <option key={s.source_id} value={s.source_id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                className="input"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Sorting buttons */}
              <button
                className="btn"
                onClick={() =>
                  setSortBy(sortBy === "price-asc" ? "price-desc" : "price-asc")
                }
              >
                Price {sortBy.includes("price") ? (sortBy === "price-asc" ? "↑" : "↓") : "↕"}
              </button>
              <button
                className="btn"
                onClick={() =>
                  setSortBy(sortBy === "name-asc" ? "name-desc" : "name-asc")
                }
              >
                Name {sortBy.includes("name") ? (sortBy === "name-asc" ? "↑" : "↓") : "↕"}
              </button>
              <button
                className="btn"
                onClick={() =>
                  setSortBy(sortBy === "date-asc" ? "date-desc" : "date-asc")
                }
              >
                Date {sortBy.includes("date") ? (sortBy === "date-asc" ? "↑" : "↓") : "↕"}
              </button>

              <button className="btn" onClick={() => setScanBarcode(!scanBarcode)}>
                {scanBarcode ? "Stop Scanner" : "Scan Barcode"}
              </button>

              <button
                className="btn danger"
                onClick={() => {
                  setSearch("");
                  setSourceFilter("all");
                  setCategoryFilter("all");
                  setSortBy("none");
                  fetchProducts();
                }}
              >
                Reset Filters
              </button>
              <button
                className="btn danger"
                onClick={handleDeleteProducts}
                disabled={selectedProducts.length === 0} // optional: disable if nothing selected
              >
                Delete Selected
              </button>

            </div>

            {scanBarcode && (
              <div className="scanner-wrap">
                <BarcodeScannerComponent
                  width={300}
                  height={200}
                  onUpdate={async (err, result) => {
                    if (result) {
                      try {
                        const res = await axios.get(
                          "http://localhost:8080/api/products/findByBarcode",
                          { params: { barcode: result.text } }
                        );
                        setProducts([res.data.product]);
                        setScanBarcode(false);
                      } catch {
                        alert("Product not found");
                      }
                    }
                  }}
                />
              </div>
            )}

            {editError && <div style={{ color: "red", marginBottom: "10px" }}>{editError}</div>}

            {/* --- Product Table --- */}
            <div className="table-wrap">
              <table className="product-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={
                          products.length > 0 &&
                          selectedProducts.length === products.length
                        }
                        onChange={() => {
                          if (selectedProducts.length === products.length)
                            setSelectedProducts([]);
                          else
                            setSelectedProducts(products.map((p) => p.product_id));
                        }}
                      />
                    </th>
                    <th>Actions</th>
                    <th>Barcode</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Category</th>
                    <th>Quantity</th>
                    <th>Date</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleProducts.map((p) => (
                    <tr key={p.product_id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(p.product_id)}
                          onChange={() =>
                            setSelectedProducts((prev) =>
                              prev.includes(p.product_id)
                                ? prev.filter((id) => id !== p.product_id)
                                : [...prev, p.product_id]
                            )
                          }
                        />
                      </td>
                      <td>
                        {editingProduct === p.product_id ? (
                          <>
                            <button
                              className="btn xs"
                              onClick={() => handleSaveProduct(p.product_id)}
                            >
                              Save
                            </button>
                            <button
                              className="btn xs danger"
                              onClick={() => setEditingProduct(null)}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            className="btn xs"
                            onClick={() => handleEditProduct(p)}
                          >
                            Edit
                          </button>
                        )}
                      </td>
                      <td>
                        {editingProduct === p.product_id ? (
                          <input
                            className="input"
                            value={editForm.barcode}
                            onChange={(e) =>
                              setEditForm({ ...editForm, barcode: e.target.value })
                            }
                          />
                        ) : (
                          p.barcode
                        )}
                      </td>
                      <td>
                        {editingProduct === p.product_id ? (
                          <input
                            className="input"
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm({ ...editForm, name: e.target.value })
                            }
                          />
                        ) : (
                          p.product_name
                        )}
                      </td>
                      <td>
                        {editingProduct === p.product_id ? (
                          <input
                            className="input"
                            value={editForm.price}
                            onChange={(e) =>
                              setEditForm({ ...editForm, price: e.target.value })
                            }
                          />
                        ) : (
                          `$${p.price}`
                        )}
                      </td>
                      <td>
                        {editingProduct === p.product_id ? (
                          <input
                            className="input"
                            value={editForm.category}
                            onChange={(e) =>
                              setEditForm({ ...editForm, category: e.target.value })
                            }
                          />
                        ) : (
                          p.category || "-"
                        )}
                      </td>
                      <td>
                        {editingProduct === p.product_id ? (
                          <input
                            className="input"
                            value={editForm.quantity}
                            onChange={(e) =>
                              setEditForm({ ...editForm, quantity: e.target.value })
                            }
                          />
                        ) : (
                          p.quantity
                        )}
                      </td>
                      <td>{p.date_accepted ? p.date_accepted.split("T")[0] : "-"}</td>
                      <td>{p.name || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Products Dashboard</h2>
        <div className="tabs">
          {["sell", "add", "list"].map((tab) => (
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

export default Product;
