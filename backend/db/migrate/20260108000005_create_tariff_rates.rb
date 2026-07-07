class CreateTariffRates < ActiveRecord::Migration[8.1]
  def change
    create_table :tariff_rates do |t|
      t.string :rate_name, null: false
      t.string :account_type, null: false # 'household', 'institution'
      t.decimal :tier_min_usage, precision: 10, scale: 3, null: false
      t.decimal :tier_max_usage, precision: 10, scale: 3
      t.decimal :rate_per_unit, precision: 10, scale: 2, null: false
      t.decimal :fixed_charge, precision: 10, scale: 2, default: 0
      t.date :effective_date, null: false
      t.date :expiry_date
      t.boolean :is_active, default: true
      
      t.timestamps
    end

    add_index :tariff_rates, :account_type
    add_index :tariff_rates, :effective_date
    add_index :tariff_rates, :is_active
  end
end