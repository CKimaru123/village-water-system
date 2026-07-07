class CreateSection2Tables < ActiveRecord::Migration[8.1]
  def change
    # Assets (2.14)
    create_table :assets do |t|
      t.string  :asset_name, null: false
      t.string  :asset_type, null: false
      t.string  :asset_code
      t.string  :status, default: 'active'
      t.string  :location
      t.decimal :gps_latitude,  precision: 10, scale: 8
      t.decimal :gps_longitude, precision: 11, scale: 8
      t.date    :installation_date
      t.date    :last_maintenance_date
      t.date    :next_maintenance_date
      t.text    :notes
      t.integer :created_by_id
      t.timestamps
    end
    add_index :assets, :asset_type
    add_index :assets, :status

    # Maintenance Schedules (2.15)
    create_table :maintenance_schedules do |t|
      t.integer :asset_id, null: false
      t.string  :maintenance_type, null: false
      t.string  :status, default: 'scheduled'
      t.date    :scheduled_date, null: false
      t.date    :completed_date
      t.integer :assigned_to_id
      t.integer :created_by_id
      t.text    :description
      t.text    :completion_notes
      t.decimal :cost, precision: 10, scale: 2
      t.timestamps
    end
    add_index :maintenance_schedules, :asset_id
    add_index :maintenance_schedules, :status
    add_index :maintenance_schedules, :scheduled_date

    # Incidents (2.16)
    create_table :incidents do |t|
      t.string  :title, null: false
      t.text    :description
      t.string  :incident_type, null: false
      t.string  :severity, default: 'medium'
      t.string  :status, default: 'open'
      t.decimal :gps_latitude,  precision: 10, scale: 8
      t.decimal :gps_longitude, precision: 11, scale: 8
      t.string  :location
      t.integer :asset_id
      t.integer :ticket_id
      t.integer :reported_by_id
      t.integer :assigned_to_id
      t.datetime :resolved_at
      t.text    :resolution_notes
      t.timestamps
    end
    add_index :incidents, :status
    add_index :incidents, :incident_type
    add_index :incidents, :severity

    # Deposits (2.6)
    create_table :deposits do |t|
      t.integer :user_id, null: false
      t.integer :connection_id
      t.string  :deposit_type, null: false
      t.decimal :amount, precision: 10, scale: 2, null: false
      t.string  :status, default: 'pending'
      t.string  :payment_reference
      t.integer :recorded_by_id
      t.text    :notes
      t.date    :paid_date
      t.timestamps
    end
    add_index :deposits, :user_id
    add_index :deposits, :status

    # Refunds (2.7)
    create_table :refunds do |t|
      t.integer :user_id, null: false
      t.integer :payment_id
      t.decimal :amount, precision: 10, scale: 2, null: false
      t.string  :reason, null: false
      t.string  :status, default: 'pending'
      t.integer :reviewed_by_id
      t.datetime :reviewed_at
      t.text    :admin_notes
      t.string  :refund_method
      t.string  :reference_number
      t.timestamps
    end
    add_index :refunds, :user_id
    add_index :refunds, :status

    # Reconciliation Records (2.8)
    create_table :reconciliation_records do |t|
      t.integer :payment_id, null: false
      t.integer :invoice_id
      t.string  :status, default: 'matched'
      t.decimal :payment_amount, precision: 10, scale: 2
      t.decimal :invoice_amount, precision: 10, scale: 2
      t.decimal :discrepancy,    precision: 10, scale: 2, default: 0
      t.integer :reconciled_by_id
      t.datetime :reconciled_at
      t.text    :notes
      t.timestamps
    end
    add_index :reconciliation_records, :payment_id
    add_index :reconciliation_records, :status

    # Subsidies (2.10)
    create_table :subsidies do |t|
      t.integer :user_id, null: false
      t.integer :invoice_id
      t.string  :subsidy_type, null: false
      t.decimal :amount,      precision: 10, scale: 2
      t.decimal :percentage,  precision: 5,  scale: 2
      t.string  :status, default: 'pending'
      t.string  :reason
      t.integer :approved_by_id
      t.datetime :approved_at
      t.date    :valid_from
      t.date    :valid_until
      t.text    :notes
      t.timestamps
    end
    add_index :subsidies, :user_id
    add_index :subsidies, :status

    # Dunning Actions (2.5)
    create_table :dunning_actions do |t|
      t.integer :invoice_id, null: false
      t.integer :user_id,    null: false
      t.string  :action_type, null: false
      t.string  :status, default: 'sent'
      t.datetime :sent_at
      t.text    :message
      t.integer :sent_by_id
      t.timestamps
    end
    add_index :dunning_actions, :invoice_id
    add_index :dunning_actions, :user_id

    # Valve Operations (2.18)
    create_table :valve_operations do |t|
      t.string  :valve_name, null: false
      t.string  :zone
      t.string  :operation_type, null: false
      t.string  :status, default: 'open'
      t.datetime :operated_at
      t.datetime :scheduled_reopen_at
      t.integer :operated_by_id
      t.text    :reason
      t.text    :notes
      t.timestamps
    end
    add_index :valve_operations, :zone
    add_index :valve_operations, :status

    # Inventory Items (2.19)
    create_table :inventory_items do |t|
      t.string  :item_name, null: false
      t.string  :item_code
      t.string  :category
      t.integer :quantity_in_stock, default: 0
      t.integer :reorder_level,     default: 0
      t.string  :unit
      t.decimal :unit_cost, precision: 10, scale: 2
      t.string  :supplier
      t.text    :notes
      t.integer :created_by_id
      t.timestamps
    end
    add_index :inventory_items, :category
    add_index :inventory_items, :item_code

    # Inventory Transactions
    create_table :inventory_transactions do |t|
      t.integer :inventory_item_id, null: false
      t.string  :transaction_type, null: false
      t.integer :quantity, null: false
      t.integer :recorded_by_id
      t.text    :notes
      t.timestamps
    end
    add_index :inventory_transactions, :inventory_item_id

    # Energy Records (2.20)
    create_table :energy_records do |t|
      t.integer :asset_id
      t.string  :energy_type, null: false
      t.decimal :quantity,    precision: 10, scale: 2, null: false
      t.string  :unit
      t.decimal :cost,        precision: 10, scale: 2
      t.date    :record_date, null: false
      t.integer :recorded_by_id
      t.text    :notes
      t.timestamps
    end
    add_index :energy_records, :record_date
    add_index :energy_records, :energy_type

    # SCADA Readings (2.21)
    create_table :scada_readings do |t|
      t.integer :connection_id
      t.string  :sensor_type, null: false
      t.decimal :value,       precision: 10, scale: 4, null: false
      t.string  :unit
      t.datetime :recorded_at, null: false
      t.string  :status, default: 'normal'
      t.timestamps
    end
    add_index :scada_readings, :recorded_at
    add_index :scada_readings, :sensor_type

    # Contractors (2.30)
    create_table :contractors do |t|
      t.string  :name, null: false
      t.string  :company_name
      t.string  :phone
      t.string  :email
      t.string  :specialization
      t.string  :status, default: 'active'
      t.text    :notes
      t.integer :created_by_id
      t.timestamps
    end
    add_index :contractors, :status

    # Procurement Orders (2.31)
    create_table :procurement_orders do |t|
      t.string  :order_number
      t.string  :supplier_name, null: false
      t.string  :status, default: 'draft'
      t.decimal :total_amount, precision: 10, scale: 2
      t.date    :order_date
      t.date    :expected_delivery
      t.integer :approved_by_id
      t.datetime :approved_at
      t.integer :created_by_id
      t.text    :notes
      t.timestamps
    end
    add_index :procurement_orders, :status

    # Grants / Donors (2.32)
    create_table :grants do |t|
      t.string  :title, null: false
      t.string  :donor_name, null: false
      t.decimal :amount,     precision: 12, scale: 2
      t.string  :status, default: 'active'
      t.date    :start_date
      t.date    :end_date
      t.integer :project_id
      t.text    :description
      t.integer :created_by_id
      t.timestamps
    end
    add_index :grants, :status

    # Canned Responses (2.36)
    create_table :canned_responses do |t|
      t.string  :title, null: false
      t.text    :body,  null: false
      t.string  :category
      t.boolean :active, default: true
      t.integer :created_by_id
      t.timestamps
    end
    add_index :canned_responses, :category

    # Volunteers (2.37)
    create_table :volunteers do |t|
      t.integer :user_id
      t.string  :name, null: false
      t.string  :phone
      t.string  :email
      t.string  :skills
      t.string  :status, default: 'active'
      t.integer :created_by_id
      t.timestamps
    end
    add_index :volunteers, :status

    # Collaboration Tasks (2.28)
    create_table :collaboration_tasks do |t|
      t.string  :title, null: false
      t.text    :description
      t.string  :status, default: 'open'
      t.string  :priority, default: 'normal'
      t.integer :assigned_to_id
      t.integer :created_by_id
      t.date    :due_date
      t.timestamps
    end
    add_index :collaboration_tasks, :status

    # Audit Logs (2.39)
    create_table :audit_logs do |t|
      t.integer :user_id
      t.string  :action, null: false
      t.string  :resource_type
      t.integer :resource_id
      t.text    :details
      t.string  :ip_address
      t.datetime :performed_at, null: false
      t.timestamps
    end
    add_index :audit_logs, :user_id
    add_index :audit_logs, :action
    add_index :audit_logs, :performed_at
    add_index :audit_logs, [:resource_type, :resource_id]

    # Anomaly Detections (2.50)
    create_table :anomaly_detections do |t|
      t.integer :connection_id
      t.integer :user_id
      t.string  :anomaly_type, null: false
      t.string  :severity, default: 'medium'
      t.text    :description
      t.decimal :detected_value, precision: 10, scale: 3
      t.decimal :expected_value, precision: 10, scale: 3
      t.string  :status, default: 'open'
      t.datetime :detected_at, null: false
      t.datetime :resolved_at
      t.timestamps
    end
    add_index :anomaly_detections, :status
    add_index :anomaly_detections, :anomaly_type
    add_index :anomaly_detections, :detected_at
  end
end
