class TwilioSmsService
  class << self
    def configured?
      ENV['TWILIO_ACCOUNT_SID'].to_s.strip != '' && ENV['TWILIO_AUTH_TOKEN'].to_s.strip != '' && (ENV['TWILIO_FROM_PHONE'].to_s.strip != '' || ENV['TWILIO_MESSAGING_SERVICE_SID'].to_s.strip != '')
    end

    def send_sms(to:, body:, from: nil)
      raise 'Twilio is not configured' unless configured?
      raise 'Destination phone number is required' if to.to_s.strip == ''

      params = {
        to: normalize_phone(to),
        body: body.to_s.strip
      }

      params[:from] = from.to_s.strip != '' ? from.to_s.strip : ENV['TWILIO_FROM_PHONE'].to_s.strip
      params[:messaging_service_sid] = ENV['TWILIO_MESSAGING_SERVICE_SID'].to_s.strip unless ENV['TWILIO_MESSAGING_SERVICE_SID'].to_s.strip == ''

      client.messages.create(params)
    end

    private

    def client
      @client ||= Twilio::REST::Client.new(
        ENV.fetch('TWILIO_ACCOUNT_SID'),
        ENV.fetch('TWILIO_AUTH_TOKEN')
      )
    end

    def normalize_phone(phone_number)
      cleaned = phone_number.to_s.gsub(/\D/, '')

      if cleaned.start_with?('254') && cleaned.length == 12
        "+#{cleaned}"
      elsif cleaned.start_with?('0') && cleaned.length == 10
        "+254#{cleaned[1..] }"
      elsif cleaned.length == 9 && cleaned.start_with?('7')
        "+254#{cleaned}"
      else
        phone_number.to_s
      end
    end
  end
end
