class AddZoneAndUsageZonesToConnections < ActiveRecord::Migration[8.1]
  def change
    # usage_zones: comma-separated zone tags for this connection
    # e.g. "kitchen,bathroom,outdoor" — used for usage breakdown charts
    add_column :connections, :usage_zones, :string, default: nil unless column_exists?(:connections, :usage_zones)

    # connection_type was already: domestic/commercial/institutional
    # Ensure zone column exists (it was in original create, just confirming)
    add_column :connections, :zone, :string unless column_exists?(:connections, :zone)
  end
end
