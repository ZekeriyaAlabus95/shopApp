// src/App.jsx
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import BarcodeScannerComponent from "react-qr-barcode-scanner";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("products");

  // --- PRODUCTS ---
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", price: "", category: "" });
  const [selectedProducts, setSelectedProducts] = useState([]);
  
  // Add Product Modal
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    barcode: "",
    name: "",
    price: "",
    category: "",
    quantity: "",
    source_id: "",
  });
  const [scanBarcode, setScanBarcode] = useState(false);

  // --- FILTERS & SORT (Products) ---
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("none"); // price-asc, price-desc, name-asc, name-desc, cat-asc, cat-desc

  // --- SOURCES ---
  const [sourceList, setSourceList] = useState([]);
  const [editingSource, setEditingSource] = useState(null);
  const [editSourceForm, setEditSourceForm] = useState({ name: "", phone: "", address: "" });
  const [selectedSources, setSelectedSources] = useState([]);
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [newSource, setNewSource] = useState({ name: "", phone: "", address: "" });

  // Load products & sources automatically on first render
  useEffect(() => {
    fetchProducts();
    fetchSources();
  }, []);

  // --- API: PRODUCTS ---
  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/products/list");
      setProducts(res.data.products || []);
      setSelectedProducts([]);
    } catch (err) {
      console.error(err);
      alert("Error fetching products");
    }
  };

  // --- API: SOURCES ---
  const fetchSources = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/sources/list");
      setSourceList(res.data.sources || []);
      setSelectedSources([]);
    } catch (err) {
      console.error(err);
      alert("Error fetching sources");
    }
  };

  // --- PRODUCT SELECTION ---
  const toggleSelectProduct = (id) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const toggleSelectAllProducts = () => {
    if (selectedProducts.length === products.length) setSelectedProducts([]);
    else setSelectedProducts(products.map((p) => p.product_id));
  };

  // --- SOURCE SELECTION ---
  const toggleSelectSource = (id) => {
    setSelectedSources((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const toggleSelectAllSources = () => {
    if (selectedSources.length === sourceList.length) setSelectedSources([]);
    else setSelectedSources(sourceList.map((s) => s.source_id));
  };

  // --- DELETE PRODUCTS ---
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
      setProducts(products.filter((p) => !selectedProducts.includes(p.product_id)));
      setSelectedProducts([]);
      alert("Products deleted");
    } catch (err) {
      console.error(err);
      alert("Error deleting products");
    }
  };

  // --- DELETE SOURCES ---
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
      // Also refresh products (some products may have been cascaded depending on FK rules)
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("Error deleting sources");
    }
  };

  // --- EDIT PRODUCT ---
  const handleEditProduct = (product) => {
    setEditingProduct(product.product_id);
    setEditForm({
      name: product.product_name,
      price: product.price,
      category: product.category || "",
    });
  };

  const handleSaveProduct = async (id) => {
    const product = products.find((p) => p.product_id === id);
    try {
      await axios.put("http://localhost:8080/api/products/update", {
        product_id: id,
        product_name: editForm.name || product.product_name,
        price: editForm.price || product.price,
        barcode: product.barcode,
        date_accepted: product.date_accepted,
        quantity: product.quantity,
        source_id: product.source_id,
      });

      setProducts(
        products.map((p) =>
          p.product_id === id
            ? { ...p, product_name: editForm.name, price: editForm.price }
            : p
        )
      );
      setEditingProduct(null);
      alert("Product updated");
    } catch (err) {
      console.error(err);
      alert("Error updating product");
    }
  };

  // --- EDIT SOURCE ---
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
          s.source_id === id
            ? {
                ...s,
                name: editSourceForm.name,
                phone: editSourceForm.phone,
                address: editSourceForm.address,
              }
            : s
        )
      );
      setEditingSource(null);
      alert("Source updated");
    } catch (err) {
      console.error(err);
      alert("Error updating source");
    }
  };

  // --- ADD PRODUCT ---
  const handleAddProduct = async () => {
    const { barcode, name, price, category, quantity, source_id } = newProduct;
    if (!barcode || !name || !price || source_id === "" || source_id === null) {
      alert("Barcode, Name, Price, and Source are required");
      return;
    }

    try {
      const res = await axios.post("http://localhost:8080/api/products/addProduct", {
        barcode,
        product_name: name,
        price,
        category,
        quantity,
        source_id,
      });

      // Append newly created product (assuming backend returns { product: {...} })
      setProducts((prev) => [...prev, res.data.product]);
      setNewProduct({
        barcode: "",
        name: "",
        price: "",
        category: "",
        quantity: "",
        source_id: "",
      });
      setShowAddProductModal(false);
      setScanBarcode(false);
      alert("Product added successfully");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || "Error adding product");
    }
  };

  // --- ADD SOURCE ---
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
      setSourceList((prev) => [...prev, created]); // updates Sources tab immediately
      // Also update product form dropdown immediately
      // (Products tab uses sourceList for its dropdown)
      setNewSource({ name: "", phone: "", address: "" });
      setShowAddSourceModal(false);
      alert("Source added successfully");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || "Error adding source");
    }
  };

  // ----- FILTERED + SORTED PRODUCTS -----
  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.category && p.category.trim() !== "") set.add(p.category);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const visibleProducts = useMemo(() => {
    let rows = [...products];

    // Filter by source
    if (sourceFilter !== "all") {
      const sourceIdNum = Number(sourceFilter);
      rows = rows.filter((p) => Number(p.source_id) === sourceIdNum);
    }

    // Filter by category
    if (categoryFilter !== "all") {
      rows = rows.filter(
        (p) => (p.category || "").toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    // Search (name, barcode, category)
    if (search.trim() !== "") {
      const q = search.toLowerCase();
      rows = rows.filter((p) => {
        const name = (p.product_name || "").toLowerCase();
        const barcode = (p.barcode || "").toLowerCase();
        const cat = (p.category || "").toLowerCase();
        return name.includes(q) || barcode.includes(q) || cat.includes(q);
      });
    }

    // Sort
    switch (sortBy) {
      case "price-asc":
        rows.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
        break;
      case "price-desc":
        rows.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
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
      case "cat-asc":
        rows.sort((a, b) => (a.category || "").localeCompare(b.category || ""));
        break;
      case "cat-desc":
        rows.sort((a, b) => (b.category || "").localeCompare(a.category || ""));
        break;
      default:
        break;
    }

    return rows;
  }, [products, sourceFilter, categoryFilter, search, sortBy]);

  // --- RENDER ---
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
        {/* --- PRODUCTS TAB --- */}
        {activeTab === "products" && (
          <section className="panel">
            <div className="panel-header">
              <h2>Products</h2>
              <div className="actions-row">
                <button className="btn danger" onClick={handleDeleteProducts}>
                  Delete Selected
                </button>
                <button
                  className="btn"
                  onClick={() => setShowAddProductModal(true)}
                >
                  Add Product
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="filters">
              <input
                className="input"
                placeholder="Search name, barcode, category…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
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
              <select
                className="input"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="none">No Sort</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="name-asc">Name: A → Z</option>
                <option value="name-desc">Name: Z → A</option>
                <option value="cat-asc">Category: A → Z</option>
                <option value="cat-desc">Category: Z → A</option>
              </select>
              <button
                className="btn ghost"
                onClick={() => {
                  setSearch("");
                  setSourceFilter("all");
                  setCategoryFilter("all");
                  setSortBy("none");
                }}
              >
                Clear
              </button>
            </div>

            {/* Add Product Modal */}
            {showAddProductModal && (
              <div className="modal">
                <div className="modal-content">
                  <h3>Add Product</h3>
                  <button
                    className="btn"
                    onClick={() => setScanBarcode(!scanBarcode)}
                  >
                    {scanBarcode ? "Stop Scanner" : "Scan Barcode"}
                  </button>

                  {scanBarcode && (
                    <div style={{ margin: "10px 0" }}>
                      <BarcodeScannerComponent
                        width={300}
                        height={200}
                        onUpdate={(err, result) => {
                          if (result) {
                            setNewProduct((np) => ({
                              ...np,
                              barcode: result.text,
                            }));
                          }
                        }}
                      />
                      <small>Scanning... barcode will autofill</small>
                    </div>
                  )}

                  <input
                    className="input"
                    type="text"
                    placeholder="Barcode"
                    value={newProduct.barcode}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, barcode: e.target.value })
                    }
                  />
                  <input
                    className="input"
                    type="text"
                    placeholder="Name"
                    value={newProduct.name}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, name: e.target.value })
                    }
                  />
                  <input
                    className="input"
                    type="number"
                    placeholder="Price"
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, price: e.target.value })
                    }
                  />
                  <input
                    className="input"
                    type="text"
                    placeholder="Category"
                    value={newProduct.category}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, category: e.target.value })
                    }
                  />
                  <input
                    className="input"
                    type="number"
                    placeholder="Quantity"
                    value={newProduct.quantity}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        quantity: e.target.value,
                      })
                    }
                  />

                  {/* Source dropdown from sourceList */}
                  <select
                    className="input"
                    value={newProduct.source_id}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        source_id: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Source</option>
                    {sourceList.map((s) => (
                      <option key={s.source_id} value={s.source_id}>
                        {s.name}
                      </option>
                    ))}
                  </select>

                  <div className="modal-actions">
                    <button className="btn" onClick={handleAddProduct}>
                      Save Product
                    </button>
                    <button
                      className="btn danger"
                      onClick={() => {
                        setShowAddProductModal(false);
                        setScanBarcode(false);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Products Table */}
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
                        onChange={toggleSelectAllProducts}
                      />
                    </th>
                    <th>Actions</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Category</th>
                    <th>Quantity</th>
                    <th>Barcode</th>
                    <th>Date Accepted</th>
                    <th>Source Name</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleProducts.map((p) => (
                    <tr key={p.product_id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(p.product_id)}
                          onChange={() => toggleSelectProduct(p.product_id)}
                        />
                      </td>
                      <td className="actions">
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
                            type="text"
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
                            type="number"
                            value={editForm.price}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                price: e.target.value,
                              })
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
                            type="text"
                            value={editForm.category}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                category: e.target.value,
                              })
                            }
                          />
                        ) : (
                          p.category || "-"
                        )}
                      </td>
                      <td>{p.quantity}</td>
                      <td>{p.barcode}</td>
                      <td>
                        {p.date_accepted
                          ? new Date(p.date_accepted).toLocaleDateString()
                          : "-"}
                      </td>
                      <td>{p.name || "-"}</td>
                    </tr>
                  ))}
                  {visibleProducts.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ textAlign: "center", opacity: 0.7 }}>
                        No products found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* --- SOURCES TAB --- */}
        {activeTab === "sources" && (
          <section className="panel">
            <div className="panel-header">
              <h2>Sources</h2>
              <div className="actions-row">
                <button className="btn danger" onClick={handleDeleteSources}>
                  Delete Selected
                </button>
                <button
                  className="btn"
                  onClick={() => setShowAddSourceModal(true)}
                >
                  Add Source
                </button>
              </div>
            </div>

            {/* Add Source Modal */}
            {showAddSourceModal && (
              <div className="modal">
                <div className="modal-content">
                  <h3>Add Source</h3>
                  <input
                    className="input"
                    type="text"
                    placeholder="Name"
                    value={newSource.name}
                    onChange={(e) =>
                      setNewSource({ ...newSource, name: e.target.value })
                    }
                  />
                  <input
                    className="input"
                    type="text"
                    placeholder="Phone"
                    value={newSource.phone}
                    onChange={(e) =>
                      setNewSource({ ...newSource, phone: e.target.value })
                    }
                  />
                  <input
                    className="input"
                    type="text"
                    placeholder="Address"
                    value={newSource.address}
                    onChange={(e) =>
                      setNewSource({ ...newSource, address: e.target.value })
                    }
                  />

                  <div className="modal-actions">
                    <button className="btn" onClick={handleAddSource}>
                      Save Source
                    </button>
                    <button
                      className="btn danger"
                      onClick={() => setShowAddSourceModal(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Sources Table */}
            <div className="table-wrap">
              <table className="product-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={
                          sourceList.length > 0 &&
                          selectedSources.length === sourceList.length
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
                  {sourceList.map((s) => (
                    <tr key={s.source_id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedSources.includes(s.source_id)}
                          onChange={() => toggleSelectSource(s.source_id)}
                        />
                      </td>
                      <td className="actions">
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
                            type="text"
                            value={editSourceForm.name}
                            onChange={(e) =>
                              setEditSourceForm({
                                ...editSourceForm,
                                name: e.target.value,
                              })
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
                            type="text"
                            value={editSourceForm.phone}
                            onChange={(e) =>
                              setEditSourceForm({
                                ...editSourceForm,
                                phone: e.target.value,
                              })
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
                            type="text"
                            value={editSourceForm.address}
                            onChange={(e) =>
                              setEditSourceForm({
                                ...editSourceForm,
                                address: e.target.value,
                              })
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
                      <td colSpan={5} style={{ textAlign: "center", opacity: 0.7 }}>
                        No sources found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
