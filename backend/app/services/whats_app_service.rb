# src/services/whatsapp_service.rb
# -------------------------------------------------
#  Required env vars (already exported in ~/.zshrc):
#    WHATSAPP_TOKEN        – long‑lived System‑User token
#    WHATSAPP_PHONE_ID     – the Phone‑Number‑ID of your verified WhatsApp number
#    WHATSAPP_VERIFY_TOKEN – token you set on the webhook config page
# -------------------------------------------------

require 'net/http'
require 'uri'
require 'json'

class WhatsAppService
  # All values are read **once** when the class is loaded.
  API_VERSION = ENV.fetch('WHATSAPP_API_VERSION', 'v19.0')
  PHONE_NUMBER_ID = ENV.fetch('WHATSAPP_PHONE_NUMBER_ID')
  TOKEN                 = ENV.fetch('WHATSAPP_TOKEN')
  VERIFY_TOKEN          = ENV.fetch('WHATSAPP_VERIFY_TOKEN') # only needed for webhook verification

  # -----------------------------------------------------------------
  # Send a plain‑text WhatsApp message.
  #   - to:    phone number **without** the leading '+' (e.g. "254704363704")
  #   - body:  the text you want to send (max 1024 chars for plain text)
  # Returns the JSON hash that Facebook returns on success.
  # Raises a StandardError with the API error body if something goes wrong.
  # -----------------------------------------------------------------
  def self.send_text(to:, body:)
    uri = URI("https://graph.facebook.com/#{API_VERSION}/#{PHONE_NUMBER_ID}/messages")
    request = Net::HTTP::Post.new(uri)

    # ----- Build the JSON payload -----
    payload = {
      messaging_product: 'whatsapp',
      to:               to,                 # keep the leading '+' off – API expects just digits
      type:             'text',
      text: {
        body: body
      }
    }.to_json

    # ----- Build the HTTP request -----
    request['Authorization'] = "Bearer #{TOKEN}"
    request['Content-Type']  = 'application/json'

    # ----- Execute the request -----
    http = Net::HTTP.new(uri.host, uri.port)
    request['Authorization'] = "Bearer #{TOKEN}"
    request.body = payload

    response = Net::HTTP.start(uri.host, uri.port, use_ssl: true) do |http|
      http.request(request)
    end

    # ----- Raise an error if Facebook returned something other than 200 -----
    unless response.is_a?(Net::HTTPSuccess)
      raise "WhatsApp API error (HTTP #{response.code}): #{response.body}"
    end

    # Return the parsed JSON so the caller can see the message_id, etc.
    JSON.parse(response.body)
  end
end

# -----------------------------------------------------------------
# QUICK‑TEST (run this file directly to see it work):
#   ruby -e 'require "open-uri"; puts WhatsAppService.send_text("254704363704", "Hello from the Village Water System!")'
# -----------------------------------------------------------------