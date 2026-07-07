# FlutterwaveService — Bank/Card payment via Flutterwave (Rave)
#
# Configuration (ENV):
#   FLW_SECRET_KEY   — Flutterwave secret key
#   FLW_PUBLIC_KEY   — Flutterwave public key (used in frontend)
#   FLW_REDIRECT_URL — https://yourdomain.com/client/payment-callback
#   FLW_ENV          — "sandbox" | "production"
class FlutterwaveService
  BASE_URL = "https://api.flutterwave.com/v3"

  class FlutterwaveError < StandardError; end

  def initialize
    @secret_key   = ENV["FLW_SECRET_KEY"]
    @redirect_url = ENV.fetch("FLW_REDIRECT_URL", "https://example.com/client/payment-callback")
  end

  # Create a payment link for card / bank transfer
  # Returns a hosted checkout URL that the client opens in browser
  def create_payment_link(user:, invoice:, amount:, currency: "KES")
    payload = {
      tx_ref:          "FLW-INV-#{invoice.id}-#{Time.current.to_i}",
      amount:          amount.to_f,
      currency:        currency,
      redirect_url:    @redirect_url,
      payment_options: "card,banktransfer,mpesa",
      customer: {
        email:       user.email,
        phonenumber: user.phone.to_s.gsub(/\D/, ""),
        name:        user.display_name
      },
      customizations: {
        title:       "Village Water System",
        description: "Payment for Invoice #{invoice.invoice_number}",
        logo:        ""
      },
      meta: {
        invoice_id: invoice.id,
        user_id:    user.id
      }
    }

    response = http_post("/payments", payload)

    if response["status"] == "success"
      {
        success:      true,
        payment_link: response.dig("data", "link"),
        tx_ref:       payload[:tx_ref]
      }
    else
      raise FlutterwaveError, response["message"] || "Failed to create payment link"
    end
  end

  # Verify a completed transaction by transaction_id
  def verify_transaction(transaction_id)
    uri = URI("#{BASE_URL}/transactions/#{transaction_id}/verify")
    req = Net::HTTP::Get.new(uri, auth_headers)
    res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |h| h.request(req) }
    body = JSON.parse(res.body)

    data = body["data"] || {}
    if body["status"] == "success" && data["status"] == "successful"
      {
        success:        true,
        transaction_id: data["id"],
        tx_ref:         data["tx_ref"],
        amount:         data["amount"],
        currency:       data["currency"],
        payment_type:   data["payment_type"],
        customer_email: data.dig("customer", "email"),
        flw_ref:        data["flw_ref"],
        charged_amount: data["charged_amount"]
      }
    else
      {
        success: false,
        status:  data["status"],
        message: body["message"] || "Transaction verification failed"
      }
    end
  end

  # Parse Flutterwave webhook payload
  def self.parse_webhook(params)
    event = params["event"]
    data  = params["data"] || {}

    if event == "charge.completed" && data["status"] == "successful"
      {
        success:        true,
        transaction_id: data["id"].to_s,
        tx_ref:         data["tx_ref"],
        amount:         data["amount"],
        currency:       data["currency"],
        customer_email: data.dig("customer", "email"),
        payment_type:   data["payment_type"],
        meta:           data["meta"]
      }
    else
      { success: false, event: event, status: data["status"] }
    end
  end

  private

  def auth_headers
    { "Authorization" => "Bearer #{@secret_key}", "Content-Type" => "application/json" }
  end

  def http_post(path, payload)
    uri = URI("#{BASE_URL}#{path}")
    req = Net::HTTP::Post.new(uri, auth_headers)
    req.body = payload.to_json
    res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |h| h.request(req) }
    JSON.parse(res.body)
  rescue JSON::ParserError => e
    raise FlutterwaveError, "Invalid Flutterwave response: #{e.message}"
  end
end
