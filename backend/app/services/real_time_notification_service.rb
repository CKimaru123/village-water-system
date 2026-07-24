class RealTimeNotificationService
  def self.notify_profile_update(client_id, updated_fields, modified_by)
    # Create persistent notification in database
    client = User.find(client_id)
    notification = Notification.create_profile_update_notification(client, modified_by, updated_fields)
    
    # Create admin notification if modified by admin
    if modified_by.admin? || modified_by.super_admin?
      admin_notification = Notification.create_admin_notification(
        modified_by, 
        client, 
        'updated',
        { message: "Profile updated successfully", updated_fields: updated_fields }
      )
    end

    # Prepare real-time notification data
    notification_data = {
      type: 'profile_update',
      client_id: client_id,
      updated_fields: updated_fields,
      modified_by: {
        id: modified_by.id,
        name: modified_by.display_name,
        role: modified_by.role
      },
      timestamp: Time.current.iso8601,
      notification: {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        time_ago: notification.time_ago,
        action_url: notification.action_url
      }
    }

    # # Notify the specific client via WebSocket
    # ActionCable.server.broadcast("client_#{client_id}", notification_data)
    
    # # Notify all admin users about the change
    # admin_notification_data = notification_data.merge({
    #   type: 'admin_profile_update',
    #   notification: admin_notification ? {
    #     id: admin_notification.id,
    #     title: admin_notification.title,
    #     message: admin_notification.message,
    #     time_ago: admin_notification.time_ago,
    #     action_url: admin_notification.action_url
    #   } : nil
    # })

    # Notify the specific client via WebSocket
    ActionCable.server.broadcast("client_#{client_id}", notification_data.merge({
      user_id: client_id,
      notification: {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        notification_type: notification.notification_type,
        category: notification.category,
        priority: notification.priority,
        read: notification.read,
        created_at: notification.created_at,
        action_url: notification.action_url,
        time_ago: notification.time_ago
      }
    }))

    # Notify all admin users about the change
    ActionCable.server.broadcast("admin_updates", notification_data.merge({
      type: 'admin_profile_update',
      user_id: modified_by.id,
      notification: admin_notification ? {
        id: admin_notification.id,
        title: admin_notification.title,
        message: admin_notification.message,
        notification_type: admin_notification.notification_type,
        category: admin_notification.category,
        priority: admin_notification.priority,
        read: admin_notification.read,
        created_at: admin_notification.created_at,
        action_url: admin_notification.action_url,
        time_ago: admin_notification.time_ago
      } : nil
    }))

    ActionCable.server.broadcast("admin_updates", admin_notification_data)
    
    # Log the notification
    Rails.logger.info "Real-time notification sent for client #{client_id}: #{updated_fields.join(', ')}"
    
    # Return the created notification
    notification
  end

  def self.notify_audit_log_update(client_id, audit_log)
    notification_data = {
      type: 'audit_log_update',
      client_id: client_id,
      audit_log: {
        id: audit_log.id,
        field_name: audit_log.field_name.humanize,
        change_description: audit_log.change_description,
        modified_by: audit_log.modified_by.display_name,
        modified_by_role: audit_log.modified_by.role,
        sensitivity_level: audit_log.sensitivity_level,
        formatted_timestamp: audit_log.formatted_timestamp
      },
      timestamp: Time.current.iso8601
    }

    # Notify the specific client
    ActionCable.server.broadcast("client_#{client_id}", notification_data)
    
    # Notify admins
    ActionCable.server.broadcast("admin_updates", notification_data)
  end

  def self.create_and_broadcast_notification(user, title, message, options = {})
    # Create notification in database
    notification = Notification.create!(
      user: user,
      title: title,
      message: message,
      notification_type: options[:type] || 'general_announcement',
      category: options[:category] || 'general',
      priority: options[:priority] || 'normal',
      metadata: options[:metadata] || {},
      related_user: options[:related_user],
      action_url: options[:action_url],
      expires_at: options[:expires_at]
    )

    # Broadcast real-time notification
    notification_data = {
      type: 'new_notification',
      user_id: user.id,
      notification: {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        category: notification.category,
        priority: notification.priority,
        time_ago: notification.time_ago,
        action_url: notification.action_url,
        metadata: notification.metadata
      },
      timestamp: Time.current.iso8601
    }

    # Send to appropriate channel based on user role
    if user.client?
      ActionCable.server.broadcast("client_#{user.id}", notification_data)
    elsif user.admin? || user.super_admin?
      ActionCable.server.broadcast("admin_updates", notification_data)
    end

    notification
  end
end