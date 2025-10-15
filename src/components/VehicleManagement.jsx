import { useRef, useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { toast } from "react-toastify";

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const getPageList = (current, total, maxButtons = 5) => {
  const pages = [];
  const half = Math.floor(maxButtons / 2);

  if (total <= maxButtons + 2) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    let start = Math.max(2, current - half);
    let end = Math.min(total - 1, current + half);
    if (current - 1 <= half) {
      start = 2;
      end = 1 + maxButtons;
    }
    if (total - current <= half) {
      end = total - 1;
      start = total - maxButtons;
    }
    if (start > 2) pages.push("…");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total - 1) pages.push("…");
    pages.push(total);
  }
  return pages;
};

const VehicleManagement = ({
  vehicleData,
  fullVehicleData,
  addVehicle,
  editVehicle,
  deleteVehicle,
  bulkInsertVehicles,
  getRowHistory,
  listBulkInsertions,
  deleteBulkInsertion,
  vehiclePagination,
  vehicleFilters,
  setVehicleFilters,
  fetchVehicles,
  vehicleLoading,
}) => {
  const fileInputRef = useRef(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [bulkList, setBulkList] = useState([]);
  const [rowHistory, setRowHistory] = useState([]);
  const [deleteBatchId, setDeleteBatchId] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [yearOptions, setYearOptions] = useState([]);
  const [makeOptions, setMakeOptions] = useState([]);
  const [locationOptions, setLocationOptions] = useState([]);
  const [modelOptions, setModelOptions] = useState([]);

  useEffect(() => {
    if (fullVehicleData && fullVehicleData.length > 0) {
      const uniqueYears = [
        ...new Set(fullVehicleData.map((v) => v.vehicleYear).filter(Boolean)),
      ].sort();
      const uniqueMakes = [
        ...new Set(fullVehicleData.map((v) => v.make).filter(Boolean)),
      ].sort();
      const uniqueLocations = [
        ...new Set(fullVehicleData.map((v) => v.auctionLocation).filter(Boolean)),
      ].sort();
      const uniqueModels = [
        ...new Set(fullVehicleData.map((v) => v.modelNumber).filter(Boolean)),
      ].sort();
      setYearOptions(uniqueYears);
      setMakeOptions(uniqueMakes);
      setLocationOptions(uniqueLocations);
      setModelOptions(uniqueModels);
    }
  }, [fullVehicleData]);

  const editableFields = [
    "auctionDate",
    "vehicleYear",
    "make",
    "series",
    "modelNumber",
    "engine",
    "odometer",
    "color",
    "auctionLocation",
    "crValue",
    "auctionSalePrice",
    "jdWholesaleValue",
    "jdRetailValue",
  ];

 const validateForm = (data) => {
  const errors = {};

  // Helper functions
  const isValidDate = (dateString) => {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };

  const isPositiveNumber = (val) =>
    val !== "" && !isNaN(val) && Number(val) >= 0;

  const isNonEmptyText = (val) =>
    typeof val === "string" && val.trim().length > 0;

  // Date validation
  if (!isNonEmptyText(data.auctionDate)) {
    errors.auctionDate = "Auction date is required";
  } else if (!isValidDate(data.auctionDate)) {
    errors.auctionDate = "Enter a valid date (YYYY-MM-DD)";
  }

  // Year validation
  if (!data.vehicleYear) {
    errors.vehicleYear = "Vehicle year is required";
  } else if (!/^(19|20)\d{2}$/.test(data.vehicleYear)) {
    errors.vehicleYear = "Enter a valid 4-digit year (1900–2099)";
  }

  // Text fields
  ["make", "series", "modelNumber", "engine", "color", "auctionLocation", "crValue"].forEach((field) => {
    if (!isNonEmptyText(data[field])) errors[field] = `${field} is required`;
  });

  // Numeric fields (must be >= 0)
  ["odometer", "auctionSalePrice", "jdWholesaleValue", "jdRetailValue"].forEach((field) => {
    if (data[field] === "" || data[field] === null || data[field] === undefined)
      errors[field] = `${field} is required`;
    else if (!isPositiveNumber(data[field]))
      errors[field] = `${field} must be a valid number ≥ 0`;
  });

  return errors;
};

  const [form, setForm] = useState({
    auctionDate: "",
    vehicleYear: "",
    make: "",
    series: "",
    modelNumber: "",
    engine: "",
    odometer: "",
    color: "",
    auctionLocation: "",
    crValue: "",
    auctionSalePrice: "",
    jdWholesaleValue: "",
    jdRetailValue: "",
  });

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append("csvFile", file);
    try {
      await bulkInsertVehicles(formData, (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(percentCompleted);
      });
      alert("✅ CSV uploaded successfully!");
    } catch (err) {
      console.error("Upload failed:", err);
      alert("❌ CSV upload failed. Check console for details.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      e.target.value = null;
    }
  };

  const handleAddSubmit = async () => {
    const errors = validateForm(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      await addVehicle(form);
      toast.success("✅ Vehicle added successfully!");
      setShowAddModal(false);
      setForm({
        auctionDate: "",
        vehicleYear: "",
        make: "",
        series: "",
        modelNumber: "",
        engine: "",
        odometer: "",
        color: "",
        auctionLocation: "",
        crValue: "",
        auctionSalePrice: "",
        jdWholesaleValue: "",
        jdRetailValue: "",
      });
      setFormErrors({});
    } catch (err) {
      console.error("Error submitting form:", err);
      toast.error("❌ Failed to add vehicle.");
    }
  };

  const handleEditSubmit = async () => {
    const relevantData = {
      auctionDate: editData.auctionDate,
      vehicleYear: editData.vehicleYear,
      make: editData.make,
      series: editData.series,
      modelNumber: editData.modelNumber,
      engine: editData.engine,
      odometer: editData.odometer,
      color: editData.color,
      auctionLocation: editData.auctionLocation,
      crValue: editData.crValue,
      auctionSalePrice: editData.auctionSalePrice,
      jdWholesaleValue: editData.jdWholesaleValue,
      jdRetailValue: editData.jdRetailValue,
    };
    const errors = validateForm(relevantData);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      await editVehicle(editData);
      setShowEditModal(false);
      setFormErrors({});
    } catch (err) {
      console.error("Error submitting edit form:", err);
    }
  };

  const handleListBulkInsertions = async () => {
    const data = await listBulkInsertions();
    setBulkList(data || []);
    setShowListModal(true);
  };

  const handleDeleteBatch = () => {
    if (deleteBatchId.trim()) deleteBulkInsertion(deleteBatchId);
    setShowDeleteModal(false);
  };

  const [selectedVehicleId, setSelectedVehicleId] = useState(null);

  const handleRowHistory = async (id) => {
    setSelectedVehicleId(id);
    const history = await getRowHistory(id);
    setRowHistory(history || []);
    setShowHistoryModal(true);
  };

  const handleRevert = async (previousData) => {
    if (!window.confirm("Are you sure you want to revert to this version?"))
      return;
    try {
      await editVehicle({ id: selectedVehicleId, ...previousData });
      alert("✅ Vehicle reverted successfully!");
      setShowHistoryModal(false);
    } catch (err) {
      console.error("Failed to revert:", err);
      alert("❌ Failed to revert vehicle.");
    }
  };

  const debouncedFetchVehicles = useRef(
    debounce((filters) => {
      fetchVehicles(filters);
    }, 300)
  ).current;

  useEffect(() => {
    debouncedFetchVehicles(vehicleFilters);
  }, [vehicleFilters, debouncedFetchVehicles]);

  return (
    <section className="content-section">
      <div className="crud-actions">
        <h1 className="section-title">Vehicle Management</h1>
        <div
          className="action-buttons"
          style={{ display: "flex", gap: "10px" }}
        >
          <button className="btn add-row" onClick={() => setShowAddModal(true)}>
            ➕ Add Vehicle
          </button>
          <button
            className="btn upload-csv"
            onClick={() => fileInputRef.current.click()}
          >
            📄 Upload CSV
          </button>
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <button
            className="btn list-batches"
            onClick={handleListBulkInsertions}
          >
            📋 List Bulk
          </button>
        </div>
      </div>
      {isUploading && (
        <div style={{ width: "100%", marginTop: "10px" }}>
          <div
            style={{
              height: "8px",
              width: "100%",
              backgroundColor: "#e5e7eb",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${uploadProgress}%`,
                backgroundColor: "#2563eb",
                transition: "width 0.2s",
              }}
            ></div>
          </div>
          <p
            style={{ fontSize: "12px", textAlign: "center", marginTop: "4px" }}
          >
            Uploading: {uploadProgress}%
          </p>
        </div>
      )}
      <p className="section-subtitle">View, Edit and Add Vehicle Details</p>
      <div className="table-container">
        <div
          className="filter-bar"
          style={{ display: "flex", gap: "10px", margin: "15px 0", flexWrap: "wrap" }}
        >
          <select
            value={vehicleFilters.year}
            onChange={(e) =>
              setVehicleFilters({ ...vehicleFilters, year: e.target.value, page: 1 })
            }
            style={{ width: "120px" }}
          >
            <option value="">All Years</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <select
            value={vehicleFilters.make}
            onChange={(e) =>
              setVehicleFilters({ ...vehicleFilters, make: e.target.value, page: 1 })
            }
            style={{ width: "150px" }}
          >
            <option value="">All Makes</option>
            {makeOptions.map((make) => (
              <option key={make} value={make}>
                {make}
              </option>
            ))}
          </select>
          <select
            value={vehicleFilters.location}
            onChange={(e) =>
              setVehicleFilters({ ...vehicleFilters, location: e.target.value, page: 1 })
            }
            style={{ width: "150px" }}
          >
            <option value="">All Locations</option>
            {locationOptions.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
          <select
            value={vehicleFilters.modelNumber}
            onChange={(e) =>
              setVehicleFilters({ ...vehicleFilters, modelNumber: e.target.value, page: 1 })
            }
            style={{ width: "150px" }}
          >
            <option value="">All Models</option>
            {modelOptions.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
          <select
            value={vehicleFilters.sortBy}
            onChange={(e) =>
              setVehicleFilters({ ...vehicleFilters, sortBy: e.target.value, page: 1 })
            }
          >
            <option value="modelNumber">Sort by Model Number</option>
            <option value="auctionDate">Sort by Date</option>
            <option value="auctionSalePrice">Sort by Price</option>
          </select>
          <select
            value={vehicleFilters.sortOrder}
            onChange={(e) =>
              setVehicleFilters({ ...vehicleFilters, sortOrder: e.target.value, page: 1 })
            }
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
        <table>
          <thead>
            <tr>
              <th>Auction Date</th>
              <th>Year</th>
              <th>Make</th>
              <th>Series</th>
              <th>Model #</th>
              <th>Engine</th>
              <th>Odometer</th>
              <th>Color</th>
              <th>Location</th>
              <th>CR Value</th>
              <th>Sale Price</th>
              <th>Wholesale</th>
              <th>Retail</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicleLoading ? (
              <tr>
                <td colSpan="14" style={{ textAlign: "center" }}>
                  Loading vehicles...
                </td>
              </tr>
            ) : vehicleData?.length > 0 ? (
              vehicleData.map((v) => (
                <tr key={v.id}>
                  <td>{v.auctionDate}</td>
                  <td>{v.vehicleYear}</td>
                  <td>{v.make}</td>
                  <td>{v.series}</td>
                  <td>{v.modelNumber}</td>
                  <td>{v.engine}</td>
                  <td>{v.odometer}</td>
                  <td>{v.color}</td>
                  <td>{v.auctionLocation}</td>
                  <td>{v.crValue}</td>
                  <td>{v.auctionSalePrice}</td>
                  <td>{v.jdWholesaleValue}</td>
                  <td>{v.jdRetailValue}</td>
                  <td style={{ display: "flex", gap: "10px" }}>
                    <button
                      className="icon-btn edit"
                      onClick={() => {
                        setEditData(v);
                        setShowEditModal(true);
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      className="icon-btn delete"
                      onClick={() => deleteVehicle(v.id)}
                    >
                      🗑️
                    </button>
                    <button
                      className="icon-btn history"
                      onClick={() => handleRowHistory(v.id)}
                    >
                      🕒
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="14" style={{ textAlign: "center" }}>
                  No vehicle data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="pagination-container">
          <button
            className="pagination-btn"
            onClick={() => {
              if (vehiclePagination.currentPage > 1) {
                setVehicleFilters({
                  ...vehicleFilters,
                  page: vehiclePagination.currentPage - 1,
                });
              }
            }}
            disabled={vehiclePagination.currentPage === 1}
          >
            ←
          </button>
          {getPageList(vehiclePagination.currentPage, vehiclePagination.totalPages, 5).map(
            (p, idx) =>
              p === "…" ? (
                <span key={`el-${idx}`} className="ellipsis">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  className={`pagination-btn ${
                    vehiclePagination.currentPage === p ? "active" : ""
                  }`}
                  onClick={() => {
                    setVehicleFilters({ ...vehicleFilters, page: p });
                  }}
                >
                  {p}
                </button>
              )
          )}
          <button
            className="pagination-btn"
            onClick={() => {
              if (vehiclePagination.currentPage < vehiclePagination.totalPages) {
                setVehicleFilters({
                  ...vehicleFilters,
                  page: vehiclePagination.currentPage + 1,
                });
              }
            }}
            disabled={vehiclePagination.currentPage === vehiclePagination.totalPages}
          >
            →
          </button>
        </div>
      </div>
      <Dialog
        header="Add New Vehicle"
        visible={showAddModal}
        style={{ width: "40vw" }}
        onHide={() => setShowAddModal(false)}
      >
        <div className="add-user-form">
          {Object.keys(form).map((key) => (
            <div className="form-group" key={key}>
              <label>{key}</label>
             <InputText
  type={key.includes("Date") ? "date" : key.match(/Price|Value|odometer|Year/) ? "number" : "text"}
  value={form[key]}
  onChange={(e) => {
    // Prevent negative input manually too
    const val = e.target.value;
    if (key.match(/Price|Value|odometer|Year/) && Number(val) < 0) return;
    setForm({ ...form, [key]: val });
  }}
  min={key.match(/Price|Value|odometer|Year/) ? 0 : undefined}
/>


              {formErrors[key] && (
                <small style={{ color: "red" }}>{formErrors[key]}</small>
              )}
            </div>
          ))}
          <Button label="Save" className="btn save" onClick={handleAddSubmit} />
        </div>
      </Dialog>
<Dialog
  header="✏️ Edit Vehicle Details"
  visible={showEditModal}
  style={{ width: "45vw", maxWidth: "700px" }}
  onHide={() => setShowEditModal(false)}
>
  {editData && (
    <div
      className="edit-vehicle-form"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "1rem",
        padding: "10px 0",
      }}
    >
      {editableFields.map((key) => (
        <div key={key} style={{ display: "flex", flexDirection: "column" }}>
          <label
            style={{
              fontWeight: "600",
              textTransform: "capitalize",
              marginBottom: "4px",
            }}
          >
            {key.replace(/([A-Z])/g, " $1")}
          </label>
         <InputText
  type={
    key.includes("Date")
      ? "date"
      : key.match(/Price|Value|odometer|Year/)
      ? "number"
      : "text"
  }
  value={editData[key] || ""}
  onChange={(e) => {
    const val = e.target.value;
    if (key.match(/Price|Value|odometer|Year/) && Number(val) < 0) return;
    setEditData({ ...editData, [key]: val });
  }}
  min={key.match(/Price|Value|odometer|Year/) ? 0 : undefined}
  style={{
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  }}
/>

          {formErrors[key] && (
            <small style={{ color: "red", marginTop: "4px" }}>
              {formErrors[key]}
            </small>
          )}
        </div>
      ))}

      <div
        style={{
          gridColumn: "1 / -1",
          textAlign: "right",
          marginTop: "1.5rem",
        }}
      >
        <Button
          label="Update Vehicle"
          icon="pi pi-check"
          className="p-button-success"
          onClick={handleEditSubmit}
          style={{
            padding: "8px 20px",
            fontWeight: "600",
            borderRadius: "8px",
          }}
        />
      </div>
    </div>
  )}
</Dialog>

      <Dialog
        header="📋 Bulk Insertions"
        visible={showListModal}
        style={{ width: "60vw" }}
        onHide={() => setShowListModal(false)}
      >
        {bulkList.length > 0 ? (
          <div className="bulk-list-table-container">
            <table className="bulk-list-table">
              <thead>
                <tr>
                  <th>Batch ID</th>
                  <th>Record Count</th>
                  <th>Status</th>
                  <th>Created On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bulkList.map((batch) => (
                  <tr key={batch.batchId}>
                    <td>{batch.batchId}</td>
                    <td>{batch.recordCount}</td>
                    <td>
                      <span className="status-badge status-success">
                        {batch.status}
                      </span>
                    </td>
                    <td>{new Date(batch.createdAt).toLocaleString()}</td>
                    <td>
                      <Button
                        label="Delete"
                        icon="pi pi-trash"
                        severity="danger"
                        text
                        onClick={() => deleteBulkInsertion(batch.batchId)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ textAlign: "center", padding: "20px" }}>
            No bulk insertions found.
          </p>
        )}
      </Dialog>
      <Dialog
        header="Delete Bulk Insertion"
        visible={showDeleteModal}
        style={{ width: "30vw" }}
        onHide={() => setShowDeleteModal(false)}
      >
        <label>Enter Batch ID:</label>
        <InputText
          value={deleteBatchId}
          onChange={(e) => setDeleteBatchId(e.target.value)}
        />
        <Button
          label="Delete"
          className="btn save"
          onClick={handleDeleteBatch}
        />
      </Dialog>
      <Dialog
        header="🕒 Vehicle Row History"
        visible={showHistoryModal}
        style={{ width: "65vw" }}
        onHide={() => setShowHistoryModal(false)}
      >
        {rowHistory.length > 0 ? (
          <div className="row-history-container">
            {rowHistory.map((entry, index) => (
              <div key={index} className="history-entry">
                <div className="history-meta">
                  <p>
                    <strong>Updated By:</strong> {entry.user?.name} (
                    {entry.user?.email})
                  </p>
                  <p>
                    <strong>Updated On:</strong>{" "}
                    {new Date(entry.updatedAt).toLocaleString()}
                  </p>
                </div>
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>New Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(entry.changes || {}).map(([key, value]) => (
                      <tr key={key}>
                        <td className="history-key">{key}</td>
                        <td className="history-value">{String(value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ textAlign: "right", marginTop: "10px" }}>
                  <Button
                    label="↩️ Revert to This Version"
                    severity="warning"
                    onClick={() => handleRevert(entry.changes)}
                  />
                </div>
                <hr style={{ margin: "20px 0" }} />
              </div>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: "center", padding: "20px" }}>
            No history found for this vehicle.
          </p>
        )}
      </Dialog>
    </section>
  );
};

export default VehicleManagement;