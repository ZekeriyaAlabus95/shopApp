// src/EditPrice.jsx
import { useState, useEffect, useMemo } from "react";
import BarcodeScannerComponent from "react-qr-barcode-scanner";
import { productsAPI, sourcesAPI } from "./api";
import "./App.css";

function EditPrice() {
  const [products, setProducts] = useState([]);
  const [sourceList, setSourceList] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [filter, setFilter] = useState("all");
  const [priceType, setPriceType] = useState("number");
  const [priceValue, setPriceValue] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]); // ✅ start empty
  const [selectedSource, setSelectedSource] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [alertMsg, setAlertMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [scanBarcode, setScanBarcode] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchSources();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await productsAPI.listAll();
      setProducts(data.products || []);
      setSelectedProducts([]); // clear selection by default
    } catch (err) {
      alert("Error fetching products: " + err.message);
    }
  };

  const fetchSources = async () => {
    try {
      const data = await sourcesAPI.listAll();
      setSourceList(data.sources || []);
    } catch (err) {
      alert("Error fetching sources: " + err.message);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await productsAPI.getCategories();
      setCategoryList(data.categories || []);
    } catch (err) {
      alert("Error fetching categories: " + err.message);
    }
  };

  const handleApplyPrice = async () => {
  if (isNaN(priceValue) || priceValue === "") {
    setAlertMsg("❌ Price must be a number");
    setTimeout(() => setAlertMsg(""), 5000);
    return;
  }

  // Determine the products to update
  let productsToUpdate = [];

  if (filter === "all") {
    productsToUpdate = selectedProducts;
  } else if (filter === "bySource") {
    if (!selectedSource) {
      setAlertMsg("❌ Select a source first");
      setTimeout(() => setAlertMsg(""), 5000);
      return;
    }
    productsToUpdate = filteredProducts
      .filter(p => selectedProducts.includes(p.product_id))
      .map(p => p.product_id);
  } else if (filter === "byCategory") {
    if (!selectedCategory) {
      setAlertMsg("❌ Select a category first");
      setTimeout(() => setAlertMsg(""), 5000);
      return;
    }
    productsToUpdate = filteredProducts
      .filter(p => selectedProducts.includes(p.product_id))
      .map(p => p.product_id);
  }

  if (productsToUpdate.length === 0) {
    setAlertMsg("❌ Please select at least one product!");
    setTimeout(() => setAlertMsg(""), 5000);
    return;
  }

  setLoading(true);

  try {
    const payload = {
      product_ids: productsToUpdate,
      changes: { price: Number(priceValue), type: priceType },
    };
    await productsAPI.updateSelectedProducts(payload);

    setAlertMsg("✅ Prices updated successfully!");
    fetchProducts();
    setPriceValue("");
  } catch {
    setAlertMsg("❌ Error updating prices");
  } finally {
    setTimeout(() => setAlertMsg(""), 5000);
    setLoading(false);
  }
};



  // ✅ Filtered products based on search and filter
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchFilter =
        filter === "all" ||
        (filter === "bySource" && p.source_id === Number(selectedSource)) ||
        (filter === "byCategory" &&
          (p.category || "").toLowerCase() === selectedCategory.toLowerCase());

      const lowerSearch = search.toLowerCase();
      const matchSearch =
        !search.trim() ||
        (p.product_name && p.product_name.toLowerCase().includes(lowerSearch)) ||
        (p.category && p.category.toLowerCase().includes(lowerSearch)) ||
        (sourceList.find((s) => s.source_id === p.source_id)?.name || "")
          .toLowerCase()
          .includes(lowerSearch);

      return matchFilter && matchSearch;
    });
  }, [products, filter, selectedSource, selectedCategory, search, sourceList]);

  // ✅ Select/Deselect all filtered products
  const toggleSelectAll = () => {
    const filteredIds = filteredProducts.map((p) => p.product_id);
    const allSelected = filteredIds.every((id) => selectedProducts.includes(id));

    if (allSelected) {
      // Deselect all filtered products
      setSelectedProducts(selectedProducts.filter((id) => !filteredIds.includes(id)));
    } else {
      // Select all filtered products
      setSelectedProducts([...new Set([...selectedProducts, ...filteredIds])]);
    }
  };

  const toggleProductSelection = (product_id) => {
    if (selectedProducts.includes(product_id)) {
      setSelectedProducts(selectedProducts.filter((id) => id !== product_id));
    } else {
      setSelectedProducts([...selectedProducts, product_id]);
    }
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Edit Prices</h2>
      </div>

      {alertMsg && (
        <div
          style={{
            color: alertMsg.includes("❌") ? "red" : "green",
            marginBottom: "10px",
          }}
        >
          {alertMsg}
        </div>
      )}

      {/* Filters + Price */}
      <div
        className="grid-top"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: "10px",
          marginBottom: "1rem",
        }}
      >
        <select
          className="input"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Products</option>
          <option value="bySource">By Source</option>
          <option value="byCategory">By Category</option>
        </select>

        {filter === "bySource" && (
          <select
            className="input"
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
          >
            <option value="">-- Select Source --</option>
            {sourceList.map((s) => (
              <option key={s.source_id} value={s.source_id}>
                {s.name}
              </option>
            ))}
          </select>
        )}

        {filter === "byCategory" && (
          <select
            className="input"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">-- Select Category --</option>
            {categoryList.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}

        <select
          className="input"
          value={priceType}
          onChange={(e) => setPriceType(e.target.value)}
        >
          <option value="number">Number</option>
          <option value="percentage">Percentage</option>
        </select>

        <input
          className="input"
          type="text"
          value={priceValue}
          onChange={(e) => setPriceValue(e.target.value)}
          placeholder="Value"
        />
        <button className="btn" onClick={handleApplyPrice} disabled={loading}>
          {loading ? "Applying..." : "Apply"}
        </button>
      </div>

      {/* Search + Scanner */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          alignItems: "center",
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        <input
          style={{ flexGrow: 1, minWidth: "200px" }}
          className="input"
          type="text"
          placeholder="Search products or sources..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn" onClick={() => setScanBarcode(!scanBarcode)}>
          {scanBarcode ? "Stop Scanner" : "Scan Barcode"}
        </button>
      </div>

      {scanBarcode && (
        <div style={{ marginBottom: "1rem" }}>
          <BarcodeScannerComponent
            width={300}
            height={200}
            onUpdate={async (err, result) => {
              if (result) {
                try {
                  const data = await productsAPI.findByBarcode(result.text);
                  setProducts([data.product]);
                  setSelectedProducts([]);
                  setScanBarcode(false);
                } catch (err) {
                  alert("Product not found: " + err.message);
                }
              }
            }}
          />
        </div>
      )}

      {/* Product Table */}
      <div>
        <h3>
          Products{" "}
          <label style={{ fontWeight: "normal", marginLeft: "10px" }}>
            <input type="checkbox" onChange={toggleSelectAll} 
              checked={
                filteredProducts.length > 0 &&
                filteredProducts.every((p) => selectedProducts.includes(p.product_id))
              } 
            />{" "}
            Select All
          </label>
        </h3>
        <table className="product-table">
          <thead>
            <tr>
              <th>Select</th>
              <th>Name</th>
              <th>Price</th>
              <th>Source</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p) => (
              <tr key={p.product_id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(p.product_id)}
                    onChange={() => toggleProductSelection(p.product_id)}
                  />
                </td>
                <td>{p.product_name}</td>
                <td>${p.price}</td>
                <td>{sourceList.find((s) => s.source_id === p.source_id)?.name}</td>
                <td>{p.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default EditPrice;
