const { DataTypes } = require("sequelize");
const sequelize = require("../config/connectDB");
 
const TransactionBank = sequelize.define(
  "TransactionBank",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
 
    // ✅ User related
    userId: { type: DataTypes.INTEGER, allowNull: true },
 
    // ✅ Transaction Specific Fields
    orderId: { type: DataTypes.STRING, allowNull: true },
    cyrusOrderId: { type: DataTypes.STRING, allowNull: true },
    cyrus_id: { type: DataTypes.STRING, allowNull: true },
     accountNo: {                         // 👈 Add this field
      type: DataTypes.STRING,
      allowNull: true,
    },
 
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    status: { type: DataTypes.STRING, allowNull: true },
 
    // ✅ Timestamps
    createdAt: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "transactionbanks",
    timestamps: false, // since we have custom createdAt/updatedAt
  }
);
 
module.exports = TransactionBank;