// controllers/budgetController.js
const Budget = require('../models/Budget');

exports.createBudget = async (req, res, next) => {
  try {
    const { amount, category, startDate, endDate } = req.body;
    const budget = new Budget({
      user: req.user.id,
      amount,
      category,
      startDate,
      endDate,
    });
    await budget.save();
    res.status(201).json(budget);
  } catch (error) {
    next(error);
  }
};

exports.getBudgets = async (req, res, next) => {
  try {
    const budgets = await Budget.find({ user: req.user.id });
    res.json(budgets);
  } catch (error) {
    next(error);
  }
};

exports.updateBudget = async (req, res, next) => {
  try {
    const { amount, spent } = req.body;
    const budget = await Budget.findById(req.params.id);
    if (!budget) return res.status(404).json({ message: 'Budget not found' });
    if (amount) budget.amount = amount;
    if (spent) budget.spent = spent;
    await budget.save();
    res.json(budget);
  } catch (error) {
    next(error);
  }
};