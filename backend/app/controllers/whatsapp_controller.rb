# app/controllers/whatsapp_controller.rb
class WhatsappController < ApplicationController
  # protect_from_forgery with: :null_session   # <-- needed for POST from Meta
  # skip_before_action :verify_authenticity_token

  # -------------------------------------------------
  # 1️⃣  Verification handshake (GET)
  # -------------------------------------------------
  get '/webhooks/whatsapp' do
    # Facebook sends `hub.verify_token` as a query‑param.
    if params['hub.verify_token'] == ENV['WHATSAPP_VERIFY_TOKEN']
      # Return the challenge string so Facebook knows we are legit
      render plain: params['hub.challenge']
    else
      head :forbidden
    end
  end

  # -------------------------------------------------
  # 2️⃣  Receive inbound messages / status updates (POST)
  # -------------------------------------------------
  post '/webhooks/whatsapp' do
    # ---- 1️⃣ Verify the challenge token again (extra safety) ----
    halt 403 unless params['hub.verify_token'] == ENV['WHATSAPP_VERIFY_TOKEN']

    # Parse the incoming JSON payload
    begin
      payload = JSON.parse(request.body.read)
    rescue
      head 400
      return
    end

    # -------------------------------------------------
    # 3️⃣  Process each incoming message
    # -------------------------------------------------
    (payload['entry'] || []).each do |entry|
      (entry['changes'] || []).each do |change|
        change_value = change['value']

        # ---- Inbound messages (the most common case) ----
        if change['field'] == 'messages'
          change_value = change_value['messages']
          value        = change_value || {}
          value.each do |msg|
            process_incoming_message(msg)
          end
        end

        # ---- Status updates (delivered, read, failed) ----
        if change['field'] == 'message_statuses'
          change_value['statuses'].each do |status|
            handle_status_update(status)
          end
        end
      end
    end

    # Facebook expects a 200 OK quickly
    render plain: 'EVENT_RECEIVED'
  end

  # -------------------------------------------------
  # 4️⃣  Helper – store/reply to an incoming message
  # -------------------------------------------------
  private

  def process_incoming_message(msg)
    sender    = msg['from']                     # E.164 number, e.g., "+254704363704"
    msg_type  = msg['type']                     # "text", "image", "audio", etc.
    body      = msg.dig('text', 'body')         # only present for type == 'text'
    msg_id    = msg['id']

    # ✅ CORRECT
    InboundMessage.create!(
      client:        Client.find_by(phone: sender.delete('+')),
      wa_message_id: msg_id,
      body:          msg_type == 'text' ? msg['text']['body'] : nil,
      direction:     'INBOUND',
      received_at:   Time.now
    )  # <--- CHANGED TO ')'

    # OPTIONAL: auto‑reply logic (example – always reply with a canned text)
    if msg_type == 'text' && msg['text'].present?
      reply_body = "You said: #{msg['text']['body']}"
      reply_to   = msg['from']           # the sender's phone number
      WhatsAppService.send_text(to: reply_to, body: reply_body)
    end
  end

  # -------------------------------------------------
  # 5️⃣  Optional – handle status updates (delivered / read / failed)
  # -------------------------------------------------
  def handle_status_update(status)
    message_id = status['id']
    status_val = status['status']   # "sent", "delivered", "read", "failed"
    recipient  = status['recipient_id']

            # Store the status if you need an audit trail
            # Example: Update your InboundMessage record where message_id = status_id
            # Message.where(wa_message_id: message_id).update(status: status_val)

            Rails.logger.info "[WhatsApp Status] #{message_id} → #{status_val} (to #{recipient})"
  end
end