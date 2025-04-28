/**
 * SRS Service Module
 * Exports the SRS service functions for spaced repetition
 */

const { 
  getDueCardsForUser,
  processReviewResult,
  resetCardProgress,
  getUserStatistics,
  createSession,
  getSessionById
} = require('./srs-service');

const srsService = {
  getDueCardsForUser,
  processReviewResult,
  resetCardProgress,
  getUserStatistics,
  createSession,
  getSessionById
};

module.exports = {
  srsService
};
