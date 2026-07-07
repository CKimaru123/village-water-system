class ChatMessage < ApplicationRecord
  belongs_to :user

  validates :message,     presence: true
  validates :session_id,  presence: true
  validates :sender_role, presence: true, inclusion: { in: %w[client admin] }

  scope :for_session, ->(sid) { where(session_id: sid).order(:created_at) }
  scope :recent,      -> { order(created_at: :desc) }
  scope :unread,      -> { where(read: false) }
end
