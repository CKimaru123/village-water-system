class Document < ApplicationRecord
  belongs_to :user
  belongs_to :verified_by, class_name: 'User', optional: true

  # Enums
  enum :status, { unverified: 'unverified', verified: 'verified', rejected: 'rejected', expired: 'expired' }
  enum :document_type, {
    national_id: 'national_id',
    tenancy_agreement: 'tenancy_agreement',
    property_ownership: 'property_ownership',
    water_connection_application: 'water_connection_application',
    proof_of_income: 'proof_of_income',
    utility_bill: 'utility_bill',
    business_registration: 'business_registration',
    tax_compliance: 'tax_compliance',
    authorization_letter: 'authorization_letter',
    other: 'other'
  }

  # Validations
  validates :document_type, presence: true
  validates :file_name, presence: true
  validates :file_path, presence: true
  validates :file_size, presence: true, numericality: { greater_than: 0, less_than_or_equal_to: 10.megabytes }
  validates :status, presence: true
  validate :file_format_valid

  # Scopes
  scope :unverified, -> { where(status: 'unverified') }
  scope :verified, -> { where(status: 'verified') }
  scope :rejected, -> { where(status: 'rejected') }
  scope :expired, -> { where(status: 'expired') }
  scope :by_type, ->(type) { where(document_type: type) }
  scope :expiring_soon, -> { where('expiry_date <= ? AND expiry_date > ?', 30.days.from_now, Date.current) }

  # Callbacks
  before_save :check_expiry

  # Instance methods
  def verify!(admin_user, notes = nil)
    update!(
      status: 'verified',
      verified_by: admin_user,
      verified_at: Time.current,
      notes: notes
    )
  end

  def reject!(admin_user, reason)
    update!(
      status: 'rejected',
      verified_by: admin_user,
      verified_at: Time.current,
      rejection_reason: reason
    )
  end

  def expired?
    expiry_date.present? && expiry_date < Date.current
  end

  def expiring_soon?
    expiry_date.present? && expiry_date <= 30.days.from_now && expiry_date > Date.current
  end

  def file_size_mb
    (file_size.to_f / 1.megabyte).round(2)
  end

  def display_type
    document_type.humanize
  end

  private

  def file_format_valid
    allowed_formats = %w[pdf jpg jpeg png]
    if file_format.present? && !allowed_formats.include?(file_format.downcase)
      errors.add(:file_format, "must be one of: #{allowed_formats.join(', ')}")
    end
  end

  def check_expiry
    if expiry_date.present? && expiry_date < Date.current && status != 'expired'
      self.status = 'expired'
    end
  end
end
