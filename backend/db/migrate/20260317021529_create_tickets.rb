class CreateTickets < ActiveRecord::Migration[8.1]
  def change
    create_table :tickets do |t|
      t.integer :user_id
      t.string :subject
      t.text :description
      t.string :category
      t.string :priority
      t.string :status
      t.integer :assigned_to_id
      t.datetime :resolved_at
      t.text :resolution_notes

      t.timestamps
    end
  end
end
