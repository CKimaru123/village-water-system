class CreateInvoiceLineItems < ActiveRecord::Migration[8.1]
  def change
    create_table :invoice_line_items do |t|
      t.references :invoice, null: false, foreign_key: true
      t.string :item_type, null: false # 'water_consumption', 'fixed_charge', 'sewerage', 'late_fee', 'adjustment'
      t.string :description, null: false
      t.decimal :quantity, precision: 10, scale: 3
      t.decimal :unit_rate, precision: 10, scale: 2
      t.decimal :amount, precision: 10, scale: 2, null: false
      
      t.timestamps
    end

    add_index :invoice_line_items, :item_type
  end
end