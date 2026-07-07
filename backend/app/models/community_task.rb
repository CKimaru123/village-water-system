class CommunityTask < ApplicationRecord
  belongs_to :created_by, class_name: "User", optional: true
  has_many   :task_volunteers, dependent: :destroy
  has_many   :volunteers, through: :task_volunteers, source: :user

  validates :title, presence: true

  scope :open,   -> { where(status: "open") }
  scope :recent, -> { order(created_at: :desc) }

  def volunteer_list
    task_volunteers.includes(:user).map do |tv|
      { id: tv.user_id, name: tv.user.display_name, role: tv.role, status: tv.status }
    end
  end
end
