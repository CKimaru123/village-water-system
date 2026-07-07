class CreatePolls < ActiveRecord::Migration[8.1]
  def change
    create_table :polls do |t|
      t.string :title
      t.text :description
      t.string :status
      t.integer :created_by_id
      t.datetime :closes_at

      t.timestamps
    end
  end
end
