class DunningAction < ApplicationRecord
  belongs_to :invoice
  belongs_to :user
  belongs_to :sent_by, class_name: 'User', optional: true

  validates :action_type, presence: true

  scope :recent,   -> { order(created_at: :desc) }
  scope :for_user, ->(uid) { where(user_id: uid) }
end
