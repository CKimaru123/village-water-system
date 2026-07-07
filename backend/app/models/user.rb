class User < ApplicationRecord
  # Password authentication
  has_secure_password

  # Associations
  has_one :user_profile, dependent: :destroy
  has_many :connections, dependent: :destroy
  has_many :meters, through: :connections
  has_many :invoices, dependent: :destroy
  has_many :payment_plans, dependent: :destroy
  has_many :profile_histories, dependent: :destroy
  has_many :tree_plantings, dependent: :destroy
  has_many :generated_invoices, class_name: 'Invoice', foreign_key: 'generated_by_id'
  
  # Status management associations
  has_many :status_requests, dependent: :destroy
  has_many :requested_status_changes, class_name: 'StatusRequest', foreign_key: 'requested_by_id'
  has_many :status_histories, dependent: :destroy
  has_many :status_changes_made, class_name: 'StatusHistory', foreign_key: 'changed_by_id'
  has_many :appeals, dependent: :destroy
  has_many :reviewed_appeals, class_name: 'Appeal', foreign_key: 'reviewed_by_id'

  # Notifications associations
  has_many :notifications, dependent: :destroy
  has_many :sent_notifications, class_name: 'Notification', foreign_key: 'related_user_id'

  # Documents and meter readings associations
  has_many :documents, dependent: :destroy
  has_many :verified_documents, class_name: 'Document', foreign_key: 'verified_by_id'
  has_many :meter_readings, through: :connections
  has_many :recorded_meter_readings, class_name: 'MeterReading', foreign_key: 'recorded_by_id'

  # Billing associations
  has_many :payments, dependent: :destroy

  # Support associations
  has_many :tickets, dependent: :destroy
  has_many :assigned_tickets, class_name: 'Ticket', foreign_key: 'assigned_to_id'
  has_many :ticket_updates, dependent: :destroy

  # Community associations
  has_many :poll_votes, dependent: :destroy
  has_many :created_announcements, class_name: 'Announcement', foreign_key: 'created_by_id'
  has_many :created_events, class_name: 'Event', foreign_key: 'created_by_id'
  has_many :created_polls, class_name: 'Poll', foreign_key: 'created_by_id'
  has_many :created_projects, class_name: 'Project', foreign_key: 'created_by_id'
  has_many :created_articles, class_name: 'KnowledgeBaseArticle', foreign_key: 'created_by_id'

  # Role / status scopes used by notification and dashboard services
  scope :client, -> { where(role: 'client') }
  scope :admin, -> { where(role: 'admin') }
  scope :super_admin, -> { where(role: 'super_admin') }
  scope :active, -> { where(status: 'active') }

  # Create user profile after user creation
  after_create :create_user_profile

  # Enums for controlled values
  enum :account_type, { household: 'household', institution: 'institution' }
  enum :role, { client: 'client', admin: 'admin', super_admin: 'super_admin' }
  enum :status, { active: 'active', inactive: 'inactive', suspended: 'suspended' }
  enum :communication_preference, { 
    sms: 'SMS', 
    whatsapp: 'WhatsApp', 
    call: 'Call', 
    email: 'Email' 
  }
  enum :institution_type, {
    school: 'School',
    dispensary: 'Dispensary', 
    church: 'Church',
    other: 'Other'
  }, prefix: :institution

  # Validations - Common fields
  validates :phone, presence: true, uniqueness: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }, uniqueness: true, allow_blank: true
  validates :password, length: { minimum: 8 }, format: { 
    with: /\A(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+\z/,
    message: "must include at least one uppercase letter, one lowercase letter, one number, and one special character"
  }, if: :password_required?
  validates :communication_preference, presence: true
  validates :account_type, presence: true
  validates :role, presence: true
  validates :status, presence: true

  # Conditional validations based on account type
  with_options if: :household? do |household|
    household.validates :first_name, presence: true, format: { with: /\A[a-zA-Z\s'-]+\z/, message: "must contain only letters, spaces, hyphens, and apostrophes" }, length: { minimum: 2 }
    household.validates :last_name, presence: true, format: { with: /\A[a-zA-Z\s'-]+\z/, message: "must contain only letters, spaces, hyphens, and apostrophes" }, length: { minimum: 2 }
    household.validates :alt_phone, presence: true
    household.validates :plot_number, presence: true
    household.validates :household_size, presence: true, numericality: { greater_than: 0 }
    household.validates :village, presence: true
  end

  with_options if: :institution? do |institution|
    institution.validates :institution_name, presence: true
    institution.validates :institution_type, presence: true
    institution.validates :contact_person, presence: true, format: { with: /\A[a-zA-Z\s'-]+\z/, message: "must contain only letters, spaces, hyphens, and apostrophes" }, length: { minimum: 2 }
    institution.validates :population_served, numericality: { greater_than: 0 }, allow_blank: true
  end

  # Phone number validation and normalization
  validates :phone, format: { with: /\A\+254[7]\d{8}\z/, message: "must be a valid Kenyan phone number in format +254XXXXXXXXX" }
  validates :alt_phone, format: { with: /\A\+254[7]\d{8}\z/, message: "must be a valid Kenyan phone number in format +254XXXXXXXXX" }, allow_blank: true
  validates :alt_contact, format: { with: /\A\+254[7]\d{8}\z/, message: "must be a valid Kenyan phone number in format +254XXXXXXXXX" }, allow_blank: true

  # Callbacks
  before_validation :normalize_phone_numbers
  before_validation :strip_whitespace

  # Instance methods
  def full_name
    if household?
      "#{first_name} #{last_name}".strip
    elsif institution?
      contact_person
    end
  end

  def display_name
    if household?
      full_name
    elsif institution?
      institution_name
    end
  end

  def client?
    role == 'client'
  end

  def admin?
    role == 'admin'
  end

  def super_admin?
    role == 'super_admin'
  end

  def can_manage_content?
    admin? || super_admin?
  end

  def can_manage_admins?
    super_admin?
  end

  # Get formatted updated_at with timezone adjustment (+3 hours for Kenya EAT)
  def formatted_updated_at_with_timezone
    adjusted_time = updated_at + 3.hours
    adjusted_time.strftime('%m/%d/%Y, %H:%M:%S')
  end

  def account_number
    user_profile&.account_number
  end

  def current_connection
    connections.active.first
  end

  def current_meter
    current_connection&.meter
  end

  def current_invoice
    invoices.unpaid.order(:due_date).first
  end

  def has_overdue_invoices?
    invoices.overdue.exists?
  end

  # Status management methods
  def can_request_pause?
    active? && !has_pending_status_request?
  end

  def can_request_reactivation?
    inactive? && !has_pending_status_request?
  end

  def can_appeal_suspension?
    suspended? && !has_pending_appeal?
  end

  def has_pending_status_request?
    status_requests.pending.exists?
  end

  def has_pending_appeal?
    appeals.pending.exists?
  end

  def latest_status_change
    status_histories.recent.first
  end

  def status_change_reason
    latest_status_change&.reason || 'No status change recorded'
  end

  def change_status!(new_status:, changed_by:, reason:, change_type: 'admin_action', related_request: nil)
    old_status = status
    
    transaction do
      update!(status: new_status)
      
      StatusHistory.log_status_change(
        user: self,
        changed_by: changed_by,
        from_status: old_status,
        to_status: new_status,
        reason: reason,
        change_type: change_type,
        related_request: related_request
      )
    end
  end

  # Class methods for creating specific user types
  def self.create_client(attributes)
    user = new(attributes)
    user.role = 'client'
    user.status = 'active'
    user.save
    user
  end

  private

  def normalize_phone_numbers
    self.phone = normalize_phone(phone) if phone.present?
    self.alt_phone = normalize_phone(alt_phone) if alt_phone.present?
    self.alt_contact = normalize_phone(alt_contact) if alt_contact.present?
  end

  def normalize_phone(phone_number)
    return nil if phone_number.blank?
    
    # Remove all non-digits
    cleaned = phone_number.gsub(/\D/, '')
    
    # Convert to international format
    case cleaned
    when /\A254[7]\d{8}\z/  # Already in 254 format
      "+#{cleaned}"
    when /\A0[7]\d{8}\z/    # Local format (0712345678)
      "+254#{cleaned[1..-1]}"
    when /\A[7]\d{8}\z/     # Without leading 0 (712345678)
      "+254#{cleaned}"
    else
      phone_number # Return original if can't normalize
    end
  end

  def strip_whitespace
    # Strip whitespace from string fields
    string_attributes = %w[first_name last_name institution_name contact_person village plot_number landmark]
    string_attributes.each do |attr|
      self[attr] = self[attr]&.strip
    end
  end

  def password_required?
    password_digest.blank? || password.present?
  end

  def create_user_profile
    UserProfile.create!(user: self)
  end

  # ── Notification preferences (JSON stored as text) ──────────────────────────
  public

  def notif_prefs
    return @notif_prefs_cache if defined?(@notif_prefs_cache)
    raw = read_attribute(:notification_preferences)
    @notif_prefs_cache = raw.present? ? JSON.parse(raw) : {}
  rescue JSON::ParserError
    {}
  end

  def notif_prefs=(hash)
    @notif_prefs_cache = hash
    write_attribute(:notification_preferences, hash.to_json)
  end

  # Returns true if the user wants this notification_type on this channel
  # Falls back to communication_preference if no explicit per-type setting exists
  def wants_notification?(type_key, channel)
    prefs = notif_prefs
    pref_key = "#{type_key}_#{channel}"
    if prefs.key?(pref_key)
      prefs[pref_key] == true
    else
      # Fall back to global communication_preference
      communication_preference&.downcase == channel.to_s
    end
  end

  # Returns true if current time is within the user's quiet hours window
  def in_quiet_hours?
    prefs = notif_prefs
    return false unless prefs['quiet_hours_enabled']

    from_str = prefs['quiet_hours_from'] || '22:00'
    to_str   = prefs['quiet_hours_to']   || '07:00'
    now      = Time.current.in_time_zone('Africa/Nairobi')
    cur      = now.hour * 60 + now.min
    fh, fm   = from_str.split(':').map(&:to_i)
    th, tm   = to_str.split(':').map(&:to_i)
    fmin     = fh * 60 + fm
    tmin     = th * 60 + tm

    # Overnight window (e.g. 22:00 → 07:00)
    fmin > tmin ? (cur >= fmin || cur < tmin) : (cur >= fmin && cur < tmin)
  end

  # ── Language settings (JSON stored as text) ─────────────────────────────────
  def lang_settings
    raw = read_attribute(:language_settings)
    raw.present? ? JSON.parse(raw) : { 'language' => 'en', 'timezone' => 'Africa/Nairobi', 'date_format' => 'DD/MM/YYYY', 'number_format' => 'en' }
  rescue JSON::ParserError
    { 'language' => 'en', 'timezone' => 'Africa/Nairobi' }
  end

  def lang_settings=(hash)
    write_attribute(:language_settings, hash.to_json)
  end
end