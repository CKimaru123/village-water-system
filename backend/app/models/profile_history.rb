class ProfileHistory < ApplicationRecord
  self.table_name = 'profile_history'
  
  belongs_to :user
  belongs_to :changed_by, class_name: 'User', optional: true

  validates :user_id, presence: true
  validates :field_name, presence: true

  scope :recent, -> { order(changed_at: :desc) }
  scope :for_field, ->(field) { where(field_name: field) }

  # Class method to log profile changes
  def self.log_change(user, field_name, old_value, new_value, changed_by = nil)
    create!(
      user: user,
      field_name: field_name,
      old_value: old_value&.to_s,
      new_value: new_value&.to_s,
      changed_by: changed_by,
      changed_at: Time.current
    )
  end
end