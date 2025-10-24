import { useRef, useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { AutoComplete } from "primereact/autocomplete";
import { Tooltip } from "primereact/tooltip";
import { toast } from "react-toastify";
import { confirmDialog } from "primereact/confirmdialog";
import { Calendar } from "primereact/calendar";
import "./VehicleManagement.css";

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
  currentUser,
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
  const [yearSuggestions, setYearSuggestions] = useState([]);
  const [makeSuggestions, setMakeSuggestions] = useState([]);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [modelSuggestions, setModelSuggestions] = useState([]);
  const isViewer = currentUser?.role === "viewer";

  useEffect(() => {
    if (fullVehicleData && fullVehicleData.length > 0) {
      const uniqueYears = [
        ...new Set(fullVehicleData.map((v) => v.vehicleYear).filter(Boolean)),
      ].sort();
      const uniqueMakes = [
        ...new Set(fullVehicleData.map((v) => v.make).filter(Boolean)),
      ].sort();
      const uniqueLocations = [
        ...new Set(
          fullVehicleData.map((v) => v.auctionLocation).filter(Boolean)
        ),
      ].sort();
      const uniqueModels = [
        ...new Set(fullVehicleData.map((v) => v.modelNumber).filter(Boolean)),
      ].sort();
      setYearSuggestions(uniqueYears);
      setMakeSuggestions(uniqueMakes);
      setLocationSuggestions(uniqueLocations);
      setModelSuggestions(uniqueModels);
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
  const isValidDate = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };
  const isPositiveNumber = (val) =>
    val !== "" && !isNaN(val) && Number(val) >= 0;
  const isNonEmptyText = (val) =>
    typeof val === "string" && val.trim().length > 0;
  const isNotNumeric = (val) =>
    typeof val === "string" && !/^\d+$/.test(val.trim());
  const hasNoInvalidChars = (val) =>
    typeof val === "string" && !/[^\w\s]/.test(val.trim());
  const isValidColorText = (val) =>
    typeof val === "string" &&
    /^[a-zA-Z\s]+$/.test(val.trim()) && val.trim().length > 0;

  // Validate auctionDate
  if (!isNonEmptyText(data.auctionDate)) {
    errors.auctionDate = "Auction date is required";
  } else if (!isValidDate(data.auctionDate)) {
    errors.auctionDate = "Enter a valid date (YYYY-MM-DD)";
  }

  // Validate vehicleYear
  if (!data.vehicleYear) {
    errors.vehicleYear = "Vehicle year is required";
  } else if (!/^(19|20)\d{2}$/.test(data.vehicleYear)) {
    errors.vehicleYear = "Enter a valid 4-digit year (1900–2099)";
  }

  // Validate text fields
  ["make", "series", "modelNumber", "engine", "auctionLocation"].forEach((field) => {
    if (!isNonEmptyText(data[field])) {
      errors[field] = `${field} is required and cannot be empty or just spaces`;
    } else if (!isNotNumeric(data[field])) {
      errors[field] = `${field} cannot be purely numeric`;
    } else if (!hasNoInvalidChars(data[field])) {
      errors[field] = `${field} cannot contain special characters`;
    }
  });

  // Validate crValue specifically
  if (!isNonEmptyText(data.crValue)) {
    errors.crValue = "CR Value is required";
  } else if (!hasNoInvalidChars(data.crValue)) {
    errors.crValue = "CR Value cannot contain special characters";
  }

  if (!isValidColorText(data.color)) {
  errors.color = "Color should only contain alphabets and spaces (e.g., 'Sky Blue')";
  }

  // Validate numeric fields
  ["odometer", "auctionSalePrice", "jdWholesaleValue", "jdRetailValue","crValue"].forEach(
    (field) => {
      if (
        data[field] === "" ||
        data[field] === null ||
        data[field] === undefined
      ) {
        errors[field] = `${field} is required`;
      } else if (!isPositiveNumber(data[field])) {
        errors[field] = `${field} must be a valid number ≥ 0`;
      }
    }
  );

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

    const validTypes = ["text/csv", "application/vnd.ms-excel"];
    const validExtension = file.name.toLowerCase().endsWith(".csv");
    if (!validTypes.includes(file.type) || !validExtension) {
      toast.error("Please upload a valid CSV file.");
      e.target.value = null;
      return;
    }

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
      toast.success("CSV uploaded successfully!");
    } catch (err) {
      console.error("Upload failed:", err);

      // Check if API sent a response message
      const apiMessage =
        err.response?.data?.message ||
        err.response?.data ||
        err.message ||
        "CSV upload failed";

      toast.error(apiMessage, {
        position: "top-right",
        autoClose: 8000,
        theme: "colored",
      });
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
      toast.success("Vehicle added successfully!");
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
      toast.error("Failed to add vehicle.");
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
    if (Object.keys(errors).length > 0) {
    toast.error("Please fix the validation errors before saving.");
    return;
  }
    try {
      const result = await editVehicle(editData);
      if (result.success) {
        toast.success("Vehicle updated successfully!");
        setShowEditModal(false);
        setFormErrors({});
      } else {
        toast.error(result.message || "Failed to update vehicle.");
      }
    } catch (err) {
      console.error("Error submitting edit form:", err);
      toast.error("Failed to update vehicle.");
    }
  };

  const handleListBulkInsertions = async () => {
    const data = await listBulkInsertions();
    setBulkList(data || []);
    setShowListModal(true);
  };

  const handleDeleteBatch = async () => {
  if (!deleteBatchId.trim()) {
    toast.error("Please enter a valid Batch ID.");
    return;
  }
  try {
    await deleteBulkInsertion(deleteBatchId); // Wait for deletion
    const updatedList = await listBulkInsertions(); // Fetch updated list
    setBulkList(updatedList || []); // Update state
    setDeleteBatchId(""); // Clear the input
    setShowDeleteModal(false); // Close the delete modal
    //toast.success("Bulk insertion deleted successfully!");
    if (updatedList.length === 0) {
      setShowListModal(false); // Close the list modal if empty
    }
  } catch (err) {
    console.error("Error in handleDeleteBatch:", err);
    //toast.error("Failed to delete bulk insertion.");
  }
};

 const handleDeleteBatchFromList = async (batchId) => {
  try {
    await deleteBulkInsertion(batchId); // Wait for deletion to complete
    const updatedList = await listBulkInsertions(); // Fetch the updated list
    setBulkList(updatedList || []); // Update the state
    toast.success("Bulk insertion deleted successfully!");
    if (updatedList.length === 0) {
      setShowListModal(false); // Close the modal if the list is empty
    }
  } catch (err) {
    console.error("Error in handleDeleteBatchFromList:", err);
    toast.error("Failed to delete bulk insertion.");
  }
};

  const [selectedVehicleId, setSelectedVehicleId] = useState(null);

  const handleRowHistory = async (id) => {
    setSelectedVehicleId(id);
    const history = await getRowHistory(id);
    setRowHistory(history || []);
    setShowHistoryModal(true);
  };

  const handleRevert = async (previousData) => {
    confirmDialog({
      message: "Are you sure you want to revert to this previous version?",
      header: "Confirm Revert",
      icon: "pi pi-undo",
      acceptLabel: "Yes, Revert",
      rejectLabel: "Cancel",
      accept: async () => {
        try {
          const result = await editVehicle({
            id: selectedVehicleId,
            ...previousData,
          });
          if (result.success) {
            toast.success("Vehicle reverted successfully!");
            setShowHistoryModal(false);
          } else {
            toast.error(result.message || "Failed to revert vehicle.");
          }
        } catch (err) {
          console.error("Failed to revert:", err);
          toast.error("Failed to revert vehicle.");
        }
      },
    });
  };

  const debouncedFetchVehicles = useRef(
    debounce((filters) => {
      fetchVehicles(filters);
    }, 300)
  ).current;

  useEffect(() => {
    if (vehicleFilters) {
      debouncedFetchVehicles(vehicleFilters);
    }
  }, [vehicleFilters, debouncedFetchVehicles]);

  useEffect(() => {
  console.log("bulkList updated:", bulkList); // Debug log
}, [bulkList]);

  // Autocomplete suggestion handlers
  const searchYears = (event) => {
    const query = event.query.toLowerCase();
    const filtered = yearSuggestions.filter((year) =>
      year.toString().toLowerCase().includes(query)
    );
    setYearSuggestions(filtered);
  };

  const searchMakes = (event) => {
    const query = event.query.toLowerCase();
    const filtered = makeSuggestions.filter((make) =>
      make.toLowerCase().includes(query)
    );
    setMakeSuggestions(filtered);
  };

  const searchLocations = (event) => {
    const query = event.query.toLowerCase();
    const filtered = locationSuggestions.filter((loc) =>
      loc.toLowerCase().includes(query)
    );
    setLocationSuggestions(filtered);
  };

  const searchModels = (event) => {
    const query = event.query.toLowerCase();
    const filtered = modelSuggestions.filter((model) =>
      model.toLowerCase().includes(query)
    );
    setModelSuggestions(filtered);
  };

  return (
    <section className="content-section">
      {!isViewer && (
        <div className="crud-actions">
          <h1 className="section-title">Vehicle Management</h1>
          <div
            className="action-buttons"
            style={{ display: "flex", gap: "10px" }}
          >
            <button
              className="btn add-row"
              onClick={() => setShowAddModal(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 24 24">
  <path d="M12 5v14m7-7H5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
</svg>
 Add Vehicle
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
      )}
      {isUploading && !isViewer && (
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
      <p className="section-subtitle">View Vehicle Details</p>
      <div className="table-container">
        {vehicleFilters ? (
          <div
            className="filter-bar"
            style={{
              display: "flex",
              gap: "10px",
              margin: "15px 0",
              flexWrap: "wrap",
            }}
          >
            <AutoComplete
              value={vehicleFilters.year || ""}
              suggestions={yearSuggestions}
              completeMethod={searchYears}
              onChange={(e) =>
                setVehicleFilters({
                  ...vehicleFilters,
                  year: e.value,
                  page: 1,
                })
              }
              placeholder="Search Years"
              style={{ width: "180px" }}
              inputStyle={{ width: "100%" }}
              dropdown
            />
            <AutoComplete
              value={vehicleFilters.make || ""}
              suggestions={makeSuggestions}
              completeMethod={searchMakes}
              onChange={(e) =>
                setVehicleFilters({
                  ...vehicleFilters,
                  make: e.value,
                  page: 1,
                })
              }
              placeholder="Search Makes"
              style={{ width: "180px" }}
              inputStyle={{ width: "100%" }}
              dropdown
            />
            <AutoComplete
              value={vehicleFilters.location || ""}
              suggestions={locationSuggestions}
              completeMethod={searchLocations}
              onChange={(e) =>
                setVehicleFilters({
                  ...vehicleFilters,
                  location: e.value,
                  page: 1,
                })
              }
              placeholder="Search Locations"
              style={{ width: "180px" }}
              inputStyle={{ width: "100%" }}
              dropdown
            />
            <AutoComplete
              value={vehicleFilters.modelNumber || ""}
              suggestions={modelSuggestions}
              completeMethod={searchModels}
              onChange={(e) =>
                setVehicleFilters({
                  ...vehicleFilters,
                  modelNumber: e.value,
                  page: 1,
                })
              }
              placeholder="Search Models"
              style={{ width: "180px" }}
              inputStyle={{ width: "100%" }}
              dropdown
            />
            <select
              value={vehicleFilters.sortBy || "modelNumber"}
              onChange={(e) =>
                setVehicleFilters({
                  ...vehicleFilters,
                  sortBy: e.target.value,
                  page: 1,
                })
              }
            >
              <option value="modelNumber">Sort by Model Number</option>
              <option value="auctionDate">Sort by Date</option>
              <option value="auctionSalePrice">Sort by Price</option>
            </select>
            <select
              value={vehicleFilters.sortOrder || "desc"}
              onChange={(e) =>
                setVehicleFilters({
                  ...vehicleFilters,
                  sortOrder: e.target.value,
                  page: 1,
                })
              }
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        ) : (
          <p>Loading filters...</p>
        )}
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
              {!isViewer && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
  {vehicleLoading ? (
    <tr>
      <td colSpan={isViewer ? 13 : 14}>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading vehicle data...</p>
          {[...Array(5)].map((_, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                gap: "10px",
                width: "100%",
                margin: "8px 0",
              }}
            >
              {[...Array(isViewer ? 13 : 14)].map((_, cellIndex) => (
                <div
                  key={cellIndex}
                  className="skeleton-loader"
                  style={{
                    height: "30px",
                    width: "100%",
                    maxWidth: "100px",
                  }}
                ></div>
              ))}
            </div>
          ))}
        </div>
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
        {!isViewer && (
          <td style={{ display: "flex", gap: "10px" }}>
            <Tooltip target={`.edit-btn-${v.id}`} />
            <button
              className={`icon-btn edit edit-btn-${v.id}`}
              onClick={() => {
                setEditData(v);
                setShowEditModal(true);
              }}
              data-pr-tooltip="Edit vehicle"
              data-pr-position="top"
            >
              ✏️
            </button>
            <Tooltip target={`.delete-btn-${v.id}`} />
            <button
              className={`icon-btn delete delete-btn-${v.id}`}
              onClick={() => {
                confirmDialog({
                  message: "Are you sure you want to delete this vehicle?",
                  header: "Confirm Deletion",
                  icon: "pi pi-exclamation-triangle",
                  acceptClassName: "p-button-danger",
                  acceptLabel: "Yes, Delete",
                  rejectLabel: "Cancel",
                  accept: () => deleteVehicle(v.id),
                });
              }}
              data-pr-tooltip="Delete vehicle"
              data-pr-position="top"
            >
              🗑️
            </button>
            <Tooltip target={`.history-btn-${v.id}`} />
            <button
              className={`icon-btn history history-btn-${v.id}`}
              onClick={() => handleRowHistory(v.id)}
              data-pr-tooltip="View row history"
              data-pr-position="top"
            >
              🕒
            </button>
          </td>
        )}
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan={isViewer ? 13 : 14} style={{ textAlign: "center" }}>
        No vehicle data found
      </td>
    </tr>
  )}
</tbody>
        </table>
        {vehiclePagination ? (
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
            {getPageList(
              vehiclePagination.currentPage,
              vehiclePagination.totalPages,
              5
            ).map((p, idx) =>
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
                if (
                  vehiclePagination.currentPage < vehiclePagination.totalPages
                ) {
                  setVehicleFilters({
                    ...vehicleFilters,
                    page: vehiclePagination.currentPage + 1,
                  });
                }
              }}
              disabled={
                vehiclePagination.currentPage === vehiclePagination.totalPages
              }
            >
              →
            </button>
          </div>
        ) : (
          <p>Loading pagination...</p>
        )}
      </div>
      {!isViewer && (
        <>
          <Dialog
  header="Add New Vehicle"
  visible={showAddModal}
  style={{ width: "40vw" }}
  onHide={() => setShowAddModal(false)}
>
  <div className="add-user-form">
    {Object.keys(form).map((key) => (
      <div className="form-group" key={key}>
        <label style={{ fontWeight: "600", textTransform: "capitalize" }}>
          {key
            .replace(/([A-Z])/g, " $1")
            .trim()
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")}
        </label>
        {key === "auctionDate" ? (
          <Calendar
  value={form[key] ? new Date(form[key]) : null}
  onChange={(e) => {
    const date = e.value;
    setForm({
      ...form,
      [key]: date ? date.toISOString().split("T")[0] : "",
    });
  }}
  dateFormat="yy-mm-dd"
  showIcon
  icon="pi pi-calendar" // Use PrimeReact's calendar icon
  inputClassName="p-inputtext"
  style={{ width: "100%" }}
/>
        ) : (
          <InputText
            type={
              key.includes("Date")
                ? "date"
                : key.match(/Price|Value|odometer|Year/)
                ? "number"
                : "text"
            }
            value={form[key]}
            onChange={(e) => {
              const val = e.target.value;
              if (
                key.match(/Price|Value|odometer|Year/) &&
                Number(val) < 0
              )
                return;
              setForm({ ...form, [key]: val });
            }}
            min={key.match(/Price|Value|odometer|Year/) ? 0 : undefined}
          />
        )}
        {formErrors[key] && (
          <small style={{ color: "red" }}>{formErrors[key]}</small>
        )}
      </div>
    ))}
    <Button
      label="Save"
      className="btn save"
      onClick={handleAddSubmit}
    />
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
        <div
          key={key}
          style={{ display: "flex", flexDirection: "column" }}
        >
          <label
            style={{
              fontWeight: "600",
              textTransform: "capitalize",
              marginBottom: "4px",
            }}
          >
            {key.replace(/([A-Z])/g, " $1")}
          </label>
          {key === "auctionDate" ? (
            <Calendar
              value={editData[key] ? new Date(editData[key]) : null}
              onChange={(e) => {
                const date = e.value;
                setEditData({
                  ...editData,
                  [key]: date ? date.toISOString().split("T")[0] : "",
                });
              }}
              dateFormat="yy-mm-dd"
              showIcon
              inputClassName="p-inputtext"
              style={{
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                width: "100%",
              }}
            />
          ) : (
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
                if (
                  key.match(/Price|Value|odometer|Year/) &&
                  Number(val) < 0
                )
                  return;
                setEditData({ ...editData, [key]: val });
              }}
              min={
                key.match(/Price|Value|odometer|Year/) ? 0 : undefined
              }
              style={{
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #ccc",
              }}
            />
          )}
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
                            onClick={() =>
                              handleDeleteBatchFromList(batch.batchId)
                            }
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
            footer={
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                }}
              >
                <Button
                  label="Cancel"
                  className="btn cancel"
                  onClick={() => setShowDeleteModal(false)}
                />
                <Button
                  label="Delete"
                  className="btn save"
                  onClick={handleDeleteBatch}
                />
              </div>
            }
          >
            <label>Enter Batch ID:</label>
            <InputText
              value={deleteBatchId}
              onChange={(e) => setDeleteBatchId(e.target.value)}
              placeholder="Enter Batch ID"
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
                        {Object.entries(entry.changes || {}).map(
                          ([key, value]) => (
                            <tr key={key}>
                              <td className="history-key">{key}</td>
                              <td className="history-value">{String(value)}</td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                    {currentUser?.role === "admin" && (
                      <div style={{ textAlign: "right", marginTop: "10px" }}>
                        <Button
                          label="↩️ Revert to This Version"
                          severity="warning"
                          onClick={() => handleRevert(entry.changes)}
                        />
                      </div>
                    )}
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
        </>
      )}
    </section>
  );
};

export default VehicleManagement;
