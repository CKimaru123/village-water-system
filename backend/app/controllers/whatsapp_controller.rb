# # app/controllers/whatsapp_controller.rb
# class WhatsappController < ApplicationController
#   # protect_from_forgery with: :null_session   # <-- needed for POST from Meta
#   skip_before_action :verify_authenticity_token

#   # -------------------------------------------------
#   # 1️⃣  Verification handshake (GET)
#   # -------------------------------------------------
#   get '/webhooks/whatsapp' do
#     # Facebook sends `hub.verify_token` as a query‑param.
#     if params['hub.verify_token'] == ENV['WHATSAPP_VERIFY_TOKEN']
#       # Return the challenge string so Facebook knows we are legit
#       render plain: params['hub.challenge']
#     else
#       head :forbidden
#     end
#   end

#   # -------------------------------------------------
#   # 2️⃣  Receive inbound messages / status updates (POST)
#   # -------------------------------------------------
#   post '/webhooks/whatsapp' do
#     # ---- 1️⃣ Verify the challenge token again (extra safety) ----
#     halt 403 unless params['hub.verify_token'] == ENV['WHATSAPP_VERIFY_TOKEN']

#     # Parse the incoming JSON payload
#     begin
#       payload = JSON.parse(request.body.read)
#     rescue
#       head 400
#       return
#     end

#     # -------------------------------------------------
#     # 3️⃣  Process each incoming message
#     # -------------------------------------------------
#     (payload['entry'] || []).each do |entry|
#       (entry['changes'] || []).each do |change|
#         change_value = change['value']

#         # ---- Inbound messages (the most common case) ----
#         if change['field'] == 'messages'
#           change_value = change_value['messages']
#           value        = change_value || {}
#           value.each do |msg|
#             process_incoming_message(msg)
#           end
#         end

#         # ---- Status updates (delivered, read, failed) ----
#         if change['field'] == 'message_statuses'
#           change_value['statuses'].each do |status|
#             handle_status_update(status)
#           end
#         end
#       end
#     end

#     # Facebook expects a 200 OK quickly
#     render plain: 'EVENT_RECEIVED'
#   end

#   # -------------------------------------------------
#   # 4️⃣  Helper – store/reply to an incoming message
#   # -------------------------------------------------
#   private

#   def process_incoming_message(msg)
#     sender    = msg['from']                     # E.164 number, e.g., "+254704363704"
#     msg_type  = msg['type']                     # "text", "image", "audio", etc.
#     body      = msg.dig('text', 'body')         # only present for type == 'text'
#     msg_id    = msg['id']

#     # ✅ CORRECT
#     InboundMessage.create!(
#       client:        Client.find_by(phone: sender.delete('+')),
#       wa_message_id: msg_id,
#       body:          msg_type == 'text' ? msg['text']['body'] : nil,
#       direction:     'INBOUND',
#       received_at:   Time.now
#     )  # <--- CHANGED TO ')'

#     # OPTIONAL: auto‑reply logic (example – always reply with a canned text)
#     if msg_type == 'text' && msg['text'].present?
#       reply_body = "You said: #{msg['text']['body']}"
#       reply_to   = msg['from']           # the sender's phone number
#       WhatsAppService.send_text(to: reply_to, body: reply_body)
#     end
#   end

#   # -------------------------------------------------
#   # 5️⃣  Optional – handle status updates (delivered / read / failed)
#   # -------------------------------------------------
#   def handle_status_update(status)
#     message_id = status['id']
#     status_val = status['status']   # "sent", "delivered", "read", "failed"
#     recipient  = status['recipient_id']

#             # Store the status if you need an audit trail
#             # Example: Update your InboundMessage record where message_id = status_id
#             # Message.where(wa_message_id: message_id).update(status: status_val)

#             Rails.logger.info "[WhatsApp Status] #{message_id} → #{status_val} (to #{recipient})"
#   end
# end




# # Vesion 2
# # backend/app/controllers/whatsapp_controller.rb
# class WhatsappController < ApplicationController
#   # CRITICAL: Disables CSRF protection so Meta/WhatsApp can send POST requests
#   # skip_before_action :verify_authenticity_token    Commented this line
#   # (API mode doesn't have this by default, so skipping it causes a crash)

#   # -------------------------------------------------
#   # 1️⃣ Single action to handle BOTH GET (verification) and POST (messages)
#   # -------------------------------------------------
#   def webhook
#     # --- Handle GET verification from Meta ---
#     if request.get?
#       if params['hub.verify_token'] == ENV['WHATSAPP_VERIFY_TOKEN']
#         render plain: params['hub.challenge']
#       else
#         render plain: 'Forbidden', status: :forbidden
#       end
#       return
#     end

#     # --- Handle POST inbound messages / status updates ---
#     begin
#       # Rails automatically parses JSON into params, but we fallback to body read just in case
#       payload = params.presence || JSON.parse(request.body.read)
#     rescue JSON::ParserError
#       render plain: 'Bad Request', status: :bad_request
#       return
#     end

#     # Process each entry in the payload
#     (payload['entry'] || []).each do |entry|
#       (entry['changes'] || []).each do |change|
#         change_value = change['value'] || {}

#         # ---- Inbound messages ----
#         if change['field'] == 'messages'
#           messages = change_value['messages'] || []
#           messages.each do |msg|
#             process_incoming_message(msg)
#           end
#         end

#         # ---- Status updates (delivered, read, failed) ----
#         # Note: WhatsApp uses 'statuses', not 'message_statuses'
#         if change['field'] == 'statuses'
#           statuses = change_value['statuses'] || []
#           statuses.each do |status|
#             handle_status_update(status)
#           end
#         end
#       end
#     end

#     # Facebook/Meta expects a 200 OK response quickly
#     render plain: 'EVENT_RECEIVED'
#   end

#   # -------------------------------------------------
#   # 2️⃣ Helper methods (Must be under 'private')
#   # -------------------------------------------------
#   private

#   def process_incoming_message(msg)
#     sender    = msg['from']                     # E.164 number, e.g., "+254704363704"
#     msg_type  = msg['type']                     # "text", "image", "audio", etc.
#     msg_id    = msg['id']

#     # Store the inbound message
#     InboundMessage.create!(
#       client:        Client.find_by(phone: sender.delete('+')),
#       wa_message_id: msg_id,
#       body:          msg_type == 'text' ? msg.dig('text', 'body') : nil,
#       direction:     'INBOUND',
#       received_at:   Time.now
#     )

#     # OPTIONAL: auto-reply logic
#     if msg_type == 'text' && msg.dig('text', 'body').present?
#       reply_body = "You said: #{msg['text']['body']}"
#       reply_to   = msg['from']
      
#       # Ensure WhatsAppService is defined and available
#       WhatsAppService.send_text(to: reply_to, body: reply_body) if defined?(WhatsAppService)
#     end
#   end

#   def handle_status_update(status)
#     message_id = status['id']
#     status_val = status['status']   # "sent", "delivered", "read", "failed"
#     recipient  = status['recipient_id']

#     # Optional: Update your Message record status here
#     # Message.where(wa_message_id: message_id).update(status: status_val)

#     Rails.logger.info "[WhatsApp Status] #{message_id} → #{status_val} (to #{recipient})"
#   end
# end



# Version 3
class WhatsappController < ActionController::API
  # Meta sends raw POST requests — no CSRF token
  # skip_before_action :authenticate_request, raise: false
  # skip_before_action :verify_authenticity_token, raise: false

  # Inherit directly from ActionController::API — bypasses all ApplicationController
  # before_actions including authenticate_request. Meta needs open access to this endpoint.

  # GET /api/v1/webhooks/whatsapp
  # Meta calls this to verify the webhook during setup
  def verify
    if params['hub.verify_token'] == ENV['WHATSAPP_VERIFY_TOKEN']
      render plain: params['hub.challenge']
    else
      Rails.logger.warn "[WhatsApp] Webhook verification failed — token mismatch"
      render plain: 'Forbidden', status: :forbidden
    end
  end

  # POST /api/v1/webhooks/whatsapp
  # Meta calls this for every inbound message and status update
  def receive
    payload = JSON.parse(request.body.read) rescue {}

    (payload['entry'] || []).each do |entry|
      (entry['changes'] || []).each do |change|
        value = change['value'] || {}

        # Inbound messages
        (value['messages'] || []).each do |msg|
          process_incoming_message(msg, value['metadata'])
        end

        # Delivery / read status updates
        (value['statuses'] || []).each do |status|
          Rails.logger.info "[WhatsApp] Status update — id=#{status['id']} status=#{status['status']} to=#{status['recipient_id']}"
        end
      end
    end

    # Meta expects a fast 200 OK
    render plain: 'EVENT_RECEIVED'
  end

  private

  def process_incoming_message(msg, metadata)
    sender   = msg['from']               # E.164 without '+', e.g. "254704363704"
    msg_type = msg['type']               # "text", "image", etc.
    body     = msg.dig('text', 'body')
    msg_id   = msg['id']

    Rails.logger.info "[WhatsApp] Inbound message from=#{sender} type=#{msg_type} id=#{msg_id} body=#{body}"

    # Find the user by phone number (try with and without country code prefix)
    user = User.find_by(phone: sender) || User.find_by(phone: "+#{sender}")

    if user.nil?
      Rails.logger.warn "[WhatsApp] No user found for phone=#{sender}"
      return
    end

    # Store the message as a chat message so it appears in the admin chat view
    if msg_type == 'text' && body.present?
      ChatMessage.create!(
        user: user,
        message: body,
        direction: 'inbound',
        channel: 'whatsapp',
        external_id: msg_id
      )
    end

    Rails.logger.info "[WhatsApp] Message stored for user=#{user.id}"
  end
end
