class CreateMeters < ActiveRecord::Migration[8.1]
  def change
    create_table :meters do |t|
      t.references :connection, null: false, foreign_key: true
      t.string :meter_serial, null: false
      t.string :meter_type, null: false, default: 'mechanical' # 'mechanical', 'digital', 'smart'
      t.string :meter_size
      t.date :installation_date, null: false
      t.date :last_reading_date
      t.decimal :last_reading_value, precision: 10, scale: 3
      t.string :meter_status, null: false, default: 'active' # 'active', 'faulty', 'replaced'
      t.date :calibration_date
      t.date :next_calibration_date
      
      t.timestamps
    end

    add_index :meters, :meter_serial, unique: true
    add_index :meters, :meter_status
    add_index :meters, :last_reading_date
  end
end