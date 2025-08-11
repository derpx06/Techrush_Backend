const User = require('../models/User');
const BankDetails = require('../models/BankDetails');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, description } = req.body;

    if (!name || !email || !password) {
      if (req.file) await fs.unlink(req.file.path);
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    let user = await User.findOne({ email });
    if (user) {
      if (req.file) await fs.unlink(req.file.path);
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const profilePicture = req.file ? `/uploads/${req.file.filename}` : '';

    user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'Student',
      description: description || '',
      profilePicture: profilePicture,
    });

    await user.save();
    
    user.password = undefined;

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);

    res.status(201).json({ token, user });
  } catch (error) {
    if (req.file) await fs.unlink(req.file.path).catch(err => console.error("Error deleting file on failure:", err));
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      if (req.file) await fs.unlink(req.file.path);
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (description) user.description = description;

    if (req.file) {
      if (user.profilePicture) {
        const oldPath = path.join(__dirname, '..', user.profilePicture);
        await fs.unlink(oldPath).catch(err => console.log("Old profile picture not found, continuing..."));
      }
      user.profilePicture = `/uploads/${req.file.filename}`;
    }

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (error) {
    if (req.file) await fs.unlink(req.file.path).catch(err => console.error("Error deleting file on failure:", err));
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Please provide email and password' });

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    user.password = undefined;
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user });
  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    res.json(req.user);
  } catch (error) {
    next(error);
  }
};

exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('name role description profilePicture');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    next(error);
  }
};

exports.getBalance = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('balance');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json({ balance: user.balance });
    } catch (error) {
        next(error);
    }
};

exports.addBankDetails = async (req, res, next) => {
    try {
        const { phoneNumber } = req.body;
        if (!phoneNumber) {
            return res.status(400).json({ message: 'Phone number is required.' });
        }

        let bankDetails = await BankDetails.findOne({ userId: req.user.id });

        if (bankDetails) {
            bankDetails.phoneNumber = phoneNumber;
        } else {
            bankDetails = new BankDetails({
                userId: req.user.id,
                phoneNumber,
            });
        }

        await bankDetails.save();
        res.status(200).json({ message: 'Bank details saved successfully.', bankDetails });

    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        next(error);
    }
};

exports.getBankDetails = async (req, res, next) => {
    try {
        const bankDetails = await BankDetails.findOne({ userId: req.user.id });

        if (!bankDetails) {
            return res.status(404).json({ message: 'No bank details found for this user.' });
        }

        res.status(200).json(bankDetails);
    } catch (error) {
        next(error);
    }
};
