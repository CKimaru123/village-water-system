class CreateConnections < ActiveRecord::Migration[8.1]
  def change
    create_table :connections do |t|
      t.references :user, null: false, foreign_key: true
      t.string :connection_number, null: false
      t.string :meter_number, null: false
      t.date :connection_date, null: false
      t.string :connection_type, null: false, default: 'new' # 'new', 'reconnection', 'upgrade'
      t.string :service_line_size
      t.string :connection_status, null: false, default: 'active' # 'active', 'disconnected', 'suspended'
      t.string :zone
      t.decimal :gps_latitude, precision: 10, scale: 8
      t.decimal :gps_longitude, precision: 11, scale: 8
      t.text :installation_notes
      
      t.timestamps
    end

    add_index :connections, :connection_number, unique: true
    add_index :connections, :meter_number, unique: true
    add_index :connections, :connection_status
    add_index :connections, :zone
  end
end