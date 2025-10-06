import { useRef, useState } from "react";
import BarcodeScannerComponent from "react-qr-barcode-scanner";
import { productsAPI } from "./api";
import "./App.css";

function Sell() {
  const [scanBarcode, setScanBarcode] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [soldProducts, setSoldProducts] = useState([]); // list of products to sell
  const scanCooldownRef = useRef(false); // prevent rapid multi-reads

  // Sound effect
  const addProductSFX = new Audio("/sfx/add-product.mp3"); // sound in public/sfx/add-product.mp3

  // Fetch product by barcode
  const fetchProductByBarcode = async (code) => {
    if (!code) return;

    try {
      const data = await productsAPI.findByBarcode(code);

      if (data.product) {
        const price = Number(data.product.price);

        setSoldProducts((prev) => {
          const existing = prev.find((p) => p.barcode === code);
          let updated;
          if (existing) {
            updated = prev.map((p) =>
              p.barcode === code
                ? { ...p, quantity: p.quantity + 1, total: (p.quantity + 1) * price }
                : p
            );
          } else {
            // Use fetched product data; ensure numeric price and total
            const prod = { ...data.product, price, quantity: 1, total: price };
            updated = [...prev, prod];
          }

          // Play sound effect when product is added
          addProductSFX.currentTime = 0;
          // Audio play can fail if user hasn't interacted yet; ignore errors
          addProductSFX.play().catch(() => {});

          return updated;
        });
      } else {
        alert("Product not found");
      }
    } catch (err) {
      alert("Error fetching product");
    }
  };

  // Handle quantity change
  const handleQuantityChange = (barcode, qty) => {
    setSoldProducts((prev) =>
      prev.map((p) => {
        if (p.barcode === barcode) {
          const quantity = Number(qty) > 0 ? Number(qty) : 1;
          return { ...p, quantity, total: quantity * Number(p.price) };
        }
        return p;
      })
    );
  };

  // Remove a product from sell list
  const removeProduct = (barcode) => {
    setSoldProducts((prev) => prev.filter((p) => p.barcode !== barcode));
  };

  // Total amount of all products
  const totalAmount = soldProducts.reduce((sum, p) => sum + Number(p.total), 0);

  // Handle selling
  const handleSell = async () => {
    if (soldProducts.length === 0) {
      alert("No products selected");
      return;
    }

    try {
      const data = await productsAPI.sellProduct(
        soldProducts.map((p) => ({
          product_id: p.product_id,
          quantity: p.quantity
        }))
      );

      const txId = data?.transaction_id;
      const total = data?.total_amount;
      if (txId) {
        alert(`Sale recorded. Transaction #${txId} | Total: $${Number(total).toFixed(2)}`);
      } else {
        alert(data.message || "Products sold successfully");
      }

      // Clear sold products list
      setSoldProducts([]);
      setBarcodeInput("");
    } catch (err) {
      const msg = (err && err.message) || (err && err.error) || "Error selling products";
      alert(msg);
    }
  };

  return (
    <div className="sell-panel">
      <h3>Sell Products</h3>

      {/* Barcode scanner toggle */}
      <button className="btn" onClick={() => setScanBarcode(!scanBarcode)}>
        {scanBarcode ? "Stop Scanner" : "Scan Barcode"}
      </button>

      {scanBarcode && (
        <div className="scanner-wrap">
        <BarcodeScannerComponent
          width={300}
          height={200}
          onUpdate={(err, result) => {
            if (!result) return;
            if (scanCooldownRef.current) return; // ignore if cooling down
            scanCooldownRef.current = true;
            fetchProductByBarcode(result.text);
            setTimeout(() => {
              scanCooldownRef.current = false;
            }, 1000); // 1s delay to avoid auto-increment
          }}
        />
        </div>
      )}

      {/* Manual barcode input */}
      <div style={{ marginTop: "10px" }}>
        <input
          className="input"
          placeholder="Enter barcode"
          value={barcodeInput}
          onChange={(e) => setBarcodeInput(e.target.value)}
        />
        <button
          className="btn"
          onClick={() => {
            fetchProductByBarcode(barcodeInput);
            setBarcodeInput("");
          }}
        >
          Add Product
        </button>
      </div>

      {/* Products table */}
      {soldProducts.length > 0 && (
        <div className="table-wrap" style={{ marginTop: "20px" }}>
          <table className="product-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {soldProducts.map((p) => (
                <tr key={p.barcode}>
                  <td>{p.product_name}</td>
                  <td>${p.price}</td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      value={p.quantity}
                      onChange={(e) => handleQuantityChange(p.barcode, e.target.value)}
                      style={{ width: "60px" }}
                    />
                  </td>
                  <td>${p.total.toFixed(2)}</td>
                  <td>
                    <button className="btn xs danger" onClick={() => removeProduct(p.barcode)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: "10px", fontWeight: "bold" }}>
            Total Amount: ${totalAmount.toFixed(2)}
          </div>

          <button className="btn" style={{ marginTop: "10px" }} onClick={handleSell}>
            Complete Sale
          </button>
        </div>
      )}
    </div>
  );
}

export default Sell;
