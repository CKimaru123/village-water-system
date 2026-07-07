class AddAffectedZoneToAnomalyDetections < ActiveRecord::Migration[8.1]
  def change
    add_column :anomaly_detections, :affected_zone, :string
    add_column :anomaly_detections, :resolved_by_id, :integer
    add_column :anomaly_detections, :resolution_notes, :text
    add_column :anomaly_detections, :incident_id, :integer
    add_index  :anomaly_detections, :affected_zone
    add_index  :anomaly_detections, :resolved_by_id
  end
end
