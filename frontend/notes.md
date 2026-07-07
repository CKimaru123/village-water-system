const { sendNotification } = require('./utils/emailService');

await sendNotification(
'recipient@example.com',
'Subject Line',
'<h1>HTML Content</h1>'
);

// Example usage in any route/controller
const { sendNotification } = require('./utils/emailService');

// Send to specific client
await sendNotification(
'client@example.com',
'Water Quality Alert',
'<p>Recent test shows elevated turbidity. Please boil water until further notice.</p>'
);

// Send to multiple clients
await sendNotification(
['client1@example.com', 'client2@example.com'],
'Scheduled Maintenance Notice',
'<p>Water service will be interrupted tomorrow 9AM-12PM for pipe repairs.</p>'
);
