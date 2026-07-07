class CreatePendingPayments < ActiveRecord::Migration[8.1]
  def change
    create_table :pending_payments do |t|
      t.references :user,     null: false, foreign_key: true
      t.references :invoice,  null: true,  foreign_key: true
      t.decimal    :amount,   precision: 10, scale: 2, null: false
      t.string     :payment_method,      null: false
      t.string     :checkout_request_id  # no inline index — added below with exists? guard
      t.string     :status,   default: "pending"
      t.integer    :payment_id
      t.integer    :initiated_by_id

      t.timestamps
    end

    add_index :pending_payments, :status                unless index_exists?(:pending_payments, :status)
    add_index :pending_payments, :checkout_request_id  unless index_exists?(:pending_payments, :checkout_request_id)
  end
end
