namespace :db do
  desc "Check contacts in database"
  task check_contacts: :environment do
    puts "=== CONTACTS DATABASE CHECK ==="
    puts "Total contacts: #{Contact.count}"
    puts ""
    
    if Contact.count > 0
      puts "Recent contacts:"
      Contact.order(created_at: :desc).limit(10).each_with_index do |contact, index|
        puts "#{index + 1}. #{contact.name} (#{contact.email})"
        puts "   Subject: #{contact.subject}"
        puts "   Status: #{contact.status}"
        puts "   Created: #{contact.created_at}"
        puts "   Message: #{contact.message[0..100]}#{'...' if contact.message.length > 100}"
        puts "   Phone: #{contact.phone || 'Not provided'}"
        puts "   IP: #{contact.ip_address || 'Not recorded'}"
        puts ""
      end
    else
      puts "No contacts found in database."
      puts ""
      puts "To test the contact form:"
      puts "1. Go to the frontend contact page"
      puts "2. Fill out and submit the form"
      puts "3. Run this task again to see the data"
    end
    
    puts "=== END CHECK ==="
  end
end