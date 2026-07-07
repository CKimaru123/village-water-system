##
# CrossDashboardService
# Enforces all Section 3 data flows between Client, Admin, and Super Admin dashboards.
# Every method maps directly to a row in Section 3.1 or 3.2 of the mapping doc.
##
class CrossDashboardService

  # ─────────────────────────────────────────────────────────────────────────────
  # SECTION 3.1 — Client → Admin flows
  # ─────────────────────────────────────────────────────────────────────────────

  # 3.1 Row 1: Client uploads document → notify admins for Document Verification
  def self.on_document_uploaded(document)
    User.where(role: %w[admin super_admin]).find_each do |admin|
      Notification.create!(
        user_id:           admin.id,
        title:             'New Document Awaiting Verification',
        message:           "#{document.user.display_name} uploaded #{document.document_type.humanize}. Pending verification.",
        category:          'document',
        notification_type: 'document_upload',
        priority:          'normal',
        action_url:        '/admin/document-verification',
        metadata:          { document_id: document.id, user_id: document.user_id }
      )
    end
    AuditLog.log(user: document.user, action: 'document_uploaded',
                 resource: document, details: "Type: #{document.document_type}")
  end

  # 3.1 Row 2: Client submits ticket → notify admins for Multi-Channel Ticketing
  def self.on_ticket_submitted(ticket)
    User.where(role: %w[admin super_admin]).find_each do |admin|
      Notification.create!(
        user_id:           admin.id,
        title:             'New Support Ticket',
        message:           "#{ticket.user.display_name} submitted: \"#{ticket.subject}\" [#{ticket.priority.upcase}]",
        category:          'support',
        notification_type: 'ticket',
        priority:          ticket.priority == 'urgent' ? 'high' : 'normal',
        action_url:        '/admin/ticketing',
        metadata:          { ticket_id: ticket.id, user_id: ticket.user_id }
      )
    end
    AuditLog.log(user: ticket.user, action: 'ticket_submitted',
                 resource: ticket, details: ticket.subject)
  end

  # 3.1 Row 3: Client requests status pause → notify admins for Request Queue + Status Management
  def self.on_status_request_submitted(request)
    User.where(role: %w[admin super_admin]).find_each do |admin|
      Notification.create!(
        user_id:           admin.id,
        title:             "Status #{request.request_type.humanize} Request",
        message:           "#{request.user.display_name} requested #{request.request_type}: #{request.reason.truncate(80)}",
        category:          'status',
        notification_type: 'status_request',
        priority:          'normal',
        action_url:        '/admin/request-queue',
        metadata:          { request_id: request.id, user_id: request.user_id }
      )
    end
    AuditLog.log(user: request.user, action: 'status_request_submitted',
                 resource: request, details: "Type: #{request.request_type}")
  end

  # 3.1 Row 4: Client makes payment → notify admins for Reconciliation + Financial Reports
  def self.on_payment_made(payment)
    User.where(role: %w[admin super_admin]).find_each do |admin|
      Notification.create!(
        user_id:           admin.id,
        title:             'Payment Received',
        message:           "#{payment.user.display_name} paid KES #{payment.amount} via #{payment.payment_method.humanize}. Ref: #{payment.transaction_reference}",
        category:          'billing',
        notification_type: 'payment',
        priority:          'normal',
        action_url:        '/admin/reconciliation',
        metadata:          { payment_id: payment.id, invoice_id: payment.invoice_id }
      )
    end
    AuditLog.log(user: payment.user, action: 'payment_made',
                 resource: payment, details: "Amount: #{payment.amount}, Method: #{payment.payment_method}")
  end

  # 3.1 Row 5: Client votes in poll → update poll analytics (no admin notification needed, just audit)
  def self.on_poll_voted(vote)
    AuditLog.log(user: vote.user, action: 'poll_voted',
                 resource: vote.poll, details: "Option: #{vote.poll_option.option_text}")
  end

  # 3.1 Row 6: Client calculates carbon footprint → log for aggregate admin analysis
  def self.on_carbon_footprint_calculated(user, consumption_m3, carbon_kg)
    AuditLog.log(user: user, action: 'carbon_footprint_calculated',
                 details: "Consumption: #{consumption_m3} m³, Carbon: #{carbon_kg} kg CO2")
  end

  # ─────────────────────────────────────────────────────────────────────────────
  # SECTION 3.2 — Admin → Client flows
  # ─────────────────────────────────────────────────────────────────────────────

  # 3.2 Row 1: Admin creates connection → notify client on Connection Details
  def self.on_connection_created(connection, admin)
    Notification.create!(
      user_id:           connection.user_id,
      title:             'Water Connection Created',
      message:           "Your water connection #{connection.connection_number} (Meter: #{connection.meter_number}) has been created in Zone #{connection.zone}.",
      category:          'service',
      notification_type: 'connection',
      priority:          'high',
      action_url:        '/client/connection',
      metadata:          { connection_id: connection.id }
    )
    AuditLog.log(user: admin, action: 'connection_created',
                 resource: connection, details: "For user: #{connection.user.display_name}")
  end

  # 3.2 Row 2: Admin generates invoice → notify client on Current Bill
  def self.on_invoice_generated(invoice, admin)
    Notification.create!(
      user_id:           invoice.user_id,
      title:             'New Invoice Generated',
      message:           "Invoice #{invoice.invoice_number} for KES #{invoice.total_amount} is due on #{invoice.due_date.strftime('%b %d, %Y')}. Period: #{invoice.billing_period}.",
      category:          'billing',
      notification_type: 'invoice',
      priority:          'normal',
      action_url:        '/client/current-bill',
      metadata:          { invoice_id: invoice.id, amount: invoice.total_amount }
    )
    AuditLog.log(user: admin, action: 'invoice_generated',
                 resource: invoice, details: "Amount: #{invoice.total_amount}, User: #{invoice.user.display_name}")
  end

  # 3.2 Row 3: Admin verifies document → notify client on Document Upload
  def self.on_document_verified(document, admin)
    Notification.create!(
      user_id:           document.user_id,
      title:             'Document Verified',
      message:           "Your #{document.document_type.humanize} document has been verified and approved.",
      category:          'document',
      notification_type: 'document_verified',
      priority:          'normal',
      action_url:        '/client/documents',
      metadata:          { document_id: document.id }
    )
    AuditLog.log(user: admin, action: 'document_verified',
                 resource: document, details: "User: #{document.user.display_name}")
  end

  # 3.2 Row 3b: Admin rejects document → notify client
  def self.on_document_rejected(document, admin, reason)
    Notification.create!(
      user_id:           document.user_id,
      title:             'Document Rejected',
      message:           "Your #{document.document_type.humanize} document was rejected. Reason: #{reason}. Please re-upload.",
      category:          'document',
      notification_type: 'document_rejected',
      priority:          'high',
      action_url:        '/client/documents',
      metadata:          { document_id: document.id, reason: reason }
    )
    AuditLog.log(user: admin, action: 'document_rejected',
                 resource: document, details: "Reason: #{reason}, User: #{document.user.display_name}")
  end

  # 3.2 Row 4: Admin records meter reading → notify client on Connection Details + Usage Overview
  def self.on_meter_reading_recorded(reading, admin)
    Notification.create!(
      user_id:           reading.connection.user_id,
      title:             'Meter Reading Recorded',
      message:           "New meter reading: #{reading.reading_value} m³ on #{reading.reading_date.strftime('%b %d, %Y')}. Consumption: #{reading.consumption.round(2)} m³.",
      category:          'service',
      notification_type: 'meter_reading',
      priority:          'normal',
      action_url:        '/client/usage-overview',
      metadata:          { reading_id: reading.id, value: reading.reading_value }
    )
    AuditLog.log(user: admin, action: 'meter_reading_recorded',
                 resource: reading, details: "Value: #{reading.reading_value}, Connection: #{reading.connection.connection_number}")
  end

  # 3.2 Row 5: Admin creates announcement → broadcast to all clients
  def self.on_announcement_published(announcement, admin)
    target = announcement.target_audience || 'all'
    user_scope = case target
                 when 'admin'
                   User.where(role: %w[admin super_admin]).active
                 when 'client'
                   User.client.active
                 else
                   User.where(role: %w[client admin super_admin]).active
                 end

    Rails.logger.info "[CrossDashboardService] Publishing announcement=#{announcement.id} title='#{announcement.title}' target=#{target} recipients=#{user_scope.count}"

    user_scope.find_each do |recipient|
      action_url = recipient.client? ? '/client/announcements' : '/admin/announcements'
      Rails.logger.info "[CrossDashboardService] Creating notification for recipient=#{recipient.id} email=#{recipient.email.present?} client=#{recipient.client?}"
      Notification.create!(
        user_id:           recipient.id,
        title:             "Announcement: #{announcement.title}",
        message:           announcement.content.truncate(120),
        category:          'announcement',
        notification_type: 'announcement',
        priority:          announcement.priority == 'urgent' ? 'high' : 'normal',
        action_url:        action_url,
        metadata:          { announcement_id: announcement.id }
      )
    end
    AuditLog.log(user: admin, action: 'announcement_published',
                 resource: announcement, details: "Title: #{announcement.title}, Audience: #{target}")
  end

  # 3.2 Row 6: Admin schedules event → notify clients
  def self.on_event_created(event, admin)
    User.client.active.find_each do |client|
      Notification.create!(
        user_id:           client.id,
        title:             "New Event: #{event.title}",
        message:           "#{event.event_type.humanize} on #{event.event_date.strftime('%b %d, %Y')} at #{event.location}.",
        category:          'community',
        notification_type: 'event',
        priority:          'normal',
        action_url:        '/client/events',
        metadata:          { event_id: event.id }
      )
    end
    AuditLog.log(user: admin, action: 'event_created',
                 resource: event, details: event.title)
  end

  # 3.2 Row 7: Admin creates poll → notify clients
  def self.on_poll_created(poll, admin)
    User.client.active.find_each do |client|
      Notification.create!(
        user_id:           client.id,
        title:             "New Poll: #{poll.title}",
        message:           "A new community poll is open for voting. #{poll.description&.truncate(80)}",
        category:          'community',
        notification_type: 'poll',
        priority:          'normal',
        action_url:        '/client/community-polls',
        metadata:          { poll_id: poll.id }
      )
    end
    AuditLog.log(user: admin, action: 'poll_created',
                 resource: poll, details: poll.title)
  end

  # 3.2 Row 8: Admin approves status request → update client Account Status
  def self.on_status_request_approved(request, admin)
    Notification.create!(
      user_id:           request.user_id,
      title:             'Status Request Approved',
      message:           "Your #{request.request_type} request has been approved. Your account status is now #{request.to_status.humanize}.",
      category:          'status',
      notification_type: 'status_approved',
      priority:          'high',
      action_url:        '/client/account-status',
      metadata:          { request_id: request.id, new_status: request.to_status }
    )
    AuditLog.log(user: admin, action: 'status_request_approved',
                 resource: request, details: "User: #{request.user.display_name}, New status: #{request.to_status}")
  end

  # 3.2 Row 8b: Admin denies status request → notify client
  def self.on_status_request_denied(request, admin)
    Notification.create!(
      user_id:           request.user_id,
      title:             'Status Request Denied',
      message:           "Your #{request.request_type} request was denied. Reason: #{request.admin_notes&.truncate(100)}",
      category:          'status',
      notification_type: 'status_denied',
      priority:          'normal',
      action_url:        '/client/service-requests',
      metadata:          { request_id: request.id }
    )
    AuditLog.log(user: admin, action: 'status_request_denied',
                 resource: request, details: "User: #{request.user.display_name}")
  end

  # 3.2 Row 9: Admin responds to ticket → notify client on Track Tickets
  def self.on_ticket_updated(ticket, admin, message)
    Notification.create!(
      user_id:           ticket.user_id,
      title:             "Ticket Update: #{ticket.subject.truncate(50)}",
      message:           "Admin replied to your ticket: #{message.truncate(100)}",
      category:          'support',
      notification_type: 'ticket_update',
      priority:          'normal',
      action_url:        '/client/track-tickets',
      metadata:          { ticket_id: ticket.id }
    )
    AuditLog.log(user: admin, action: 'ticket_responded',
                 resource: ticket, details: "Message: #{message.truncate(80)}")
  end

  # 3.2 Row 9b: Admin closes/resolves ticket → notify client
  def self.on_ticket_resolved(ticket, admin)
    Notification.create!(
      user_id:           ticket.user_id,
      title:             'Ticket Resolved',
      message:           "Your ticket \"#{ticket.subject}\" has been resolved. #{ticket.resolution_notes&.truncate(80)}",
      category:          'support',
      notification_type: 'ticket_resolved',
      priority:          'normal',
      action_url:        '/client/track-tickets',
      metadata:          { ticket_id: ticket.id }
    )
    AuditLog.log(user: admin, action: 'ticket_resolved',
                 resource: ticket, details: "User: #{ticket.user.display_name}")
  end

  # ─────────────────────────────────────────────────────────────────────────────
  # SECTION 3.2 — Additional admin→client flows not in the table but in the doc
  # ─────────────────────────────────────────────────────────────────────────────

  # Anomaly detected → notify client via Leak Alerts
  def self.on_anomaly_detected(anomaly)
    return unless anomaly.user_id
    Notification.create!(
      user_id:           anomaly.user_id,
      title:             'Unusual Water Usage Detected',
      message:           "We detected unusual consumption on your connection. #{anomaly.description}. Please check for leaks.",
      category:          'alert',
      notification_type: 'leak_alert',
      priority:          anomaly.severity == 'critical' ? 'high' : 'normal',
      action_url:        '/client/leak-alerts',
      metadata:          { anomaly_id: anomaly.id, severity: anomaly.severity }
    )
  end

  # Valve closed in zone → notify affected clients
  def self.on_valve_closed(valve, admin)
    return unless valve.zone.present?
    Connection.where(zone: valve.zone, connection_status: 'active').find_each do |conn|
      Notification.create!(
        user_id:           conn.user_id,
        title:             'Water Supply Interruption',
        message:           "Water supply in Zone #{valve.zone} has been interrupted. Reason: #{valve.reason}. Expected restoration: #{valve.scheduled_reopen_at&.strftime('%b %d at %H:%M') || 'TBD'}.",
        category:          'service',
        notification_type: 'supply_interruption',
        priority:          'high',
        action_url:        '/client/announcements',
        metadata:          { valve_id: valve.id, zone: valve.zone }
      )
    end
    AuditLog.log(user: admin, action: 'valve_closed',
                 resource: valve, details: "Zone: #{valve.zone}, Reason: #{valve.reason}")
  end

  # Maintenance scheduled → announce to clients in affected zone
  def self.on_maintenance_scheduled(schedule, admin)
    Announcement.create!(
      title:           "Planned Maintenance: #{schedule.asset.asset_name}",
      content:         "Maintenance scheduled for #{schedule.scheduled_date.strftime('%B %d, %Y')}. Type: #{schedule.maintenance_type}. #{schedule.description}",
      category:        'maintenance',
      priority:        'normal',
      target_audience: 'all',
      published:       true,
      created_by:      admin
    )
    AuditLog.log(user: admin, action: 'maintenance_scheduled',
                 resource: schedule, details: "Asset: #{schedule.asset.asset_name}, Date: #{schedule.scheduled_date}")
  end

  # Dunning action sent → notify client
  def self.on_dunning_sent(dunning_action)
    Notification.create!(
      user_id:           dunning_action.user_id,
      title:             'Payment Reminder',
      message:           dunning_action.message,
      category:          'billing',
      notification_type: 'dunning',
      priority:          dunning_action.action_type == 'final_notice' ? 'high' : 'normal',
      action_url:        '/client/current-bill',
      metadata:          { invoice_id: dunning_action.invoice_id, action_type: dunning_action.action_type }
    )
  end

  # Subsidy approved → notify client
  def self.on_subsidy_approved(subsidy, admin)
    Notification.create!(
      user_id:           subsidy.user_id,
      title:             'Subsidy Approved',
      message:           "A #{subsidy.subsidy_type.humanize} subsidy of KES #{subsidy.amount} has been approved for your account.",
      category:          'billing',
      notification_type: 'subsidy',
      priority:          'normal',
      action_url:        '/client/current-bill',
      metadata:          { subsidy_id: subsidy.id }
    )
    AuditLog.log(user: admin, action: 'subsidy_approved',
                 resource: subsidy, details: "Amount: #{subsidy.amount}, User: #{subsidy.user.display_name}")
  end

  # Refund approved → notify client
  def self.on_refund_approved(refund, admin)
    Notification.create!(
      user_id:           refund.user_id,
      title:             'Refund Approved',
      message:           "Your refund of KES #{refund.amount} has been approved. Reference: #{refund.reference_number}.",
      category:          'billing',
      notification_type: 'refund',
      priority:          'normal',
      action_url:        '/client/payment-history',
      metadata:          { refund_id: refund.id, amount: refund.amount }
    )
    AuditLog.log(user: admin, action: 'refund_approved',
                 resource: refund, details: "Amount: #{refund.amount}, User: #{refund.user.display_name}")
  end
end
