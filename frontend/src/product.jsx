import { useState, useEffect, useMemo } from "react";
import axios from "axios";
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

  useEffect(() => {
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

  // ------------------- CRUD & Handlers -------------------
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
  };

  const handleSaveProduct = async (id) => {
    try {
      await axios.put("http://localhost:8080/api/products/update", {
        product_id: id,
        barcode: editForm.barcode,
        product_name: editForm.name,
        price: editForm.price,
        category: editForm.category,
        quantity: editForm.quantity,
        source_id: editForm.source_id,
        // DO NOT send date_accepted, backend keeps it
      });
      await fetchProducts();
      setEditingProduct(null);
      alert("Product updated");
    } catch {
      alert("Error updating product");
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
          (p.category || "").toLowerCase().includes(q)
      );
    }
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
      default:
        break;
    }
    return rows;
  }, [products, sourceFilter, categoryFilter, search, sortBy]);

  // ------------------- Sub-tab content -------------------
  const renderTabContent = () => {
    switch (activeTab) {
      case "sell":
        return <Sell onSaleComplete={fetchProducts} />;
      case "add":
        return <AddProduct onProductAdded={fetchProducts} />;
      case "list":
        return (
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
                          setSelectedProducts(
                            products.map((p) => p.product_id)
                          );
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
