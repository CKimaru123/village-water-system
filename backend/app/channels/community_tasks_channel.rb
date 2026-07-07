class CommunityTasksChannel < ApplicationCable::Channel
  def subscribed
    stream_from "community_tasks"
    Rails.logger.info "CommunityTasksChannel: #{current_user.display_name} subscribed"
  end

  def unsubscribed
    Rails.logger.info "CommunityTasksChannel: #{current_user&.display_name} unsubscribed"
  end
end
