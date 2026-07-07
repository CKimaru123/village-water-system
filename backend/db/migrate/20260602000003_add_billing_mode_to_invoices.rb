class AddBillingModeToInvoices < ActiveRecord::Migration[8.1]
  def change
    add_column :invoices, :billing_mode, :string, null: true
    add_column :invoices, :is_estimated, :boolean, default: false, null: false
    add_column :invoices, :reading_source, :string, null: true  # 'smart_meter' | 'manual'
    add_column :invoices, :field_officer_name, :string, null: true

    add_index :invoices, :billing_mode
  end
end
