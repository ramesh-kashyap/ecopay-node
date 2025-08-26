
const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require('../config/connectDB');
const User = require('./User');
const Investment = require('./Investment');
const Withdraw = require('./Withdraw');
const Income = require('./Income');
// const Graph = require('./Graph');
const Reward = require('./Reward');
const Growth = require('./Growth');



const Transaction = require('./Transaction');

const UserTask = require('./UserTask');
const Task = require('./Task');
const WalletModel = require('./WalletModel');
const PasswordReset = require('./passwordReset');
const Activity = require('./Activity');
const Plan = require('./Plan');

// Define relationships
User.hasMany(Investment, { foreignKey: 'user_id' });
Investment.belongsTo(User, { foreignKey: 'user_id' });


// User.hasMany(Graph, { foreignKey: 'user_id' });
// Graph.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Withdraw, { foreignKey: 'user_id' });
Withdraw.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Income, { foreignKey: 'user_id' });
Income.belongsTo(User, { foreignKey: 'user_id' });
WalletModel.belongsTo(User, { foreignKey: 'user_id' });

// Task.hasMany(UserTask, { foreignKey: "task_id", as: "userTasks" });
// UserTask.belongsTo(Task, { foreignKey: "task_id", as: "task" });

// ✅ User Wallet Balance Model
const UserWalletModel = sequelize.define("WalletModel", {
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    private_key: { type: DataTypes.TEXT, allowNull: false },
    wallet_address: { type: DataTypes.STRING, allowNull: false },
    blockchain: { type: DataTypes.ENUM("BSC", "TRON"), allowNull: false },
    balance: { type: DataTypes.DECIMAL(18, 6), allowNull: false, defaultValue: 0 }
}
    , {
        tableName: 'wallets',
        timestamps: false // No automatic created_at/updated_at
    }
);

// ✅ Gas Sponsorship Tracking
const GasSponsorshipModel = sequelize.define("GasSponsorship", {
    wallet_address: { type: DataTypes.STRING, allowNull: false },
    sponsored_at: { type: DataTypes.DATE, defaultValue: Sequelize.NOW }
}, {
    tableName: 'gassponsorships',
    timestamps: false // No automatic created_at/updated_at
}
);




// Sync models
sequelize.sync(); // Use { force: true } only if you want to recreate tables

module.exports = { sequelize, User, Investment, Withdraw, Income, WalletModel, UserWalletModel, GasSponsorshipModel, Transaction,UserTask,Task,PasswordReset,Activity,Plan,Reward,Growth};

