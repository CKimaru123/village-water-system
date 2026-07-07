class TaskComment < ApplicationRecord
  belongs_to :collaboration_task
  belongs_to :task_subtask, optional: true
  belongs_to :user

  validates :body, presence: true
  scope :recent, -> { order(created_at: :asc) }
end
