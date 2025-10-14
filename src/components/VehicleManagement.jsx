import { useRef, useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";

const VehicleManagement = ({
  vehicleData,
  addVehicle,
  editVehicle,
  deleteVehicle,
  bulkInsertVehicles,
  getRowHistory,
  listBulkInsertions,
  deleteBulkInsertion,
}) => {
  const fileInputRef = useRef(null);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [editData, setEditData] = useState(null);
  const [bulkList, setBulkList] = useState([]);
  const [rowHistory, setRowHistory] = useState([]);
  const [deleteBatchId, setDeleteBatchId] = useState("");

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    bulkInsertVehicles(file);
    e.target.value = null;
  };

const handleAddSubmit = async () => {
  try {
    await addVehicle(form);
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
  } catch (err) {
    console.error("Error submitting form:", err);
  }
};

const handleEditSubmit = async () => {
  try {
    await editVehicle(editData);
    setShowEditModal(false);
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
  if (!window.confirm("Are you sure you want to revert to this version?")) return;

  try {
    await editVehicle({ id: selectedVehicleId, ...previousData });
    alert("✅ Vehicle reverted successfully!");
    setShowHistoryModal(false); // close modal
  } catch (err) {
    console.error("Failed to revert:", err);
    alert("❌ Failed to revert vehicle.");
  }
};

  return (
    <section className="content-section">
      <div className="crud-actions">
        <h1 className="section-title">Vehicle Data</h1>
        <div className="action-buttons" style={{ display: "flex", gap: "10px" }}>
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
          <button className="btn list-batches" onClick={handleListBulkInsertions}>
            📋 List Bulk
          </button>
        </div>
      </div>

      <p className="section-subtitle">View, Edit and Add Vehicle Details</p>

      <div className="table-container">
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
            {vehicleData?.length > 0 ? (
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
      </div>

      {/* Add Vehicle Modal */}
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
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </div>
          ))}
          <Button label="Save" className="btn save" onClick={handleAddSubmit} />
        </div>
      </Dialog>

      {/* Edit Vehicle Modal */}
      <Dialog
        header="Edit Vehicle"
        visible={showEditModal}
        style={{ width: "40vw" }}
        onHide={() => setShowEditModal(false)}
      >
        {editData && (
          <div className="add-user-form">
            {Object.keys(editData).map((key) => (
              <div className="form-group" key={key}>
                <label>{key}</label>
                <InputText
                  value={editData[key]}
                  onChange={(e) =>
                    setEditData({ ...editData, [key]: e.target.value })
                  }
                />
              </div>
            ))}
            <Button label="Update" className="btn save" onClick={handleEditSubmit} />
          </div>
        )}
      </Dialog>

      {/* List Bulk Modal */}
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

      {/* Delete Bulk Modal */}
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
        <Button label="Delete" className="btn save" onClick={handleDeleteBatch} />
      </Dialog>

{/* Row History Modal */}
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
      <p><strong>Updated By:</strong> {entry.user?.name} ({entry.user?.email})</p>
      <p><strong>Updated On:</strong> {new Date(entry.updatedAt).toLocaleString()}</p>
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

    {/* ✅ Add the Revert Button Here */}
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
