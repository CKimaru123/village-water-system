class CreateReadingSchedules < ActiveRecord::Migration[8.1]
  def change
    create_table :reading_schedules do |t|
      t.integer :meter_id,       null: true  # null = global default
      t.string  :schedule_type,  null: false, default: 'end_of_month'
      t.integer :interval_value, null: true  # used for interval_minutes / interval_hours
      t.string  :daily_time,     null: true  # used for daily_at, e.g. "00:00"
      t.boolean :active,         null: false, default: true
      t.integer :created_by_id,  null: true
      t.timestamps
    end

    add_index :reading_schedules, :meter_id
    add_index :reading_schedules, :schedule_type
    add_index :reading_schedules, :active
  end
end
