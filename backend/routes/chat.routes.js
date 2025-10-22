const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat.controller.js");
const { authenticate } = require("../middleware/auth.middleware.js");
const {
  validateChatMessage,
  validateInvestorObjection,
} = require("../middleware/validation");

/**
 * All chat routes require authentication
 */
router.use(authenticate);

// Debugging middleware for /message endpoint
router.post("/message", (req, res, next) => {
  console.log("\n🔵 ROUTE HIT: POST /api/chat/message");
  console.log("📍 Request path:", req.path);
  console.log("📍 Request method:", req.method);
  console.log("🔐 User authenticated:", !!req.user);
  console.log("📦 Body keys:", Object.keys(req.body));
  next();
}, validateChatMessage, chatController.sendMessage);

router.post(
  "/investor-objection",
  validateInvestorObjection,
  chatController.handleInvestorObjection
);

router.get("/history/:projectId", chatController.getChatHistory);

router.get("/conversation/:chatId", chatController.getConversation);

router.delete("/conversation/:chatId", chatController.deleteConversation);

router.put("/conversation/:chatId/archive", chatController.archiveConversation);

router.post("/message/:chatId/:messageId/pin", chatController.pinMessage);

router.post("/message/:chatId/:messageId/star", chatController.starMessage);

router.post("/message/:chatId/:messageId/rate", chatController.rateMessage);

router.get("/search", chatController.searchChats);

router.get("/stats", chatController.getChatStats);

router.post("/action-item", chatController.addActionItem);

router.put(
  "/action-item/:chatId/:actionItemId/toggle",
  chatController.toggleActionItem
);

router.post("/conversation/:chatId/summary", chatController.generateSummary);

router.get("/pinned", chatController.getPinnedMessages);

router.post("/export/:chatId", chatController.exportConversation);

router.get("/suggestions/:projectId", chatController.getSmartSuggestions);

module.exports = router;
