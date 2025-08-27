// src/EditPrice.jsx
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import BarcodeScannerComponent from "react-qr-barcode-scanner";
import "./App.css";

function EditPrice() {
  const [products, setProducts] = useState([]);
  const [sourceList, setSourceList] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [filter, setFilter] = useState("all"); 
  const [priceType, setPriceType] = useState("number"); 
  const [priceValue, setPriceValue] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedSource, setSelectedSource] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [alertMsg, setAlertMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectAll, setSelectAll] = useState(true);
  const [search, setSearch] = useState("");
  const [scanBarcode, setScanBarcode] = useState(false);
  const [searchByProduct, setSearchByProduct] = useState(true);
  const [searchBySource, setSearchBySource] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchSources();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/products/list");
      setProducts(res.data.products || []);
      setSelectedProducts(res.data.products.map(p => p.product_id));
      setSelectAll(true);
    } catch {
      alert("Error fetching products");
    }
  };

  const fetchSources = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/sources/list");
      setSourceList(res.data.sources || []);
    } catch {
      alert("Error fetching sources");
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/products/categories");
      setCategoryList(res.data.categories || []);
    } catch {
      alert("Error fetching categories");
    }
  };

  const handleApplyPrice = async () => {
    if (isNaN(priceValue) || priceValue === "") {
      setAlertMsg("❌ Price must be a number");
      setTimeout(() => setAlertMsg(""), 10000);
      return;
    }

    setLoading(true);
    let payload = {};

    try {
      if (filter === "all") {
        payload = { priceIncrease: Number(priceValue), type: priceType };
        await axios.put("http://localhost:8080/api/products/updateAllProducts", payload);
      } else if (filter === "bySource") {
        if (!selectedSource) {
          alert("Select a source first");
          setLoading(false);
          return;
        }
        payload = {
          source_id: selectedSource,
          changes: { price: Number(priceValue), type: priceType },
        };
        await axios.put("http://localhost:8080/api/products/updateBySource", payload);
      } else if (filter === "byCategory") {
        if (!selectedCategory) {
          alert("Select a category first");
          setLoading(false);
          return;
        }
        payload = {
          category: selectedCategory,
          changes: { price: Number(priceValue), type: priceType },
        };
        await axios.put("http://localhost:8080/api/products/updateByCategory", payload);
      }

      setAlertMsg("✅ Prices updated successfully!");
      fetchProducts();
      setPriceValue("");
    } catch {
      setAlertMsg("❌ Error updating prices");
    } finally {
      setTimeout(() => setAlertMsg(""), 10000);
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.product_id));
    }
    setSelectAll(!selectAll);
  };

  const toggleProductSelection = (product_id) => {
    if (selectedProducts.includes(product_id)) {
      setSelectedProducts(selectedProducts.filter(id => id !== product_id));
    } else {
      setSelectedProducts([...selectedProducts, product_id]);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchFilter =
        (filter === "all") ||
        (filter === "bySource" && p.source_id === Number(selectedSource)) ||
        (filter === "byCategory" && (p.category || "").toLowerCase() === selectedCategory.toLowerCase());

      const matchSearch = !search.trim() || (
        (searchByProduct && (p.product_name || "").toLowerCase().includes(search.toLowerCase())) ||
        (searchBySource && (p.name || "").toLowerCase().includes(search.toLowerCase()))
      );

      return matchFilter && matchSearch;
    });
  }, [products, filter, selectedSource, selectedCategory, search, searchByProduct, searchBySource]);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Edit Prices</h2>
      </div>

      {alertMsg && (
        <div style={{ color: alertMsg.includes("❌") ? "red" : "green", marginBottom: "10px" }}>
          {alertMsg}
        </div>
      )}

      {/* Top Row: Filters + Price */}
      <div className="grid-top" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "10px", marginBottom: "1rem" }}>
        <select className="input" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Products</option>
          <option value="bySource">By Source</option>
          <option value="byCategory">By Category</option>
        </select>

        {filter === "bySource" && (
          <select className="input" value={selectedSource} onChange={e => setSelectedSource(e.target.value)}>
            <option value="">-- Select Source --</option>
            {sourceList.map(s => (
              <option key={s.source_id} value={s.source_id}>{s.name}</option>
            ))}
          </select>
        )}

        {filter === "byCategory" && (
          <select className="input" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
            <option value="">-- Select Category --</option>
            {categoryList.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}

        <select className="input" value={priceType} onChange={e => setPriceType(e.target.value)}>
          <option value="number">Number</option>
          <option value="percentage">Percentage</option>
        </select>

        <input className="input" type="text" value={priceValue} onChange={e => setPriceValue(e.target.value)} placeholder="Value" />
        <button className="btn" onClick={handleApplyPrice} disabled={loading}>{loading ? "Applying..." : "Apply"}</button>
      </div>

      {/* Second Row: Search checkboxes */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "0.5rem", flexWrap: "wrap" }}>
        <label>
          <input type="checkbox" checked={searchByProduct} onChange={() => setSearchByProduct(!searchByProduct)} defaultChecked /> Product
        </label>
        <label>
          <input type="checkbox" checked={searchBySource} onChange={() => setSearchBySource(!searchBySource)} /> Source
        </label>
      </div>

      {/* Third Row: Search bar + Scanner */}
      <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap" }}>
        <input style={{ flexGrow: 1, minWidth: "200px" }} className="input" type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        <button className="btn" onClick={() => setScanBarcode(!scanBarcode)}>{scanBarcode ? "Stop Scanner" : "Scan Barcode"}</button>
      </div>

      {scanBarcode && (
        <div style={{ marginBottom: "1rem" }}>
          <BarcodeScannerComponent
            width={300}
            height={200}
            onUpdate={async (err, result) => {
              if (result) {
                try {
                  const res = await axios.get("http://localhost:8080/api/products/findByBarcode", { params: { barcode: result.text } });
                  setProducts([res.data.product]);
                  setSelectedProducts([res.data.product.product_id]);
                  setScanBarcode(false);
                } catch {
                  alert("Product not found");
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
            <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} /> Select All
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
            {filteredProducts.map(p => (
              <tr key={p.product_id}>
                <td>
                  <input type="checkbox" checked={selectedProducts.includes(p.product_id)} onChange={() => toggleProductSelection(p.product_id)} />
                </td>
                <td>{p.product_name}</td>
                <td>${p.price}</td>
                <td>{p.name}</td>
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
