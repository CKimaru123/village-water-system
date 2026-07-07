# AirtelMoneyService — Airtel Money Kenya (Airtel Africa API)
#
# Configuration (ENV):
#   AIRTEL_CLIENT_ID, AIRTEL_CLIENT_SECRET
#   AIRTEL_ENV            — "sandbox" | "production"
#   AIRTEL_CALLBACK_URL   — https://yourdomain.com/api/v1/payments/airtel_callback
#   AIRTEL_COUNTRY        — "KE" (Kenya)
#   AIRTEL_CURRENCY       — "KES"
class AirtelMoneyService
  SANDBOX_BASE = "https://openapiuat.airtel.africa"
  PROD_BASE    = "https://openapi.airtel.africa"

  class AirtelError < StandardError; end

  def initialize
    @env          = ENV.fetch("AIRTEL_ENV", "sandbox")
    @base_url     = @env == "production" ? PROD_BASE : SANDBOX_BASE
    @client_id     = ENV["AIRTEL_CLIENT_ID"]
    @client_secret = ENV["AIRTEL_CLIENT_SECRET"]
    @callback_url  = ENV.fetch("AIRTEL_CALLBACK_URL", "https://example.com/api/v1/payments/airtel_callback")
    @country       = ENV.fetch("AIRTEL_COUNTRY", "KE")
    @currency      = ENV.fetch("AIRTEL_CURRENCY", "KES")
  end

  # Initiate a payment collection (USSDPush)
  # phone_number: "2547XXXXXXXX"
  # amount:       numeric KES
  # reference:    unique transaction reference (invoice number)
  def collect(phone_number:, amount:, reference:)
    token = access_token

    payload = {
      reference: reference.to_s.truncate(20),
      subscriber: {
        country:  @country,
        currency: @currency,
        msisdn:   phone_number
      },
      transaction: {
        amount:   amount.to_f,
        country:  @country,
        currency: @currency,
        id:       reference.to_s.truncate(20)
      }
    }

    response = http_post("/merchant/v1/payments/", payload, token)

    if response.dig("status", "success") == true || response.dig("data", "transaction", "status") == "TS"
      {
        success:         true,
        transaction_id:  response.dig("data", "transaction", "id"),
        status:          response.dig("data", "transaction", "status"),
        message:         response.dig("status", "message") || "Payment initiated"
      }
    else
      msg = response.dig("status", "message") || "Airtel Money payment initiation failed"
      raise AirtelError, msg
    end
  end

  # Query transaction status
  def transaction_status(transaction_id)
    token = access_token
    uri = URI("#{@base_url}/standard/v1/payments/#{transaction_id}")
    req = Net::HTTP::Get.new(uri, auth_headers(token))
    res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |h| h.request(req) }
    JSON.parse(res.body)
  end

  # Parse Airtel Money callback
  def self.parse_callback(params)
    transaction = params.dig("transaction") || {}
    status = transaction["status"]

    if status == "TS" # Transaction Success
      {
        success:        true,
        transaction_id: transaction["id"],
        amount:         transaction["amount"],
        phone_number:   transaction["msisdn"],
        message:        "Payment successful"
      }
    else
      {
        success:        false,
        transaction_id: transaction["id"],
        status:         status,
        message:        transaction["message"] || "Payment failed or pending"
      }
    end
  end

  private

  def access_token
    uri = URI("#{@base_url}/auth/oauth2/token")
    req = Net::HTTP::Post.new(uri, "Content-Type" => "application/json")
    req.body = { client_id: @client_id, client_secret: @client_secret, grant_type: "client_credentials" }.to_json

    res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |h| h.request(req) }
    body = JSON.parse(res.body)
    raise AirtelError, "Failed to get Airtel access token" unless body["access_token"]

    body["access_token"]
  end

  def auth_headers(token)
    {
      "Content-Type"  => "application/json",
      "Authorization" => "Bearer #{token}",
      "X-Country"     => @country,
      "X-Currency"    => @currency
    }
  end

  def http_post(path, payload, token)
    uri = URI("#{@base_url}#{path}")
    req = Net::HTTP::Post.new(uri, auth_headers(token))
    req.body = payload.to_json

    res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |h| h.request(req) }
    JSON.parse(res.body)
  rescue JSON::ParserError => e
    raise AirtelError, "Invalid Airtel API response: #{e.message}"
  end
end
