import { useState, useEffect, useMemo } from "react";
import { transactionsAPI, productsAPI, sourcesAPI } from "./api";
import "./App.css";


function Transaction() {
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [sourceList, setSourceList] = useState([]);
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("none");

  useEffect(() => {
    fetchTransactions();
    fetchSources();
    fetchProducts();
  }, []);

  const fetchTransactions = async () => {
    try {
      const data = await transactionsAPI.listAll();
      setTransactions(data.transactions || []);
      setSelectedTransactions([]);
    } catch (err) {
      alert("Error fetching transactions: " + err.message);
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

  const fetchProducts = async () => {
    try {
      const data = await productsAPI.listAll();
      setProducts(data.products || []);
    } catch (err) {
      alert("Error fetching products: " + err.message);
    }
  };

  const handleDeleteTransactions = async () => {
    if (selectedTransactions.length === 0) {
      alert("Select at least one transaction");
      return;
    }
    if (!window.confirm("Delete selected transactions?")) return;
    try {
      alert("Delete functionality needs backend support");
    } catch (err) {
      alert("Error deleting transactions: " + err.message);
    }
  };

  const visibleTransactions = useMemo(() => {
    let rows = [...transactions];

    // Filters
    if (sourceFilter !== "all")
      rows = rows.filter((t) => Number(t.source_id) === Number(sourceFilter));
    if (typeFilter !== "all") rows = rows.filter((t) => t.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (t) =>
          (t.type || "").toLowerCase().includes(q) ||
          (t.total_amount + "").includes(q) ||
          (t.transaction_date || "").toLowerCase().includes(q)
      );
    }

    // Sorting
    switch (sortBy) {
      case "date-asc":
        rows.sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));
        break;
      case "date-desc":
        rows.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
        break;
      case "amount-asc":
        rows.sort((a, b) => Number(a.total_amount) - Number(b.total_amount));
        break;
      case "amount-desc":
        rows.sort((a, b) => Number(b.total_amount) - Number(a.total_amount));
        break;
      default:
        break;
    }

    return rows;
  }, [transactions, sourceFilter, typeFilter, search, sortBy]);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Transactions Dashboard</h2>
      </div>

      {/* --- Controls --- */}
      <div
        className="controls"
        style={{ display: "flex", gap: "10px", flexWrap: "wrap", margin: "1rem 0" }}
      >
        <input
          type="text"
          placeholder="Search by type, date, or amount"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input"
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
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="sell">Sell</option>
          <option value="buy">Buy</option>
        </select>

        <button
          className="btn"
          onClick={() =>
            setSortBy(sortBy === "date-asc" ? "date-desc" : "date-asc")
          }
        >
          Date {sortBy.includes("date") ? (sortBy === "date-asc" ? "↑" : "↓") : "↕"}
        </button>
        <button
          className="btn"
          onClick={() =>
            setSortBy(sortBy === "amount-asc" ? "amount-desc" : "amount-asc")
          }
        >
          Amount {sortBy.includes("amount") ? (sortBy === "amount-asc" ? "↑" : "↓") : "↕"}
        </button>

        <button
          className="btn danger"
          onClick={() => {
            setSearch("");
            setSourceFilter("all");
            setTypeFilter("all");
            setSortBy("none");
            fetchTransactions();
          }}
        >
          Reset Filters
        </button>

        <button
          className="btn danger"
          onClick={handleDeleteTransactions}
          disabled={selectedTransactions.length === 0}
        >
          Delete Selected
        </button>
      </div>

      {/* --- Transactions Table --- */}
      <div className="table-wrap">
        <table className="product-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={
                    transactions.length > 0 &&
                    selectedTransactions.length === transactions.length
                  }
                  onChange={() => {
                    if (selectedTransactions.length === transactions.length)
                      setSelectedTransactions([]);
                    else
                      setSelectedTransactions(transactions.map((t) => t.transaction_id));
                  }}
                />
              </th>
              <th>Type</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {visibleTransactions.map((t) => (
              <tr key={t.transaction_id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedTransactions.includes(t.transaction_id)}
                    onChange={() =>
                      setSelectedTransactions((prev) =>
                        prev.includes(t.transaction_id)
                          ? prev.filter((id) => id !== t.transaction_id)
                          : [...prev, t.transaction_id]
                      )
                    }
                  />
                </td>
                <td>{t.type}</td>
                <td>{t.transaction_date ? t.transaction_date.split("T")[0] : "-"}</td>
                <td>${t.total_amount}</td>
                <td>
                  {sourceList.find((s) => s.source_id === t.source_id)?.name || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default Transaction;
