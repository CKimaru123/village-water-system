class CreateClientProfileAuditLogs < ActiveRecord::Migration[7.0]
  def change
    create_table :client_profile_audit_logs do |t|
      t.references :client, null: false, foreign_key: { to_table: :users }
      t.references :modified_by, null: false, foreign_key: { to_table: :users }
      t.string :field_name, null: false
      t.text :old_value
      t.text :new_value
      t.string :change_type, null: false # 'update', 'create', 'delete'
      t.text :reason
      t.string :change_category # 'contact_info', 'identity', 'service', 'security'
      t.string :sensitivity_level # 'low', 'medium', 'high'
      t.boolean :client_notified, default: false
      t.datetime :client_notified_at
      t.string :notification_method # 'email', 'sms', 'both'
      t.boolean :requires_approval, default: false
      t.string :approval_status # 'pending', 'approved', 'rejected'
      t.references :approved_by, null: true, foreign_key: { to_table: :users }
      t.datetime :approved_at
      t.text :approval_notes
      t.string :ip_address
      t.text :user_agent
      t.json :additional_metadata

      t.timestamps
    end
  end
end