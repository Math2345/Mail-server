const express = require('express');
const router = express.Router();


const NotifyController = require('../controller/notify_controller');

// routes
router.post('/notifications', NotifyController.create_notify);
router.get('/notifications/:id', NotifyController.get_notify_by_id);
router.delete('/notifications', NotifyController.delete_all_notifications);
router.delete('/notifications/:id', NotifyController.delete_notify_by_id);
router.patch('/notifications/:id', NotifyController.update_notify);
router.get('/search', NotifyController.search_notify);
router.get('/sort', NotifyController.sort_notify);
router.post('/send', NotifyController.send);
router.get('/logs', NotifyController.send_logs);

module.exports = router;

