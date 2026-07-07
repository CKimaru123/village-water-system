class CreateVoiceSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :voice_sessions do |t|
      t.integer  :user_id
      t.string   :session_token,    null: false
      t.string   :language,         default: 'en'   # en, sw, local
      t.string   :channel,          default: 'web'  # web, ivr, mobile
      t.string   :status,           default: 'active'  # active, completed, failed
      t.text     :transcript        # JSON array of {role, text, timestamp}
      t.string   :intent_detected   # last detected intent
      t.string   :caller_number     # for IVR sessions
      t.integer  :duration_seconds
      t.string   :outcome           # resolved, escalated, abandoned
      t.integer  :ticket_id         # if escalated to ticket
      t.datetime :started_at
      t.datetime :ended_at
      t.timestamps
    end

    add_index :voice_sessions, :session_token, unique: true
    add_index :voice_sessions, :user_id
    add_index :voice_sessions, :status
    add_index :voice_sessions, :channel
    add_index :voice_sessions, :started_at
  end
end
