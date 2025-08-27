import { useState, useEffect } from "react";
import axios from "axios";
import BarcodeScannerComponent from "react-qr-barcode-scanner";
import "./App.css";

function AddProduct({ onProductAdded }) {
  const [sourceList, setSourceList] = useState([]);
  const [newProduct, setNewProduct] = useState({
    barcode: "",
    name: "",
    price: "",
    category: "",
    quantity: 1,
    source_id: "",
  });
  const [scanBarcode, setScanBarcode] = useState(false);

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/sources/list");
      setSourceList(res.data.sources || []);
    } catch (err) {
      alert("Error fetching sources");
    }
  };

  const fetchProductByBarcode = async (barcode) => {
    if (!barcode) return;
    try {
      const res = await axios.get(`http://localhost:8080/api/products/findByBarcode`, {
        params: { barcode },
      });

      if (res.data.product) {
        const product = res.data.product;
        setNewProduct((prev) => ({
          ...prev,
          name: product.product_name,
          price: product.price,
          category: product.category,
          source_id: product.source_id,
        }));
      }
    } catch {
      console.log("Product not found, can add as new");
    }
  };

  const handleAddProduct = async () => {
    const { barcode, name, price, category, quantity, source_id } = newProduct;
    if (!barcode || !name || !price || !source_id) {
      alert("Barcode, Name, Price, and Source are required");
      return;
    }

    try {
      await axios.post("http://localhost:8080/api/products/addOrIncrease", {
        barcode,
        product_name: name,
        price,
        category,
        quantity,
        source_id,
      });

      alert("Product added or quantity increased successfully");

      setNewProduct({
        barcode: "",
        name: "",
        price: "",
        category: "",
        quantity: 1,
        source_id: "",
      });
      setScanBarcode(false);

      if (onProductAdded) onProductAdded();
    } catch (err) {
      if (err.response?.data?.error) alert(err.response.data.error);
      else alert("Error adding product");
    }
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Add Product</h2>
        <button className="btn" onClick={() => setScanBarcode(!scanBarcode)}>
          {scanBarcode ? "Stop Scanner" : "Scan Barcode"}
        </button>
      </div>

      {scanBarcode && (
        <div className="scanner-wrap">
          <BarcodeScannerComponent
            width={300}
            height={200}
            onUpdate={(err, result) => {
              if (result) {
                setNewProduct((prev) => ({ ...prev, barcode: result.text }));
                fetchProductByBarcode(result.text);
              }
            }}
          />
        </div>
      )}

      <div className="form">
        <div className="form-group">
          <label>Barcode</label>
          <input
            className="input"
            value={newProduct.barcode}
            onChange={(e) => {
              const code = e.target.value;
              setNewProduct({ ...newProduct, barcode: code });
              fetchProductByBarcode(code);
            }}
          />
        </div>

        <div className="form-group">
          <label>Name</label>
          <input
            className="input"
            value={newProduct.name}
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Price</label>
          <input
            className="input"
            value={newProduct.price}
            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Category</label>
          <input
            className="input"
            value={newProduct.category}
            onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>The New Quantity</label>
          <input
            className="input"
            type="number"
            min="1"
            value={newProduct.quantity}
            onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Source</label>
          <select
            className="input"
            value={newProduct.source_id}
            onChange={(e) => setNewProduct({ ...newProduct, source_id: e.target.value })}
          >
            <option value="">Select Source</option>
            {sourceList.map((s) => (
              <option key={s.source_id} value={s.source_id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-actions">
        <button className="btn" onClick={handleAddProduct}>
          Save
        </button>
        <button
          className="btn danger"
          onClick={() =>
            setNewProduct({
              barcode: "",
              name: "",
              price: "",
              category: "",
              quantity: 1,
              source_id: "",
            })
          }
        >
          Cancel
        </button>
      </div>
    </section>
  );
}

export default AddProduct;
