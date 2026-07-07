class AddSubsidyTypeToSubsidies < ActiveRecord::Migration[8.1]
  def change
    # subsidy_type already exists in the model but may not be in schema as a proper column
    # Add percentage_discount column; rename existing 'percentage' if needed
    unless column_exists?(:subsidies, :percentage_discount)
      add_column :subsidies, :percentage_discount, :decimal, precision: 5, scale: 2
    end

    # Ensure subsidy_type column exists (model references it but schema may use 'amount' only)
    unless column_exists?(:subsidies, :subsidy_type)
      add_column :subsidies, :subsidy_type, :string, default: 'fixed_amount'
    end

    add_index :subsidies, :subsidy_type unless index_exists?(:subsidies, :subsidy_type)
  end
end
