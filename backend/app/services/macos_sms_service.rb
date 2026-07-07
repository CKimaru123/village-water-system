require 'open3'

class MacosSmsService
  class << self
    def configured?
      return false if ENV['AUTOSCRIPT_API_KEY'].to_s.strip.empty?
      return false if script_path.to_s.strip.empty?
      File.exist?(script_path)
    end

    def send_sms(to:, body:, from: nil)
      raise 'macOS SMS is not configured' unless configured?
      raise 'Destination phone number is required' if to.to_s.strip.empty?

      command = [python_executable, script_path, '--phone', normalize_phone(to), '--message', body.to_s.strip, '--api-key', ENV['AUTOSCRIPT_API_KEY'].to_s.strip]
      stdout, stderr, status = Open3.capture3(*command)

      unless status.success?
        error_message = stderr.to_s.strip.presence || stdout.to_s.strip.presence || 'Unknown macOS SMS error'
        raise "macOS SMS failed: #{error_message}"
      end

      stdout.to_s.strip
    end

    private

    def python_executable
      ENV['AUTOSCRIPT_PYTHON'].to_s.strip.presence || 'python3'
    end

    def script_path
      ENV['AUTOSCRIPT_SCRIPT_PATH'].to_s.strip.presence || default_script_path
    end

    def default_script_path
      if defined?(Rails) && Rails.respond_to?(:root)
        Rails.root.join('scripts', 'send_sms_via_macos.py').to_s
      else
        File.expand_path('../../scripts/send_sms_via_macos.py', __dir__)
      end
    end

    def normalize_phone(phone_number)
      cleaned = phone_number.to_s.gsub(/\D/, '')

      if cleaned.start_with?('254') && cleaned.length == 12
        "+#{cleaned}"
      elsif cleaned.start_with?('0') && cleaned.length == 10
        "+254#{cleaned[1..-1]}"
      elsif cleaned.length == 9 && cleaned.start_with?('7')
        "+254#{cleaned}"
      elsif cleaned.start_with?('+')
        phone_number.to_s
      else
        phone_number.to_s
      end
    end
  end
end
