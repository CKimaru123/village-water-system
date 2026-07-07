class CreateEvents < ActiveRecord::Migration[8.1]
  def change
    create_table :events do |t|
      t.string :title
      t.text :description
      t.datetime :event_date
      t.string :location
      t.string :event_type
      t.string :status
      t.integer :created_by_id
      t.integer :max_attendees

      t.timestamps
    end
  end
end
