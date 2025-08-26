import { useState, useEffect } from "react";
import axios from "axios";
import BarcodeScannerComponent from "react-qr-barcode-scanner";

function AddProduct() {
  const [sourceList, setSourceList] = useState([]);
  const [newProduct, setNewProduct] = useState({
    barcode: "",
    name: "",
    price: "",
    category: "",
    quantity: "",
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

  const handleAddProduct = async () => {
    const { barcode, name, price, category, quantity, source_id } = newProduct;
    if (!barcode || !name || !price || !source_id) {
      alert("Barcode, Name, Price, and Source are required");
      return;
    }

    try {
      await axios.post("http://localhost:8080/api/products/addProduct", {
        barcode,
        product_name: name,
        price,
        category,
        quantity,
        source_id,
      });
      alert("Product added");
      window.close(); // Close this tab after saving
    } catch (err) {
      if (err.response?.data?.error) {
        alert(err.response.data.error);
      } else {
        alert("Error adding product");
      }
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Add Product</h2>
      <button onClick={() => setScanBarcode(!scanBarcode)}>
        {scanBarcode ? "Stop Scanner" : "Scan Barcode"}
      </button>

      {scanBarcode && (
        <BarcodeScannerComponent
          width={300}
          height={200}
          onUpdate={(err, result) => {
            if (result) setNewProduct((np) => ({ ...np, barcode: result.text }));
          }}
        />
      )}

      <input
        placeholder="Barcode"
        value={newProduct.barcode}
        onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
      />
      <input
        placeholder="Name"
        value={newProduct.name}
        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
      />
      <input
        placeholder="Price"
        value={newProduct.price}
        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
      />
      <input
        placeholder="Category"
        value={newProduct.category}
        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
      />
      <input
        placeholder="Quantity"
        value={newProduct.quantity}
        onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
      />

      <select
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

      <div style={{ marginTop: "10px" }}>
        <button onClick={handleAddProduct}>Save</button>
        <button onClick={() => window.close()}>Cancel</button>
      </div>
    </div>
  );
}

export default AddProduct;
