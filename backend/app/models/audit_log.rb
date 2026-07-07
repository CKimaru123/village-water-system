class AuditLog < ApplicationRecord
  belongs_to :user, optional: true

  validates :action,       presence: true
  validates :performed_at, presence: true

  before_validation :set_performed_at, on: :create

  scope :recent,        -> { order(performed_at: :desc) }
  scope :for_user,      ->(uid) { where(user_id: uid) }
  scope :for_resource,  ->(type, id) { where(resource_type: type, resource_id: id) }
  scope :by_action,     ->(action) { where(action: action) }
  scope :in_period,     ->(from, to) { where(performed_at: from..to) }

  def self.log(user:, action:, resource: nil, details: nil, ip: nil)
    create!(
      user: user,
      action: action,
      resource_type: resource&.class&.name,
      resource_id: resource&.id,
      details: details,
      ip_address: ip,
      performed_at: Time.current
    )
  end

  private

  def set_performed_at
    self.performed_at ||= Time.current
  end
end
