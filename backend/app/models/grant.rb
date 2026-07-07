class Grant < ApplicationRecord
  belongs_to :project,    optional: true
  belongs_to :created_by, class_name: 'User', optional: true

  validates :title,      presence: true
  validates :donor_name, presence: true

  scope :active,  -> { where(status: 'active') }
  scope :recent,  -> { order(created_at: :desc) }

  # When a grant is approved/activated, add its amount to the linked project's budget
  after_update :update_project_budget, if: :saved_change_to_status?

  private

  def update_project_budget
    return unless project.present? && amount.present? && amount > 0
    return unless status == 'active' && status_before_last_save != 'active'

    # Increment the project's budget by the grant amount
    project.increment!(:budget, amount)
  rescue => e
    Rails.logger.warn "Grant#update_project_budget failed for grant #{id}: #{e.message}"
  end
end
