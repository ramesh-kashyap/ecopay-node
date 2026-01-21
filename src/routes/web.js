const express = require('express');
let router = express.Router();
 
const AuthController = require("../controllers/AuthController");
const RechargeController = require("../controllers/RechargeController");
const IncomeController = require("../controllers/incomeController");
// const TelegramController = require("../controllers/TelegramController");
const DashboardController = require("../controllers/DashboardController");
const authMiddleware = require("../middleware/authMiddleware"); // JWT Auth Middleware
const telegramAuthMiddleware = require("../middleware/telegramAuthMiddleware"); // JWT Auth Middleware
const passport = require('passport');
const googleController = require('../controllers/googleController');
const teamController = require('../controllers/teamController');
const InvestController = require('../controllers/InvestController');
// const GraphController = require('../controllers/GraphController');
const { getVip } = require("../services/userService");
const  withdrawController  = require('../controllers/withdrawController');
const  CronController  = require('../cron/CronController');
 
 
 
 
router.post('/google', googleController.verifyGoogleToken);
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/MonthlySalaries', CronController.MonthlySalaries);
 
 

router.post("/team", authMiddleware ,teamController.getTeam);
router.get('/list', authMiddleware, teamController.listUsers);
router.get('/totalTeam', authMiddleware, teamController.totalTeam);
router.get("/userinfo", authMiddleware, DashboardController.getUserDetails);
router.get("/get-chart-data", authMiddleware, DashboardController.getLast15DaysIncome);
router.get("/getTransactions", authMiddleware, DashboardController.getTransactions);
router.get("/liveRates", authMiddleware, DashboardController.liveRates);
router.post("/getTelegramId", authMiddleware, DashboardController.getTelegramId);
router.get("/usdt-address", authMiddleware, DashboardController.getUsdtAddress);
router.get('/profile', authMiddleware, AuthController.getUserProfile);
 
router.post('/verified-email', AuthController.checkForgotEmail);
router.post('/resetPassword', AuthController.resetPassword);
 
// recharge
router.post("/verify-kyc", authMiddleware, RechargeController.verifyKyc);
router.get('/get-operators', authMiddleware, RechargeController.getOperators);
router.get('/get-circles', authMiddleware, RechargeController.getCircles);
router.get('/get-banks', authMiddleware, RechargeController.getBanks);
router.get('/get-beneficiary-details', authMiddleware, RechargeController.getBeneficiaryDetails);
router.post('/send-money', authMiddleware, RechargeController.sendMoney);
router.post('/add-beneficiary', authMiddleware, RechargeController.addBeneficiary);
router.get('/check-user-status', authMiddleware, RechargeController.checkUserStatus);
router.post('/recharge', authMiddleware, RechargeController.mobileRecharge);
router.post('/recharge-plans', authMiddleware, RechargeController.getRechargePlan);
 router.get('/recharge-calback', RechargeController.rechargeCallback);

 
router.put('/Update-Profile', authMiddleware, AuthController.updateUserProfile);
router.post('/send-code', DashboardController.sendCode);
router.post('/reset-password',  DashboardController.resetPassword);
router.get("/available-balance", authMiddleware, DashboardController.getAvailableBalance);
router.post("/connect-telegram", authMiddleware, DashboardController.connectTelegram);
router.post("/verify-account", authMiddleware, DashboardController.verifyAccount);
 
router.get("/deposit-History", authMiddleware, InvestController.getHistory);
router.post("/recharge", authMiddleware, InvestController.confirmDeposit);
// router.get("/telegram-history", authMiddleware, TelegramController.getTelegramHistory);
router.post("/generate-wallet", authMiddleware, InvestController.generateWallet);
router.get("/cryptapi-upi-callback", InvestController.dynamicUpiCallback);
router.get("/direct-income", authMiddleware, InvestController.getDirectIncome);
 router.get("/transaction-history", authMiddleware, InvestController.getTransactionHistory);
 router.get("/all-transaction-history", authMiddleware, InvestController.getAllTransactionHistory);

// router.get("/roi", authMiddleware, GraphController.getRoi);
// withdraw
router.post("/withdrawal",authMiddleware,withdrawController.withdrawRequest)
router.get("/sendCode",authMiddleware,withdrawController.sendCode)
router.get("/registered-phones",authMiddleware,AuthController.getAllRegisteredPhones)
router.get("/sendCodeForget",AuthController.sendCodeForget)
router.get("/sendCodeSignUp",AuthController.sendCodeSignUp)
 
router.get("/withdraws",authMiddleware,withdrawController.getUserWithdraws)
router.get("/getWithdrawInfo",authMiddleware,withdrawController.getWithdrawInfo)

 
 
 
 
 
// telegram api
 
 
 
 
router.get("/vip/:userId", async (req, res) => {
  const { userId } = req.params;
  const vipLevel = await getVip(userId);
  res.json({ userId, vipLevel });
});
 
 
 
// Mount the router on /api/auth so that /register becomes /api/auth/register
const initWebRouter = (app) => {
    app.use('/api/auth', router);
  };
 
  module.exports = initWebRouter;
 