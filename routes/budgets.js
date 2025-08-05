// routes/budgets.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const budgetController = require('../controllers/budgetController');

router.post('/create', auth, budgetController.createBudget);
router.get('/', auth, budgetController.getBudgets);
router.put('/:id', auth, budgetController.updateBudget);

module.exports = router;