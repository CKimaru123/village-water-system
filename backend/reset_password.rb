user = User.find_by(email: 'kiragucollins@gmail.com')
if user
  user.password = 'Password123!'
  user.password_confirmation = 'Password123!'
  if user.save
    puts "✅ Password reset for #{user.email}"
    puts "   New password: Password123!"
  else
    puts "❌ Failed: #{user.errors.full_messages.join(', ')}"
  end
else
  puts "❌ User not found: kiragucollins@gmail.com"
end
