class AddFieldsToConnections < ActiveRecord::Migration[8.1]
  def change
    add_column :connections, :meter_type, :string, default: 'smart_digital'
    add_column :connections, :meter_installation_date, :date
    add_column :connections, :meter_status, :string, default: 'functioning'
    add_column :connections, :pipe_diameter, :decimal, precision: 5, scale: 2
    add_column :connections, :water_pressure, :decimal, precision: 5, scale: 2
    add_column :connections, :supply_schedule, :string, default: '24/7'
    add_column :connections, :account_number, :string
    
    add_index :connections, :account_number, unique: true
    add_index :connections, :meter_status
  end
end
