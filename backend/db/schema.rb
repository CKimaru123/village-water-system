# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_06_10_000001) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "announcements", force: :cascade do |t|
    t.string "category"
    t.text "content"
    t.datetime "created_at", null: false
    t.integer "created_by_id"
    t.datetime "expires_at"
    t.string "priority"
    t.boolean "published"
    t.datetime "published_at"
    t.string "target_audience"
    t.string "title"
    t.datetime "updated_at", null: false
  end

  create_table "anomaly_detections", force: :cascade do |t|
    t.string "affected_zone"
    t.string "anomaly_type", null: false
    t.integer "connection_id"
    t.datetime "created_at", null: false
    t.text "description"
    t.datetime "detected_at", null: false
    t.decimal "detected_value", precision: 10, scale: 3
    t.decimal "expected_value", precision: 10, scale: 3
    t.integer "incident_id"
    t.text "resolution_notes"
    t.datetime "resolved_at"
    t.integer "resolved_by_id"
    t.string "severity", default: "medium"
    t.string "status", default: "open"
    t.datetime "updated_at", null: false
    t.integer "user_id"
    t.index ["affected_zone"], name: "index_anomaly_detections_on_affected_zone"
    t.index ["anomaly_type"], name: "index_anomaly_detections_on_anomaly_type"
    t.index ["detected_at"], name: "index_anomaly_detections_on_detected_at"
    t.index ["resolved_by_id"], name: "index_anomaly_detections_on_resolved_by_id"
    t.index ["status"], name: "index_anomaly_detections_on_status"
  end

  create_table "appeals", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "original_action_id"
    t.string "priority", default: "normal"
    t.text "reason", null: false
    t.text "resolution"
    t.datetime "reviewed_at"
    t.integer "reviewed_by_id"
    t.string "status", default: "pending"
    t.text "supporting_documents"
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["original_action_id"], name: "index_appeals_on_original_action_id"
    t.index ["priority"], name: "index_appeals_on_priority"
    t.index ["reviewed_by_id"], name: "index_appeals_on_reviewed_by_id"
    t.index ["status", "created_at"], name: "index_appeals_on_status_and_created_at"
    t.index ["user_id", "status"], name: "index_appeals_on_user_id_and_status"
    t.index ["user_id"], name: "index_appeals_on_user_id"
  end

  create_table "assets", force: :cascade do |t|
    t.string "asset_code"
    t.string "asset_name", null: false
    t.string "asset_type", null: false
    t.datetime "created_at", null: false
    t.integer "created_by_id"
    t.decimal "gps_latitude", precision: 10, scale: 8
    t.decimal "gps_longitude", precision: 11, scale: 8
    t.date "installation_date"
    t.date "last_maintenance_date"
    t.string "location"
    t.date "next_maintenance_date"
    t.text "notes"
    t.string "status", default: "active"
    t.datetime "updated_at", null: false
    t.index ["asset_type"], name: "index_assets_on_asset_type"
    t.index ["status"], name: "index_assets_on_status"
  end

  create_table "audit_logs", force: :cascade do |t|
    t.string "action", null: false
    t.datetime "created_at", null: false
    t.text "details"
    t.string "ip_address"
    t.datetime "performed_at", null: false
    t.integer "resource_id"
    t.string "resource_type"
    t.datetime "updated_at", null: false
    t.integer "user_id"
    t.index ["action"], name: "index_audit_logs_on_action"
    t.index ["performed_at"], name: "index_audit_logs_on_performed_at"
    t.index ["resource_type", "resource_id"], name: "index_audit_logs_on_resource_type_and_resource_id"
    t.index ["user_id"], name: "index_audit_logs_on_user_id"
  end

  create_table "billing_configs", force: :cascade do |t|
    t.string "billing_mode", default: "usage_based", null: false
    t.datetime "created_at", null: false
    t.integer "created_by_id"
    t.date "effective_from", default: -> { "CURRENT_DATE" }, null: false
    t.decimal "fixed_amount", precision: 10, scale: 2
    t.integer "tariff_id"
    t.datetime "updated_at", null: false
    t.integer "user_id"
    t.index ["billing_mode"], name: "index_billing_configs_on_billing_mode"
    t.index ["user_id"], name: "index_billing_configs_on_user_id"
  end

  create_table "blockchain_records", force: :cascade do |t|
    t.decimal "amount", precision: 12, scale: 2
    t.string "block_hash"
    t.integer "block_number"
    t.datetime "confirmed_at"
    t.datetime "created_at", null: false
    t.integer "created_by_id"
    t.string "currency", default: "KES"
    t.integer "gas_used"
    t.text "metadata"
    t.string "network", default: "private"
    t.string "record_type", null: false
    t.integer "reference_id"
    t.string "reference_type"
    t.string "smart_contract_address"
    t.string "status", default: "confirmed"
    t.string "transaction_hash", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_blockchain_records_on_created_at"
    t.index ["record_type"], name: "index_blockchain_records_on_record_type"
    t.index ["reference_type", "reference_id"], name: "index_blockchain_records_on_reference_type_and_reference_id"
    t.index ["status"], name: "index_blockchain_records_on_status"
    t.index ["transaction_hash"], name: "index_blockchain_records_on_transaction_hash", unique: true
  end

  create_table "blog_posts", force: :cascade do |t|
    t.string "author_email"
    t.string "author_name", null: false
    t.string "category_id", null: false
    t.integer "comments_count", default: 0
    t.text "content", null: false
    t.datetime "created_at", null: false
    t.integer "created_by_id", null: false
    t.text "excerpt", null: false
    t.boolean "featured", default: false
    t.string "image_url", null: false
    t.integer "likes_count", default: 0
    t.text "meta_description"
    t.boolean "published", default: false
    t.datetime "published_at"
    t.integer "read_time", default: 5
    t.string "slug", null: false
    t.text "tags"
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.integer "updated_by_id"
    t.integer "views_count", default: 0
    t.index ["category_id"], name: "index_blog_posts_on_category_id"
    t.index ["created_at"], name: "index_blog_posts_on_created_at"
    t.index ["created_by_id"], name: "index_blog_posts_on_created_by_id"
    t.index ["featured"], name: "index_blog_posts_on_featured"
    t.index ["likes_count"], name: "index_blog_posts_on_likes_count"
    t.index ["published"], name: "index_blog_posts_on_published"
    t.index ["published_at"], name: "index_blog_posts_on_published_at"
    t.index ["slug"], name: "index_blog_posts_on_slug", unique: true
    t.index ["updated_by_id"], name: "index_blog_posts_on_updated_by_id"
    t.index ["views_count"], name: "index_blog_posts_on_views_count"
  end

  create_table "canned_responses", force: :cascade do |t|
    t.boolean "active", default: true
    t.text "body", null: false
    t.string "category"
    t.datetime "created_at", null: false
    t.integer "created_by_id"
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["category"], name: "index_canned_responses_on_category"
  end

  create_table "chat_messages", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "message", null: false
    t.boolean "read", default: false
    t.string "sender_role", null: false
    t.string "session_id", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["created_at"], name: "index_chat_messages_on_created_at"
    t.index ["session_id"], name: "index_chat_messages_on_session_id"
    t.index ["user_id"], name: "index_chat_messages_on_user_id"
  end

  create_table "client_profile_audit_logs", force: :cascade do |t|
    t.json "additional_metadata"
    t.text "approval_notes"
    t.string "approval_status"
    t.datetime "approved_at"
    t.integer "approved_by_id"
    t.string "change_category"
    t.string "change_type", null: false
    t.integer "client_id", null: false
    t.boolean "client_notified", default: false
    t.datetime "client_notified_at"
    t.datetime "created_at", null: false
    t.string "field_name", null: false
    t.string "ip_address"
    t.integer "modified_by_id", null: false
    t.text "new_value"
    t.string "notification_method"
    t.text "old_value"
    t.text "reason"
    t.boolean "requires_approval", default: false
    t.string "sensitivity_level"
    t.datetime "updated_at", null: false
    t.text "user_agent"
    t.index ["approved_by_id"], name: "index_client_profile_audit_logs_on_approved_by_id"
    t.index ["client_id"], name: "index_client_profile_audit_logs_on_client_id"
    t.index ["modified_by_id"], name: "index_client_profile_audit_logs_on_modified_by_id"
  end

  create_table "collaboration_tasks", force: :cascade do |t|
    t.integer "assigned_to_id"
    t.datetime "created_at", null: false
    t.integer "created_by_id"
    t.text "description"
    t.date "due_date"
    t.string "priority", default: "normal"
    t.string "status", default: "open"
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["status"], name: "index_collaboration_tasks_on_status"
  end

  create_table "community_tasks", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "created_by_id"
    t.text "description"
    t.date "due_date"
    t.string "priority", default: "normal"
    t.string "status", default: "open"
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.string "zone"
    t.index ["status"], name: "index_community_tasks_on_status"
  end

  create_table "connections", force: :cascade do |t|
    t.string "account_number"
    t.date "connection_date", null: false
    t.string "connection_number", null: false
    t.string "connection_status", default: "active", null: false
    t.string "connection_type", default: "new", null: false
    t.datetime "created_at", null: false
    t.decimal "gps_latitude", precision: 10, scale: 8
    t.decimal "gps_longitude", precision: 11, scale: 8
    t.text "installation_notes"
    t.date "meter_installation_date"
    t.string "meter_number", null: false
    t.string "meter_status", default: "functioning"
    t.string "meter_type", default: "smart_digital"
    t.decimal "pipe_diameter", precision: 5, scale: 2
    t.string "service_line_size"
    t.string "supply_schedule", default: "24/7"
    t.datetime "updated_at", null: false
    t.string "usage_zones"
    t.integer "user_id", null: false
    t.decimal "water_pressure", precision: 5, scale: 2
    t.string "zone"
    t.index ["account_number"], name: "index_connections_on_account_number", unique: true
    t.index ["connection_number"], name: "index_connections_on_connection_number", unique: true
    t.index ["connection_status"], name: "index_connections_on_connection_status"
    t.index ["meter_number"], name: "index_connections_on_meter_number", unique: true
    t.index ["meter_status"], name: "index_connections_on_meter_status"
    t.index ["user_id"], name: "index_connections_on_user_id"
    t.index ["zone"], name: "index_connections_on_zone"
  end

  create_table "contacts", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.string "ip_address"
    t.text "message", null: false
    t.string "name", null: false
    t.string "phone"
    t.string "status", default: "pending"
    t.string "subject", null: false
    t.datetime "updated_at", null: false
    t.text "user_agent"
    t.index ["created_at"], name: "index_contacts_on_created_at"
    t.index ["email"], name: "index_contacts_on_email"
    t.index ["status"], name: "index_contacts_on_status"
  end

  create_table "contractors", force: :cascade do |t|
    t.string "company_name"
    t.datetime "created_at", null: false
    t.integer "created_by_id"
    t.string "email"
    t.string "name", null: false
    t.text "notes"
    t.string "phone"
    t.string "specialization"
    t.string "status", default: "active"
    t.datetime "updated_at", null: false
    t.index ["status"], name: "index_contractors_on_status"
  end

  create_table "deposits", force: :cascade do |t|
    t.decimal "amount", precision: 10, scale: 2, null: false
    t.integer "connection_id"
    t.datetime "created_at", null: false
    t.string "deposit_type", null: false
    t.text "notes"
    t.date "paid_date"
    t.string "payment_reference"
    t.integer "recorded_by_id"
    t.string "status", default: "pending"
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["status"], name: "index_deposits_on_status"
    t.index ["user_id"], name: "index_deposits_on_user_id"
  end

  create_table "documents", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "document_number"
    t.string "document_type", null: false
    t.date "expiry_date"
    t.string "file_format"
    t.string "file_name", null: false
    t.string "file_path", null: false
    t.bigint "file_size", null: false
    t.boolean "is_required", default: false
    t.text "notes"
    t.text "rejection_reason"
    t.string "status", default: "unverified", null: false
    t.datetime "updated_at", null: false
    t.datetime "uploaded_at", default: -> { "CURRENT_TIMESTAMP" }
    t.integer "user_id", null: false
    t.datetime "verified_at"
    t.integer "verified_by_id"
    t.index ["document_type"], name: "index_documents_on_document_type"
    t.index ["expiry_date"], name: "index_documents_on_expiry_date"
    t.index ["status"], name: "index_documents_on_status"
    t.index ["user_id"], name: "index_documents_on_user_id"
    t.index ["verified_by_id"], name: "index_documents_on_verified_by_id"
  end

  create_table "dunning_actions", force: :cascade do |t|
    t.string "action_type", null: false
    t.datetime "created_at", null: false
    t.integer "invoice_id", null: false
    t.text "message"
    t.datetime "sent_at"
    t.integer "sent_by_id"
    t.string "status", default: "sent"
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["invoice_id"], name: "index_dunning_actions_on_invoice_id"
    t.index ["user_id"], name: "index_dunning_actions_on_user_id"
  end

  create_table "energy_records", force: :cascade do |t|
    t.integer "asset_id"
    t.decimal "cost", precision: 10, scale: 2
    t.datetime "created_at", null: false
    t.string "energy_type", null: false
    t.text "notes"
    t.decimal "quantity", precision: 10, scale: 2, null: false
    t.date "record_date", null: false
    t.integer "recorded_by_id"
    t.string "unit"
    t.datetime "updated_at", null: false
    t.index ["energy_type"], name: "index_energy_records_on_energy_type"
    t.index ["record_date"], name: "index_energy_records_on_record_date"
  end

  create_table "event_rsvps", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "delegate_contact"
    t.string "delegate_name"
    t.integer "event_id", null: false
    t.boolean "receipt_confirmed", default: false
    t.string "status", default: "attending", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["event_id", "user_id"], name: "index_event_rsvps_on_event_id_and_user_id", unique: true
    t.index ["event_id"], name: "index_event_rsvps_on_event_id"
    t.index ["user_id"], name: "index_event_rsvps_on_user_id"
  end

  create_table "events", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "created_by_id"
    t.text "description"
    t.datetime "event_date"
    t.string "event_type"
    t.string "location"
    t.integer "max_attendees"
    t.string "status"
    t.string "title"
    t.datetime "updated_at", null: false
  end

  create_table "gallery_items", force: :cascade do |t|
    t.boolean "active", default: true
    t.string "category"
    t.datetime "created_at", null: false
    t.integer "created_by_id", null: false
    t.text "description"
    t.boolean "featured", default: false
    t.string "large_image_url", null: false
    t.string "small_image_url", null: false
    t.integer "sort_order", default: 0
    t.text "tags"
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.integer "updated_by_id"
    t.index ["active"], name: "index_gallery_items_on_active"
    t.index ["category"], name: "index_gallery_items_on_category"
    t.index ["created_at"], name: "index_gallery_items_on_created_at"
    t.index ["created_by_id"], name: "index_gallery_items_on_created_by_id"
    t.index ["featured"], name: "index_gallery_items_on_featured"
    t.index ["sort_order"], name: "index_gallery_items_on_sort_order"
    t.index ["updated_by_id"], name: "index_gallery_items_on_updated_by_id"
  end

  create_table "grants", force: :cascade do |t|
    t.decimal "amount", precision: 12, scale: 2
    t.datetime "created_at", null: false
    t.integer "created_by_id"
    t.text "description"
    t.string "donor_name", null: false
    t.date "end_date"
    t.integer "project_id"
    t.date "start_date"
    t.string "status", default: "active"
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["status"], name: "index_grants_on_status"
  end

  create_table "incidents", force: :cascade do |t|
    t.integer "asset_id"
    t.integer "assigned_to_id"
    t.datetime "created_at", null: false
    t.text "description"
    t.decimal "gps_latitude", precision: 10, scale: 8
    t.decimal "gps_longitude", precision: 11, scale: 8
    t.string "incident_type", null: false
    t.string "location"
    t.integer "reported_by_id"
    t.text "resolution_notes"
    t.datetime "resolved_at"
    t.string "severity", default: "medium"
    t.string "status", default: "open"
    t.integer "ticket_id"
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["incident_type"], name: "index_incidents_on_incident_type"
    t.index ["severity"], name: "index_incidents_on_severity"
    t.index ["status"], name: "index_incidents_on_status"
  end

  create_table "inventory_items", force: :cascade do |t|
    t.string "category"
    t.datetime "created_at", null: false
    t.integer "created_by_id"
    t.string "item_code"
    t.string "item_name", null: false
    t.text "notes"
    t.integer "quantity_in_stock", default: 0
    t.integer "reorder_level", default: 0
    t.string "supplier"
    t.string "unit"
    t.decimal "unit_cost", precision: 10, scale: 2
    t.datetime "updated_at", null: false
    t.index ["category"], name: "index_inventory_items_on_category"
    t.index ["item_code"], name: "index_inventory_items_on_item_code"
  end

  create_table "inventory_transactions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "inventory_item_id", null: false
    t.text "notes"
    t.integer "quantity", null: false
    t.integer "recorded_by_id"
    t.string "transaction_type", null: false
    t.datetime "updated_at", null: false
    t.index ["inventory_item_id"], name: "index_inventory_transactions_on_inventory_item_id"
  end

  create_table "invoice_line_items", force: :cascade do |t|
    t.decimal "amount", precision: 10, scale: 2, null: false
    t.datetime "created_at", null: false
    t.string "description", null: false
    t.integer "invoice_id", null: false
    t.string "item_type", null: false
    t.decimal "quantity", precision: 10, scale: 3
    t.decimal "unit_rate", precision: 10, scale: 2
    t.datetime "updated_at", null: false
    t.index ["invoice_id"], name: "index_invoice_line_items_on_invoice_id"
    t.index ["item_type"], name: "index_invoice_line_items_on_item_type"
  end

  create_table "invoices", force: :cascade do |t|
    t.string "billing_mode"
    t.date "billing_period_end", null: false
    t.date "billing_period_start", null: false
    t.decimal "consumption_m3", precision: 10, scale: 3
    t.datetime "created_at", null: false
    t.date "due_date", null: false
    t.string "field_officer_name"
    t.datetime "generated_at", default: -> { "CURRENT_TIMESTAMP" }
    t.integer "generated_by_id", null: false
    t.string "invoice_number", null: false
    t.boolean "is_estimated", default: false, null: false
    t.decimal "meter_reading_current", precision: 10, scale: 3
    t.decimal "meter_reading_previous", precision: 10, scale: 3
    t.datetime "paid_at"
    t.string "reading_source"
    t.string "status", default: "draft", null: false
    t.decimal "subtotal", precision: 10, scale: 2, null: false
    t.decimal "tax_amount", precision: 10, scale: 2, default: "0.0"
    t.decimal "total_amount", precision: 10, scale: 2, null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["billing_mode"], name: "index_invoices_on_billing_mode"
    t.index ["billing_period_end"], name: "index_invoices_on_billing_period_end"
    t.index ["billing_period_start"], name: "index_invoices_on_billing_period_start"
    t.index ["due_date"], name: "index_invoices_on_due_date"
    t.index ["generated_by_id"], name: "index_invoices_on_generated_by_id"
    t.index ["invoice_number"], name: "index_invoices_on_invoice_number", unique: true
    t.index ["status"], name: "index_invoices_on_status"
    t.index ["user_id"], name: "index_invoices_on_user_id"
  end

  create_table "knowledge_base_articles", force: :cascade do |t|
    t.string "category"
    t.text "content"
    t.datetime "created_at", null: false
    t.integer "created_by_id"
    t.text "excerpt"
    t.boolean "published", default: false
    t.text "tags"
    t.string "title"
    t.datetime "updated_at", null: false
    t.integer "views_count", default: 0
  end

  create_table "maintenance_schedules", force: :cascade do |t|
    t.integer "asset_id", null: false
    t.integer "assigned_to_id"
    t.date "completed_date"
    t.text "completion_notes"
    t.decimal "cost", precision: 10, scale: 2
    t.datetime "created_at", null: false
    t.integer "created_by_id"
    t.text "description"
    t.string "maintenance_type", null: false
    t.date "scheduled_date", null: false
    t.string "status", default: "scheduled"
    t.datetime "updated_at", null: false
    t.index ["asset_id"], name: "index_maintenance_schedules_on_asset_id"
    t.index ["scheduled_date"], name: "index_maintenance_schedules_on_scheduled_date"
    t.index ["status"], name: "index_maintenance_schedules_on_status"
  end

  create_table "marketplace_items", force: :cascade do |t|
    t.boolean "active", default: true
    t.string "category", null: false
    t.datetime "created_at", null: false
    t.integer "created_by_id", null: false
    t.text "description", null: false
    t.boolean "featured", default: false
    t.text "images", null: false
    t.boolean "in_stock", default: true
    t.string "location", null: false
    t.decimal "price", precision: 10, scale: 2, null: false
    t.decimal "rating", precision: 3, scale: 2, default: "0.0"
    t.integer "reviews_count", default: 0
    t.string "seller_email", null: false
    t.string "seller_name", null: false
    t.string "seller_phone", null: false
    t.integer "seller_user_id"
    t.text "specifications"
    t.text "tags"
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.integer "updated_by_id"
    t.integer "views_count", default: 0
    t.index ["active"], name: "index_marketplace_items_on_active"
    t.index ["category"], name: "index_marketplace_items_on_category"
    t.index ["created_at"], name: "index_marketplace_items_on_created_at"
    t.index ["created_by_id"], name: "index_marketplace_items_on_created_by_id"
    t.index ["featured"], name: "index_marketplace_items_on_featured"
    t.index ["in_stock"], name: "index_marketplace_items_on_in_stock"
    t.index ["location"], name: "index_marketplace_items_on_location"
    t.index ["price"], name: "index_marketplace_items_on_price"
    t.index ["rating"], name: "index_marketplace_items_on_rating"
    t.index ["seller_name"], name: "index_marketplace_items_on_seller_name"
    t.index ["seller_user_id"], name: "index_marketplace_items_on_seller_user_id"
    t.index ["updated_by_id"], name: "index_marketplace_items_on_updated_by_id"
  end

  create_table "meter_readings", force: :cascade do |t|
    t.integer "connection_id", null: false
    t.datetime "created_at", null: false
    t.text "notes"
    t.date "reading_date", null: false
    t.string "reading_type", default: "manual"
    t.decimal "reading_value", precision: 10, scale: 2, null: false
    t.integer "recorded_by_id"
    t.datetime "updated_at", null: false
    t.index ["connection_id", "reading_date"], name: "index_meter_readings_on_connection_id_and_reading_date", unique: true
    t.index ["connection_id"], name: "index_meter_readings_on_connection_id"
    t.index ["reading_date"], name: "index_meter_readings_on_reading_date"
    t.index ["recorded_by_id"], name: "index_meter_readings_on_recorded_by_id"
  end

  create_table "meters", force: :cascade do |t|
    t.date "calibration_date"
    t.integer "connection_id", null: false
    t.datetime "created_at", null: false
    t.date "installation_date", null: false
    t.date "last_reading_date"
    t.decimal "last_reading_value", precision: 10, scale: 3
    t.string "meter_serial", null: false
    t.string "meter_size"
    t.string "meter_status", default: "active", null: false
    t.string "meter_type", default: "mechanical", null: false
    t.date "next_calibration_date"
    t.datetime "updated_at", null: false
    t.index ["connection_id"], name: "index_meters_on_connection_id"
    t.index ["last_reading_date"], name: "index_meters_on_last_reading_date"
    t.index ["meter_serial"], name: "index_meters_on_meter_serial", unique: true
    t.index ["meter_status"], name: "index_meters_on_meter_status"
  end

  create_table "notifications", force: :cascade do |t|
    t.string "action_url"
    t.string "category", default: "general"
    t.datetime "created_at", null: false
    t.datetime "expires_at"
    t.text "message", null: false
    t.json "metadata", default: {}
    t.string "notification_type", null: false
    t.string "priority", default: "normal"
    t.boolean "read", default: false
    t.datetime "read_at"
    t.integer "related_user_id"
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["category"], name: "index_notifications_on_category"
    t.index ["notification_type"], name: "index_notifications_on_notification_type"
    t.index ["related_user_id"], name: "index_notifications_on_related_user_id"
    t.index ["user_id", "created_at"], name: "index_notifications_on_user_id_and_created_at"
    t.index ["user_id", "read"], name: "index_notifications_on_user_id_and_read"
    t.index ["user_id"], name: "index_notifications_on_user_id"
  end

  create_table "payment_plans", force: :cascade do |t|
    t.datetime "approved_at"
    t.integer "approved_by_id"
    t.datetime "created_at", null: false
    t.decimal "installment_amount", precision: 10, scale: 2, null: false
    t.integer "installments_count", default: 3, null: false
    t.integer "installments_paid", default: 0, null: false
    t.integer "invoice_id", null: false
    t.date "next_due_date"
    t.text "notes"
    t.string "status", default: "active", null: false
    t.decimal "total_amount", precision: 10, scale: 2, null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["invoice_id"], name: "index_payment_plans_on_invoice_id"
    t.index ["user_id"], name: "index_payment_plans_on_user_id"
  end

  create_table "payments", force: :cascade do |t|
    t.decimal "amount"
    t.datetime "created_at", null: false
    t.integer "invoice_id"
    t.text "notes"
    t.datetime "payment_date"
    t.string "payment_method"
    t.string "status"
    t.string "transaction_reference"
    t.datetime "updated_at", null: false
    t.integer "user_id"
  end

  create_table "pending_payments", force: :cascade do |t|
    t.decimal "amount", precision: 10, scale: 2, null: false
    t.string "checkout_request_id"
    t.datetime "created_at", null: false
    t.integer "initiated_by_id"
    t.integer "invoice_id"
    t.integer "payment_id"
    t.string "payment_method", null: false
    t.string "status", default: "pending"
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["checkout_request_id"], name: "index_pending_payments_on_checkout_request_id"
    t.index ["invoice_id"], name: "index_pending_payments_on_invoice_id"
    t.index ["status"], name: "index_pending_payments_on_status"
    t.index ["user_id"], name: "index_pending_payments_on_user_id"
  end

  create_table "poll_options", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "option_text"
    t.integer "poll_id"
    t.datetime "updated_at", null: false
    t.integer "votes_count"
  end

  create_table "poll_votes", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "poll_id"
    t.integer "poll_option_id"
    t.datetime "updated_at", null: false
    t.integer "user_id"
  end

  create_table "polls", force: :cascade do |t|
    t.string "category"
    t.datetime "closes_at"
    t.datetime "created_at", null: false
    t.integer "created_by_id"
    t.text "description"
    t.string "status"
    t.string "title"
    t.datetime "updated_at", null: false
  end

  create_table "procurement_orders", force: :cascade do |t|
    t.datetime "approved_at"
    t.integer "approved_by_id"
    t.datetime "created_at", null: false
    t.integer "created_by_id"
    t.date "expected_delivery"
    t.text "notes"
    t.date "order_date"
    t.string "order_number"
    t.string "status", default: "draft"
    t.string "supplier_name", null: false
    t.decimal "total_amount", precision: 10, scale: 2
    t.datetime "updated_at", null: false
    t.index ["status"], name: "index_procurement_orders_on_status"
  end

  create_table "profile_history", force: :cascade do |t|
    t.datetime "changed_at", default: -> { "CURRENT_TIMESTAMP" }
    t.integer "changed_by_id"
    t.datetime "created_at", null: false
    t.string "field_name", null: false
    t.text "new_value"
    t.text "old_value"
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["changed_at"], name: "index_profile_history_on_changed_at"
    t.index ["changed_by_id"], name: "index_profile_history_on_changed_by_id"
    t.index ["field_name"], name: "index_profile_history_on_field_name"
    t.index ["user_id"], name: "index_profile_history_on_user_id"
  end

  create_table "projects", force: :cascade do |t|
    t.decimal "budget"
    t.datetime "created_at", null: false
    t.integer "created_by_id"
    t.text "description"
    t.date "end_date"
    t.decimal "gps_latitude"
    t.decimal "gps_longitude"
    t.string "location"
    t.string "project_type"
    t.date "start_date"
    t.string "status"
    t.string "title"
    t.datetime "updated_at", null: false
  end

  create_table "reading_schedules", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.integer "created_by_id"
    t.string "daily_time"
    t.integer "interval_value"
    t.integer "meter_id"
    t.string "schedule_type", default: "end_of_month", null: false
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_reading_schedules_on_active"
    t.index ["meter_id"], name: "index_reading_schedules_on_meter_id"
    t.index ["schedule_type"], name: "index_reading_schedules_on_schedule_type"
  end

  create_table "reconciliation_records", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.decimal "discrepancy", precision: 10, scale: 2, default: "0.0"
    t.decimal "invoice_amount", precision: 10, scale: 2
    t.integer "invoice_id"
    t.text "notes"
    t.decimal "payment_amount", precision: 10, scale: 2
    t.integer "payment_id", null: false
    t.datetime "reconciled_at"
    t.integer "reconciled_by_id"
    t.string "status", default: "matched"
    t.datetime "updated_at", null: false
    t.index ["payment_id"], name: "index_reconciliation_records_on_payment_id"
    t.index ["status"], name: "index_reconciliation_records_on_status"
  end

  create_table "refunds", force: :cascade do |t|
    t.text "admin_notes"
    t.decimal "amount", precision: 10, scale: 2, null: false
    t.datetime "created_at", null: false
    t.integer "payment_id"
    t.string "reason", null: false
    t.string "reference_number"
    t.string "refund_method"
    t.datetime "reviewed_at"
    t.integer "reviewed_by_id"
    t.string "status", default: "pending"
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["status"], name: "index_refunds_on_status"
    t.index ["user_id"], name: "index_refunds_on_user_id"
  end

  create_table "scada_readings", force: :cascade do |t|
    t.integer "connection_id"
    t.datetime "created_at", null: false
    t.datetime "recorded_at", null: false
    t.string "sensor_type", null: false
    t.string "status", default: "normal"
    t.string "unit"
    t.datetime "updated_at", null: false
    t.decimal "value", precision: 10, scale: 4, null: false
    t.index ["recorded_at"], name: "index_scada_readings_on_recorded_at"
    t.index ["sensor_type"], name: "index_scada_readings_on_sensor_type"
  end

  create_table "status_histories", force: :cascade do |t|
    t.string "change_type", null: false
    t.integer "changed_by_id", null: false
    t.datetime "created_at", null: false
    t.string "from_status", null: false
    t.json "metadata"
    t.text "reason"
    t.integer "related_request_id"
    t.string "to_status", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["change_type"], name: "index_status_histories_on_change_type"
    t.index ["changed_by_id"], name: "index_status_histories_on_changed_by_id"
    t.index ["created_at"], name: "index_status_histories_on_created_at"
    t.index ["related_request_id"], name: "index_status_histories_on_related_request_id"
    t.index ["user_id", "created_at"], name: "index_status_histories_on_user_id_and_created_at"
    t.index ["user_id"], name: "index_status_histories_on_user_id"
  end

  create_table "status_requests", force: :cascade do |t|
    t.text "admin_notes"
    t.datetime "created_at", null: false
    t.date "end_date"
    t.string "from_status", null: false
    t.text "reason"
    t.string "request_type", null: false
    t.integer "requested_by_id", null: false
    t.datetime "reviewed_at"
    t.integer "reviewed_by_id"
    t.date "start_date"
    t.string "status", default: "pending"
    t.text "supporting_documents"
    t.string "to_status", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["request_type"], name: "index_status_requests_on_request_type"
    t.index ["requested_by_id"], name: "index_status_requests_on_requested_by_id"
    t.index ["reviewed_by_id"], name: "index_status_requests_on_reviewed_by_id"
    t.index ["status", "created_at"], name: "index_status_requests_on_status_and_created_at"
    t.index ["user_id", "status"], name: "index_status_requests_on_user_id_and_status"
    t.index ["user_id"], name: "index_status_requests_on_user_id"
  end

  create_table "subsidies", force: :cascade do |t|
    t.decimal "amount", precision: 10, scale: 2
    t.datetime "approved_at"
    t.integer "approved_by_id"
    t.datetime "created_at", null: false
    t.integer "invoice_id"
    t.text "notes"
    t.decimal "percentage", precision: 5, scale: 2
    t.decimal "percentage_discount", precision: 5, scale: 2
    t.string "reason"
    t.string "status", default: "pending"
    t.string "subsidy_type", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.date "valid_from"
    t.date "valid_until"
    t.index ["status"], name: "index_subsidies_on_status"
    t.index ["subsidy_type"], name: "index_subsidies_on_subsidy_type"
    t.index ["user_id"], name: "index_subsidies_on_user_id"
  end

  create_table "tariff_rates", force: :cascade do |t|
    t.string "account_type", null: false
    t.datetime "created_at", null: false
    t.date "effective_date", null: false
    t.date "expiry_date"
    t.decimal "fixed_charge", precision: 10, scale: 2, default: "0.0"
    t.boolean "is_active", default: true
    t.string "rate_name", null: false
    t.decimal "rate_per_unit", precision: 10, scale: 2, null: false
    t.decimal "tier_max_usage", precision: 10, scale: 3
    t.decimal "tier_min_usage", precision: 10, scale: 3, null: false
    t.datetime "updated_at", null: false
    t.index ["account_type"], name: "index_tariff_rates_on_account_type"
    t.index ["effective_date"], name: "index_tariff_rates_on_effective_date"
    t.index ["is_active"], name: "index_tariff_rates_on_is_active"
  end

  create_table "task_comments", force: :cascade do |t|
    t.text "body", null: false
    t.integer "collaboration_task_id", null: false
    t.datetime "created_at", null: false
    t.integer "task_subtask_id"
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["collaboration_task_id"], name: "index_task_comments_on_collaboration_task_id"
    t.index ["task_subtask_id"], name: "index_task_comments_on_task_subtask_id"
  end

  create_table "task_members", force: :cascade do |t|
    t.integer "collaboration_task_id", null: false
    t.datetime "created_at", null: false
    t.string "role"
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["collaboration_task_id", "user_id"], name: "index_task_members_on_collaboration_task_id_and_user_id", unique: true
  end

  create_table "task_subtasks", force: :cascade do |t|
    t.integer "collaboration_task_id", null: false
    t.datetime "created_at", null: false
    t.integer "created_by_id", null: false
    t.text "description"
    t.string "role_label"
    t.string "status", default: "pending"
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["collaboration_task_id"], name: "index_task_subtasks_on_collaboration_task_id"
  end

  create_table "task_volunteers", force: :cascade do |t|
    t.integer "community_task_id", null: false
    t.datetime "created_at", null: false
    t.string "role", default: "General Helper"
    t.string "status", default: "active"
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["community_task_id", "user_id"], name: "index_task_volunteers_on_community_task_id_and_user_id", unique: true
    t.index ["community_task_id"], name: "index_task_volunteers_on_community_task_id"
  end

  create_table "ticket_updates", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.boolean "is_internal"
    t.text "message"
    t.integer "ticket_id"
    t.datetime "updated_at", null: false
    t.integer "user_id"
  end

  create_table "tickets", force: :cascade do |t|
    t.integer "assigned_to_id"
    t.string "category"
    t.datetime "created_at", null: false
    t.text "description"
    t.string "priority"
    t.text "resolution_notes"
    t.datetime "resolved_at"
    t.string "status"
    t.string "subject"
    t.datetime "updated_at", null: false
    t.integer "user_id"
  end

  create_table "tree_growth_updates", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "health_status"
    t.decimal "height_cm", precision: 8, scale: 2
    t.text "notes"
    t.integer "tree_planting_id", null: false
    t.integer "trees_alive"
    t.date "update_date", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["tree_planting_id", "update_date"], name: "index_tree_growth_updates_on_tree_planting_id_and_update_date"
    t.index ["tree_planting_id"], name: "index_tree_growth_updates_on_tree_planting_id"
    t.index ["user_id"], name: "index_tree_growth_updates_on_user_id"
  end

  create_table "tree_planting_photos", force: :cascade do |t|
    t.text "caption"
    t.datetime "created_at", null: false
    t.string "file_format", null: false
    t.string "file_name", null: false
    t.string "file_path", null: false
    t.integer "file_size", null: false
    t.string "photo_type", default: "initial", null: false
    t.date "taken_on"
    t.integer "tree_planting_id", null: false
    t.datetime "updated_at", null: false
    t.index ["tree_planting_id", "photo_type"], name: "index_tree_planting_photos_on_tree_planting_id_and_photo_type"
    t.index ["tree_planting_id"], name: "index_tree_planting_photos_on_tree_planting_id"
  end

  create_table "tree_plantings", force: :cascade do |t|
    t.decimal "carbon_credit_kg", precision: 10, scale: 3, default: "0.0"
    t.string "category", default: "fruit", null: false
    t.datetime "created_at", null: false
    t.string "location"
    t.text "notes"
    t.integer "quantity", default: 1, null: false
    t.text "rejection_reason"
    t.string "species", null: false
    t.string "status", default: "pending", null: false
    t.string "tree_type", default: "indigenous", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.datetime "verified_at"
    t.integer "verified_by_id"
    t.string "water_need", default: "medium"
    t.index ["user_id", "status"], name: "index_tree_plantings_on_user_id_and_status"
    t.index ["user_id"], name: "index_tree_plantings_on_user_id"
  end

  create_table "user_profiles", force: :cascade do |t|
    t.string "account_number"
    t.text "additional_notes"
    t.datetime "created_at", null: false
    t.text "emergency_contact_info"
    t.json "metadata"
    t.json "preferences"
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["account_number"], name: "index_user_profiles_on_account_number", unique: true
    t.index ["user_id"], name: "index_user_profiles_on_user_id", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.string "account_type", default: "household", null: false
    t.string "alt_contact"
    t.string "alt_phone"
    t.text "avatar"
    t.string "communication_preference", null: false
    t.string "contact_person"
    t.datetime "created_at", null: false
    t.string "email"
    t.string "first_name"
    t.integer "household_size"
    t.string "institution_name"
    t.string "institution_type"
    t.text "landmark"
    t.text "language_settings", default: "{}"
    t.string "last_name"
    t.boolean "newsletter_subscription", default: false
    t.text "notification_preferences", default: "{}"
    t.string "password_digest", null: false
    t.string "phone", null: false
    t.string "plot_number"
    t.integer "population_served"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.string "role", default: "client", null: false
    t.string "status", default: "active", null: false
    t.string "storage_capacity"
    t.datetime "updated_at", null: false
    t.string "village"
    t.index ["account_type"], name: "index_users_on_account_type"
    t.index ["email"], name: "index_users_on_email", unique: true, where: "(email IS NOT NULL)"
    t.index ["phone"], name: "index_users_on_phone", unique: true
    t.index ["role"], name: "index_users_on_role"
    t.index ["status"], name: "index_users_on_status"
  end

  create_table "valve_operations", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "notes"
    t.datetime "operated_at"
    t.integer "operated_by_id"
    t.string "operation_type", null: false
    t.text "reason"
    t.datetime "scheduled_reopen_at"
    t.string "status", default: "open"
    t.datetime "updated_at", null: false
    t.string "valve_name", null: false
    t.string "zone"
    t.index ["status"], name: "index_valve_operations_on_status"
    t.index ["zone"], name: "index_valve_operations_on_zone"
  end

  create_table "voice_sessions", force: :cascade do |t|
    t.string "caller_number"
    t.string "channel", default: "web"
    t.datetime "created_at", null: false
    t.integer "duration_seconds"
    t.datetime "ended_at"
    t.string "intent_detected"
    t.string "language", default: "en"
    t.string "outcome"
    t.string "session_token", null: false
    t.datetime "started_at"
    t.string "status", default: "active"
    t.integer "ticket_id"
    t.text "transcript"
    t.datetime "updated_at", null: false
    t.integer "user_id"
    t.index ["channel"], name: "index_voice_sessions_on_channel"
    t.index ["session_token"], name: "index_voice_sessions_on_session_token", unique: true
    t.index ["started_at"], name: "index_voice_sessions_on_started_at"
    t.index ["status"], name: "index_voice_sessions_on_status"
    t.index ["user_id"], name: "index_voice_sessions_on_user_id"
  end

  create_table "volunteers", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "created_by_id"
    t.string "email"
    t.string "name", null: false
    t.string "phone"
    t.string "skills"
    t.string "status", default: "active"
    t.datetime "updated_at", null: false
    t.integer "user_id"
    t.index ["status"], name: "index_volunteers_on_status"
  end

  add_foreign_key "appeals", "status_histories", column: "original_action_id"
  add_foreign_key "appeals", "users"
  add_foreign_key "appeals", "users", column: "reviewed_by_id"
  add_foreign_key "blog_posts", "users", column: "created_by_id"
  add_foreign_key "blog_posts", "users", column: "updated_by_id"
  add_foreign_key "chat_messages", "users"
  add_foreign_key "client_profile_audit_logs", "users", column: "approved_by_id"
  add_foreign_key "client_profile_audit_logs", "users", column: "client_id"
  add_foreign_key "client_profile_audit_logs", "users", column: "modified_by_id"
  add_foreign_key "connections", "users"
  add_foreign_key "documents", "users"
  add_foreign_key "documents", "users", column: "verified_by_id"
  add_foreign_key "event_rsvps", "events"
  add_foreign_key "event_rsvps", "users"
  add_foreign_key "gallery_items", "users", column: "created_by_id"
  add_foreign_key "gallery_items", "users", column: "updated_by_id"
  add_foreign_key "invoice_line_items", "invoices"
  add_foreign_key "invoices", "users"
  add_foreign_key "invoices", "users", column: "generated_by_id"
  add_foreign_key "marketplace_items", "users", column: "created_by_id"
  add_foreign_key "marketplace_items", "users", column: "seller_user_id"
  add_foreign_key "marketplace_items", "users", column: "updated_by_id"
  add_foreign_key "meter_readings", "connections"
  add_foreign_key "meter_readings", "users", column: "recorded_by_id"
  add_foreign_key "meters", "connections"
  add_foreign_key "notifications", "users"
  add_foreign_key "notifications", "users", column: "related_user_id"
  add_foreign_key "pending_payments", "invoices"
  add_foreign_key "pending_payments", "users"
  add_foreign_key "profile_history", "users"
  add_foreign_key "profile_history", "users", column: "changed_by_id"
  add_foreign_key "status_histories", "status_requests", column: "related_request_id"
  add_foreign_key "status_histories", "users"
  add_foreign_key "status_histories", "users", column: "changed_by_id"
  add_foreign_key "status_requests", "users"
  add_foreign_key "status_requests", "users", column: "requested_by_id"
  add_foreign_key "status_requests", "users", column: "reviewed_by_id"
  add_foreign_key "tree_growth_updates", "tree_plantings"
  add_foreign_key "tree_growth_updates", "users"
  add_foreign_key "tree_planting_photos", "tree_plantings"
  add_foreign_key "tree_plantings", "users"
  add_foreign_key "user_profiles", "users"
end
