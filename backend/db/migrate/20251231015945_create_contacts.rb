class CreateContacts < ActiveRecord::Migration[8.1]
  def change
    create_table :contacts do |t|
      t.string :name, null: false
      t.string :email, null: false
      t.string :phone
      t.string :subject, null: false
      t.text :message, null: false
      t.string :status, default: 'pending'
      t.string :ip_address
      t.text :user_agent

      t.timestamps
    end

    add_index :contacts, :email
    add_index :contacts, :status
    add_index :contacts, :created_at
  end
end
