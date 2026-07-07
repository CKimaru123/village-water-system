class TaskSubtask < ApplicationRecord
  belongs_to :collaboration_task
  belongs_to :created_by, class_name: 'User'
  has_many   :task_comments, dependent: :destroy

  validates :title, presence: true
  scope :recent, -> { order(created_at: :asc) }
end
