class Api::V1::NotificationsController < ApplicationController
  before_action :authenticate_request

  # GET /api/v1/notifications
  def index
    @notifications = current_user.notifications
                                .active
                                .recent
                                .limit(params[:limit] || 50)

    render_success({
      notifications: @notifications.map { |notification| notification_data(notification) },
      unread_count: current_user.notifications.unread.active.count,
      total_count: @notifications.count
    }, 'Notifications retrieved successfully')
  end

  # GET /api/v1/notifications/unread_count
  def unread_count
    count = current_user.notifications.unread.active.count
    
    render_success({
      unread_count: count
    }, 'Unread count retrieved successfully')
  end

  # PATCH /api/v1/notifications/:id/mark_read
  def mark_read
    @notification = current_user.notifications.find(params[:id])
    @notification.mark_as_read!
    
    render_success({
      notification: notification_data(@notification),
      unread_count: current_user.notifications.unread.active.count
    }, 'Notification marked as read')
  rescue ActiveRecord::RecordNotFound
    render_error('Notification not found', [], :not_found)
  end

  # PATCH /api/v1/notifications/mark_all_read
  def mark_all_read
    current_user.notifications.unread.active.update_all(
      read: true, 
      read_at: Time.current
    )
    
    render_success({
      unread_count: 0
    }, 'All notifications marked as read')
  end

  # DELETE /api/v1/notifications/:id
  def destroy
    @notification = current_user.notifications.find(params[:id])
    @notification.destroy!
    
    render_success({
      unread_count: current_user.notifications.unread.active.count
    }, 'Notification deleted successfully')
  rescue ActiveRecord::RecordNotFound
    render_error('Notification not found', [], :not_found)
  end

  private

  def notification_data(notification)
    {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      notification_type: notification.notification_type,
      category: notification.category,
      priority: notification.priority,
      read: notification.read,
      read_at: notification.read_at,
      created_at: notification.created_at,
      formatted_created_at: notification.formatted_created_at,
      time_ago: notification.time_ago,
      action_url: notification.action_url,
      metadata: notification.metadata,
      related_user: notification.related_user ? {
        id: notification.related_user.id,
        name: notification.related_user.display_name,
        role: notification.related_user.role
      } : nil
    }
  end
end