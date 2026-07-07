class CollaborationTask < ApplicationRecord
  belongs_to :assigned_to, class_name: 'User', optional: true
  belongs_to :created_by,  class_name: 'User', optional: true
  has_many   :task_members,   dependent: :destroy
  has_many   :members, through: :task_members, source: :user
  has_many   :task_subtasks,  dependent: :destroy
  has_many   :task_comments,  dependent: :destroy

  validates :title, presence: true

  scope :open,     -> { where(status: 'open') }
  scope :recent,   -> { order(created_at: :desc) }
  scope :for_user, ->(uid) { where(assigned_to_id: uid).or(where(created_by_id: uid)) }
end
