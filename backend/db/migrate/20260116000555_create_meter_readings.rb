class CreateMeterReadings < ActiveRecord::Migration[8.1]
  def change
    create_table :meter_readings do |t|
      t.references :connection, null: false, foreign_key: true
      t.decimal :reading_value, precision: 10, scale: 2, null: false
      t.date :reading_date, null: false
      t.string :reading_type, default: 'manual'
      t.references :recorded_by, foreign_key: { to_table: :users }
      t.text :notes

      t.timestamps
    end

    add_index :meter_readings, :reading_date
    add_index :meter_readings, [:connection_id, :reading_date], unique: true
  end
end
