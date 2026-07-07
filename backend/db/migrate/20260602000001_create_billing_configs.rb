class CreateBillingConfigs < ActiveRecord::Migration[8.1]
  def change
    create_table :billing_configs do |t|
      t.integer  :user_id,       null: true  # null = global default
      t.string   :billing_mode,  null: false, default: 'usage_based'
      t.decimal  :fixed_amount,  precision: 10, scale: 2
      t.integer  :tariff_id,     null: true
      t.date     :effective_from, null: false, default: -> { 'CURRENT_DATE' }
      t.integer  :created_by_id, null: true
      t.timestamps
    end

    # Only one global default (user_id IS NULL) and one per user
    add_index :billing_configs, :user_id
    add_index :billing_configs, :billing_mode
  end
end
