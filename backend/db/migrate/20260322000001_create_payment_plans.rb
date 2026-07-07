class CreatePaymentPlans < ActiveRecord::Migration[8.1]
  def change
    create_table :payment_plans do |t|
      t.integer  :user_id,             null: false
      t.integer  :invoice_id,          null: false
      t.decimal  :total_amount,        precision: 10, scale: 2, null: false
      t.decimal  :installment_amount,  precision: 10, scale: 2, null: false
      t.integer  :installments_count,  null: false, default: 3
      t.integer  :installments_paid,   null: false, default: 0
      t.date     :next_due_date
      t.string   :status,              null: false, default: 'active'
      t.text     :notes
      t.integer  :approved_by_id
      t.datetime :approved_at
      t.timestamps
    end

    add_index :payment_plans, :user_id
    add_index :payment_plans, :invoice_id
  end
end
