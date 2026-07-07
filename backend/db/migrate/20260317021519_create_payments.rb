class CreatePayments < ActiveRecord::Migration[8.1]
  def change
    create_table :payments do |t|
      t.integer :user_id
      t.integer :invoice_id
      t.decimal :amount
      t.string :payment_method
      t.string :transaction_reference
      t.string :status
      t.datetime :payment_date
      t.text :notes

      t.timestamps
    end
  end
end
