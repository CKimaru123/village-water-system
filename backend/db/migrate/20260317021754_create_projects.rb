class CreateProjects < ActiveRecord::Migration[8.1]
  def change
    create_table :projects do |t|
      t.string :title
      t.text :description
      t.string :status
      t.string :project_type
      t.date :start_date
      t.date :end_date
      t.decimal :budget
      t.string :location
      t.decimal :gps_latitude
      t.decimal :gps_longitude
      t.integer :created_by_id

      t.timestamps
    end
  end
end
