class CreateTreePlantings < ActiveRecord::Migration[7.1]
  def change
    create_table :tree_plantings do |t|
      t.references :user, null: false, foreign_key: true

      # Tree details
      t.string  :tree_type,    null: false, default: "indigenous"  # indigenous | exotic
      t.string  :category,     null: false, default: "fruit"       # fruit|timber|shade|heritage|medicinal|agroforestry
      t.string  :species,      null: false
      t.integer :quantity,     null: false, default: 1
      t.string  :water_need,   default: "medium"                   # low | medium | high
      t.string  :location
      t.text    :notes

      # Admin review
      t.string  :status,       null: false, default: "pending"     # pending | verified | rejected
      t.integer :verified_by_id
      t.datetime :verified_at
      t.text    :rejection_reason

      # Carbon credit awarded (kg CO2)
      t.decimal :carbon_credit_kg, precision: 10, scale: 3, default: 0

      t.timestamps
    end

    create_table :tree_planting_photos do |t|
      t.references :tree_planting, null: false, foreign_key: true
      t.string  :file_name,   null: false
      t.string  :file_path,   null: false
      t.integer :file_size,   null: false
      t.string  :file_format, null: false
      t.string  :photo_type,  null: false, default: "initial"  # initial | growth_update | verification
      t.text    :caption
      t.date    :taken_on
      t.timestamps
    end

    create_table :tree_growth_updates do |t|
      t.references :tree_planting, null: false, foreign_key: true
      t.references :user,          null: false, foreign_key: true
      t.date    :update_date,  null: false
      t.decimal :height_cm,    precision: 8, scale: 2
      t.string  :health_status               # healthy | stressed | dead | unknown
      t.text    :notes
      t.integer :trees_alive                 # out of original quantity
      t.timestamps
    end

    add_index :tree_plantings,     [:user_id, :status]
    add_index :tree_planting_photos, [:tree_planting_id, :photo_type]
    add_index :tree_growth_updates, [:tree_planting_id, :update_date]
  end
end
