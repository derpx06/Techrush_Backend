// utils/reminderScheduler.js
const cron = require('node-cron');
const Group = require('../models/Group');
const Notification = require('../models/Notification');

const scheduleReminders = () => {
  cron.schedule('0 8 * * *', async () => { 
    try {
      const groups = await Group.find().populate('participants.user', 'name');
      for (const group of groups) {
        for (const participant of group.participants) {
          if (!participant.paid && participant.amountOwed > 0) {
            const notification = new Notification({
              user: participant.user,
              message: `Reminder: You owe ${participant.amountOwed} for group ${group.name}`,
              type: 'Group',
              relatedId: group._id,
            });
            await notification.save();
          }
        }
      }
    } catch (error) {
      console.error('Error in reminder scheduler:', error);
    }
  });
};

module.exports = scheduleReminders;