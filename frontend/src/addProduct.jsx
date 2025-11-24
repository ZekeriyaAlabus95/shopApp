import { useState, useEffect } from "react";
import BarcodeScannerComponent from "react-qr-barcode-scanner";
import { productsAPI, sourcesAPI } from "./api";
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
      const data = await sourcesAPI.listAll();
      setSourceList(data.sources || []);
    } catch (err) {
      alert("Error fetching sources: " + err.message);
    }
  };

  const fetchProductByBarcode = async (barcode) => {
    if (!barcode) return;
    try {
      const data = await productsAPI.findByBarcode(barcode);

      if (data.product) {
        const product = data.product;
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
    // Wrap the single product in an array
    await productsAPI.addOrIncrease({
      items: [
        {
          barcode,
          product_name: name,
          price: Number(price),
          category,
          quantity: Number(quantity),
          source_id: Number(source_id),
        },
      ],
    });

    alert("Product added or quantity increased successfully");

    // Reset the form
    setNewProduct({
      barcode: "",
      name: "",
      price: "",
      category: "",
      quantity: 1,
      source_id: "",
    });
    setScanBarcode(false);

    // Optional callback
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
