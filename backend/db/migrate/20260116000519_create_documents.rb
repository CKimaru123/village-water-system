class CreateDocuments < ActiveRecord::Migration[8.1]
  def change
    create_table :documents do |t|
      t.references :user, null: false, foreign_key: true
      t.string :document_type, null: false
      t.string :document_number
      t.string :file_name, null: false
      t.string :file_path, null: false
      t.bigint :file_size, null: false
      t.string :file_format
      t.string :status, default: 'unverified', null: false
      t.datetime :uploaded_at, default: -> { 'CURRENT_TIMESTAMP' }
      t.references :verified_by, foreign_key: { to_table: :users }
      t.datetime :verified_at
      t.text :rejection_reason
      t.date :expiry_date
      t.boolean :is_required, default: false
      t.text :notes

      t.timestamps
    end

    add_index :documents, :status
    add_index :documents, :document_type
    add_index :documents, :expiry_date
  end
end
