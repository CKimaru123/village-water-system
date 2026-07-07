class CreateChatMessages < ActiveRecord::Migration[8.1]
  def change
    create_table :chat_messages do |t|
      t.references :user,    null: false, foreign_key: true
      t.string     :session_id, null: false
      t.text       :message,    null: false
      t.string     :sender_role, null: false  # 'client' or 'admin'
      t.boolean    :read,        default: false
      t.timestamps
    end

    add_index :chat_messages, :session_id
    add_index :chat_messages, :created_at
  end
end
