const { DataTypes } = require("sequelize");
const sequelize = require("../config/connectDB");

const EcoPay = sequelize.define(
  "Transaction",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    // ✅ User related
    user_id: { type: DataTypes.INTEGER, allowNull: true },

    // ✅ Recharge Specific Fields
    user_id_fk: { type: DataTypes.STRING, allowNull: true }, // Unique Transaction ID
    walletType: { type: DataTypes.STRING, allowNull: true },

    amount: { type: DataTypes.FLOAT, allowNull: true },
    
    active_from: { type: DataTypes.STRING, allowNull: true }, // Unique Transaction ID
 
  

    created_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "eco_pay",
    timestamps: false, // keep false if DB doesn't have createdAt/updatedAt columns
  }
);

module.exports = EcoPay;
