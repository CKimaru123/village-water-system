class CreateInvoices < ActiveRecord::Migration[8.1]
  def change
    create_table :invoices do |t|
      t.references :user, null: false, foreign_key: true
      t.string :invoice_number, null: false
      t.date :billing_period_start, null: false
      t.date :billing_period_end, null: false
      t.decimal :meter_reading_previous, precision: 10, scale: 3
      t.decimal :meter_reading_current, precision: 10, scale: 3
      t.decimal :consumption_m3, precision: 10, scale: 3
      t.decimal :subtotal, precision: 10, scale: 2, null: false
      t.decimal :tax_amount, precision: 10, scale: 2, default: 0
      t.decimal :total_amount, precision: 10, scale: 2, null: false
      t.date :due_date, null: false
      t.string :status, null: false, default: 'draft' # 'draft', 'sent', 'paid', 'overdue', 'cancelled'
      t.timestamp :generated_at, default: -> { 'CURRENT_TIMESTAMP' }
      t.references :generated_by, null: false, foreign_key: { to_table: :users }
      t.timestamp :paid_at
      
      t.timestamps
    end

    add_index :invoices, :invoice_number, unique: true
    add_index :invoices, :status
    add_index :invoices, :due_date
    add_index :invoices, :billing_period_start
    add_index :invoices, :billing_period_end
  end
end