class CreateBlockchainRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :blockchain_records do |t|
      t.string   :record_type,      null: false  # payment, grant, contract, audit, subsidy
      t.string   :transaction_hash, null: false
      t.string   :block_hash
      t.integer  :block_number
      t.string   :status,           default: 'confirmed'  # pending, confirmed, failed
      t.integer  :reference_id
      t.string   :reference_type
      t.decimal  :amount,           precision: 12, scale: 2
      t.string   :currency,         default: 'KES'
      t.integer  :created_by_id
      t.text     :metadata          # JSON string for extra data
      t.datetime :confirmed_at
      t.string   :network,          default: 'private'    # private, testnet, mainnet
      t.integer  :gas_used
      t.string   :smart_contract_address
      t.timestamps
    end

    add_index :blockchain_records, :transaction_hash, unique: true
    add_index :blockchain_records, :record_type
    add_index :blockchain_records, :status
    add_index :blockchain_records, [:reference_type, :reference_id]
    add_index :blockchain_records, :created_at
  end
end
