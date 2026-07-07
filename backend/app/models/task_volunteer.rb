class TaskVolunteer < ApplicationRecord
  belongs_to :community_task
  belongs_to :user

  validates :community_task_id, uniqueness: { scope: :user_id, message: "already volunteered" }
end
