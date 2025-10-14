import { useRef } from "react";

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    bulkInsertVehicles(file);
    e.target.value = null;
  };

  return (
    <section className="content-section">
      <div className="crud-actions">
        <h1 className="section-title">Vehicle Data</h1>
        <div
          className="action-buttons"
          style={{ display: "flex", gap: "10px" }}
        >
          <button className="btn add-row" onClick={addVehicle}>
            ➕ Add Vehicle
          </button>
          <button
            className="btn upload-csv"
            onClick={() => fileInputRef.current.click()}
          >
            📄 Upload
          </button>
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <button className="btn list-batches" onClick={listBulkInsertions}>
            📋 List Bulk
          </button>
          <button
            className="btn delete-batch"
            onClick={() => {
              const batchId = prompt("Enter Batch ID to delete:");
              if (batchId) deleteBulkInsertion(batchId);
            }}
          >
            🗑️ Delete Bulk{" "}
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
            {Array.isArray(vehicleData) && vehicleData.length > 0 ? (
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
                      onClick={() => editVehicle(v)}
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
                      onClick={() => getRowHistory(v.id)}
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
    </section>
  );
};

export default VehicleManagement;
