class TaskMember < ApplicationRecord
  belongs_to :collaboration_task
  belongs_to :user

  validates :user_id, uniqueness: { scope: :collaboration_task_id }
end
