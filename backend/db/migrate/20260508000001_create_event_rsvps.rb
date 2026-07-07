class CreateEventRsvps < ActiveRecord::Migration[8.1]
  def change
    create_table :event_rsvps do |t|
      t.references :event, null: false, foreign_key: true
      t.references :user,  null: false, foreign_key: true
      t.string  :status,   null: false, default: 'attending'  # attending | not_attending | sending_someone
      t.string  :delegate_name   # if sending someone else
      t.string  :delegate_contact
      t.boolean :receipt_confirmed, default: false
      t.timestamps
    end
    add_index :event_rsvps, [:event_id, :user_id], unique: true
  end
end
