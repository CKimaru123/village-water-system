# MpesaService — Safaricom Daraja API (STK Push / Lipa Na M-Pesa Online)
#
# Configuration (set in credentials or ENV):
#   MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET
#   MPESA_SHORTCODE       — Business shortcode
#   MPESA_PASSKEY         — Lipa Na M-Pesa passkey
#   MPESA_CALLBACK_URL    — https://yourdomain.com/api/v1/payments/mpesa_callback
#   MPESA_ENV             — "sandbox" | "production"
class MpesaService
  SANDBOX_BASE  = "https://sandbox.safaricom.co.ke"
  PROD_BASE     = "https://api.safaricom.co.ke"

  class MpesaError < StandardError; end

  def initialize
    @env        = ENV.fetch("MPESA_ENV", "sandbox")
    @base_url   = @env == "production" ? PROD_BASE : SANDBOX_BASE
    @consumer_key    = ENV["MPESA_CONSUMER_KEY"]
    @consumer_secret = ENV["MPESA_CONSUMER_SECRET"]
    @shortcode  = ENV.fetch("MPESA_SHORTCODE", "174379")   # Daraja sandbox default
    @passkey    = ENV.fetch("MPESA_PASSKEY", "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919")
    @callback_url = ENV.fetch("MPESA_CALLBACK_URL", "https://example.com/api/v1/payments/mpesa_callback")
  end

  # Initiate STK Push (Lipa Na M-Pesa Online)
  # phone_number: "2547XXXXXXXX" (international format, no +)
  # amount:       integer KES
  # account_ref:  invoice number or account number
  # description:  short description shown to user
  def stk_push(phone_number:, amount:, account_ref:, description: "Water Bill Payment")
    token = access_token
    timestamp = Time.current.strftime("%Y%m%d%H%M%S")
    password  = Base64.strict_encode64("#{@shortcode}#{@passkey}#{timestamp}")

    payload = {
      BusinessShortCode: @shortcode,
      Password:          password,
      Timestamp:         timestamp,
      TransactionType:   "CustomerPayBillOnline",
      Amount:            amount.to_i,
      PartyA:            phone_number,
      PartyB:            @shortcode,
      PhoneNumber:       phone_number,
      CallBackURL:       @callback_url,
      AccountReference:  account_ref.to_s.truncate(12),
      TransactionDesc:   description.to_s.truncate(13)
    }

    response = http_post("/mpesa/stkpush/v1/processrequest", payload, token)

    if response["ResponseCode"] == "0"
      {
        success:              true,
        checkout_request_id:  response["CheckoutRequestID"],
        merchant_request_id:  response["MerchantRequestID"],
        response_description: response["ResponseDescription"],
        customer_message:     response["CustomerMessage"]
      }
    else
      raise MpesaError, response["errorMessage"] || response["ResponseDescription"] || "STK Push failed"
    end
  end

  # Query STK Push transaction status
  def stk_query(checkout_request_id)
    token = access_token
    timestamp = Time.current.strftime("%Y%m%d%H%M%S")
    password  = Base64.strict_encode64("#{@shortcode}#{@passkey}#{timestamp}")

    payload = {
      BusinessShortCode: @shortcode,
      Password:          password,
      Timestamp:         timestamp,
      CheckoutRequestID: checkout_request_id
    }

    http_post("/mpesa/stkpushquery/v1/query", payload, token)
  end

  # Parse incoming M-Pesa STK callback payload
  def self.parse_callback(params)
    body = params.dig("Body", "stkCallback") || {}
    result_code = body["ResultCode"]
    result_desc = body["ResultDesc"]
    checkout_request_id = body["CheckoutRequestID"]
    merchant_request_id = body["MerchantRequestID"]

    if result_code.to_i == 0
      items = (body.dig("CallbackMetadata", "Item") || [])
              .each_with_object({}) { |item, h| h[item["Name"]] = item["Value"] }
      {
        success:              true,
        checkout_request_id:  checkout_request_id,
        merchant_request_id:  merchant_request_id,
        amount:               items["Amount"],
        mpesa_receipt_number: items["MpesaReceiptNumber"],
        transaction_date:     items["TransactionDate"],
        phone_number:         items["PhoneNumber"]
      }
    else
      {
        success:              false,
        checkout_request_id:  checkout_request_id,
        result_code:          result_code,
        result_description:   result_desc
      }
    end
  end

  private

  def access_token
    uri = URI("#{@base_url}/oauth/v1/generate?grant_type=client_credentials")
    req = Net::HTTP::Get.new(uri)
    req.basic_auth(@consumer_key, @consumer_secret)

    res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true, verify_mode: OpenSSL::SSL::VERIFY_PEER) { |h| h.request(req) }
    body = JSON.parse(res.body)
    raise MpesaError, "Failed to get M-Pesa access token: #{body['errorMessage']}" unless body["access_token"]

    body["access_token"]
  end

  def http_post(path, payload, token)
    uri = URI("#{@base_url}#{path}")
    req = Net::HTTP::Post.new(uri, "Content-Type" => "application/json", "Authorization" => "Bearer #{token}")
    req.body = payload.to_json

    res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true, verify_mode: OpenSSL::SSL::VERIFY_PEER) { |h| h.request(req) }
    JSON.parse(res.body)
  rescue JSON::ParserError => e
    raise MpesaError, "Invalid M-Pesa API response: #{e.message}"
  end
end
