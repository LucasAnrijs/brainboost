const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const config = require('../config/app');

/**
 * User Schema
 * Represents a user in the system with authentication, profile, and preferences
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // Don't include password in query results by default
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    profileImage: {
      type: String,
      default: null,
    },
    preferences: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system',
      },
      studyGoal: {
        type: Number,
        default: 20, // Default to 20 cards per day
        min: [1, 'Study goal must be at least 1 card per day'],
        max: [500, 'Study goal cannot exceed 500 cards per day'],
      },
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      reminderTime: {
        type: String,
        default: '18:00', // Default reminder time (6:00 PM)
        validate: {
          validator: function(v) {
            return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: props => `${props.value} is not a valid time format (HH:MM)!`
        },
      },
    },
    statistics: {
      totalCardsCreated: {
        type: Number,
        default: 0,
      },
      totalCardsStudied: {
        type: Number,
        default: 0,
      },
      totalDecksCreated: {
        type: Number,
        default: 0,
      },
      totalStudyTime: {
        type: Number, // In minutes
        default: 0,
      },
      currentStreak: {
        type: Number,
        default: 0,
      },
      longestStreak: {
        type: Number,
        default: 0,
      },
      lastStudyDate: {
        type: Date,
        default: null,
      },
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    emailVerificationToken: String,
    emailVerified: {
      type: Boolean,
      default: false,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

/**
 * Pre-save hook to hash password before saving
 */
userSchema.pre('save', async function(next) {
  // Only hash the password if it's modified or new
  if (!this.isModified('password')) return next();
  
  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(config.bcrypt.saltRounds);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Method to compare password
 * @param {string} candidatePassword - Password to compare
 * @returns {Promise<boolean>} True if passwords match, false otherwise
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Method to update last active timestamp
 * @returns {Promise<User>} Updated user
 */
userSchema.methods.updateLastActive = async function() {
  this.lastActive = Date.now();
  return this.save();
};

/**
 * Method to update user streak
 * @param {Date} studyDate - Date of study (default to current date)
 * @returns {Promise<User>} Updated user
 */
userSchema.methods.updateStreak = async function(studyDate = new Date()) {
  const lastStudyDate = this.statistics.lastStudyDate;
  
  // If this is the first time studying
  if (!lastStudyDate) {
    this.statistics.currentStreak = 1;
    this.statistics.longestStreak = 1;
    this.statistics.lastStudyDate = studyDate;
    return this.save();
  }
  
  // Check if study date is a new day
  const lastStudyDay = new Date(lastStudyDate).setHours(0, 0, 0, 0);
  const studyDay = new Date(studyDate).setHours(0, 0, 0, 0);
  
  // If same day, no streak update needed
  if (studyDay === lastStudyDay) {
    return this;
  }
  
  // Calculate days between last study and current study
  const dayDifference = Math.floor((studyDay - lastStudyDay) / (1000 * 60 * 60 * 24));
  
  // If consecutive day (yesterday)
  if (dayDifference === 1) {
    this.statistics.currentStreak += 1;
    
    // Update longest streak if current is higher
    if (this.statistics.currentStreak > this.statistics.longestStreak) {
      this.statistics.longestStreak = this.statistics.currentStreak;
    }
  } else {
    // Streak broken, reset to 1
    this.statistics.currentStreak = 1;
  }
  
  this.statistics.lastStudyDate = studyDate;
  return this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User;
