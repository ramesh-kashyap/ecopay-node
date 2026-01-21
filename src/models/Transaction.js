const { DataTypes } = require("sequelize");
const sequelize = require("../config/connectDB");

const Transaction = sequelize.define(
  "Transaction",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    // ✅ User related
    user_id: { type: DataTypes.INTEGER, allowNull: true },

    // ✅ Recharge Specific Fields
    usertx: { type: DataTypes.STRING, allowNull: false }, // Unique Transaction ID
    operator: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    circle: { type: DataTypes.STRING, allowNull: true },
    amount: { type: DataTypes.FLOAT, allowNull: true },
    remark: { type: DataTypes.STRING, allowNull: true },
    transaction_id: { type: DataTypes.STRING, allowNull: true }, // Unique Transaction ID
    operator_ref: { type: DataTypes.STRING, allowNull: true }, // Unique Transaction ID
    api_trans_id: { type: DataTypes.STRING, allowNull: true }, // Unique Transaction ID transaction_date
    transaction_date: { type: DataTypes.STRING, allowNull: true }, // Unique Transaction ID 


    status: {
      type: DataTypes.ENUM("Pending", "Success", "Failed", "Refunded"),
      allowNull: false,
      defaultValue: "Pending",
    },

    ttime: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    created_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "transactions",
    timestamps: false, // keep false if DB doesn't have createdAt/updatedAt columns
  }
);

module.exports = Transaction;
