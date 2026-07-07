class CreateTicketUpdates < ActiveRecord::Migration[8.1]
  def change
    create_table :ticket_updates do |t|
      t.integer :ticket_id
      t.integer :user_id
      t.text :message
      t.boolean :is_internal

      t.timestamps
    end
  end
end
