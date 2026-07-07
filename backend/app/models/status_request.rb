class StatusRequest < ApplicationRecord
  belongs_to :user
  belongs_to :requested_by, class_name: 'User'
  belongs_to :reviewed_by, class_name: 'User', optional: true
  has_many :status_histories, foreign_key: 'related_request_id', dependent: :nullify

  validates :request_type, presence: true, inclusion: { in: %w[pause reactivate appeal] }
  validates :from_status, presence: true, inclusion: { in: %w[active inactive suspended] }
  validates :to_status, presence: true, inclusion: { in: %w[active inactive suspended] }
  validates :status, presence: true, inclusion: { in: %w[pending approved denied completed] }
  validates :reason, presence: true

  # Validate date logic for pause requests
  validate :end_date_after_start_date, if: -> { request_type == 'pause' && start_date.present? && end_date.present? }
  validate :start_date_not_in_past, if: -> { request_type == 'pause' && start_date.present? }

  scope :pending, -> { where(status: 'pending') }
  scope :approved, -> { where(status: 'approved') }
  scope :denied, -> { where(status: 'denied') }
  scope :completed, -> { where(status: 'completed') }
  scope :by_type, ->(type) { where(request_type: type) }
  scope :recent, -> { order(created_at: :desc) }

  # Serialize supporting documents as JSON
  serialize :supporting_documents, coder: JSON

  def can_be_approved?
    status == 'pending'
  end

  def can_be_denied?
    status == 'pending'
  end

  def approve!(reviewed_by_user, admin_notes = nil)
    transaction do
      update!(
        status: 'approved',
        reviewed_by: reviewed_by_user,
        reviewed_at: Time.current,
        admin_notes: admin_notes
      )
      
      # Apply the status change to the user
      user.update!(status: to_status)
      
      # Log the status change
      StatusHistory.create!(
        user: user,
        changed_by: reviewed_by_user,
        from_status: from_status,
        to_status: to_status,
        reason: "Request approved: #{reason}",
        change_type: 'user_request',
        related_request: self
      )
    end
  end

  def deny!(reviewed_by_user, admin_notes)
    update!(
      status: 'denied',
      reviewed_by: reviewed_by_user,
      reviewed_at: Time.current,
      admin_notes: admin_notes
    )
  end

  def formatted_dates
    if start_date && end_date
      "#{start_date.strftime('%B %d, %Y')} - #{end_date.strftime('%B %d, %Y')}"
    elsif start_date
      "Starting #{start_date.strftime('%B %d, %Y')}"
    else
      "Immediate"
    end
  end

  private

  def end_date_after_start_date
    errors.add(:end_date, "must be after start date") if end_date <= start_date
  end

  def start_date_not_in_past
    errors.add(:start_date, "cannot be in the past") if start_date < Date.current
  end
end