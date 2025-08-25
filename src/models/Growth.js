const { DataTypes } = require("sequelize");
const sequelize = require("../config/connectDB");

const Growth = sequelize.define(
  "Growth",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    user_id_fk: {
      type: DataTypes.STRING,
      allowNull: false
    },
    total_business: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    amount: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    tdate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    status: {
      type: DataTypes.INTEGER,
      defaultValue: 0 // 0 = pending, 1 = approved
    },
    remarks: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    Inactive_status: {
      type: DataTypes.INTEGER,
      defaultValue: 0 // 0 = active, 1 = inactive
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    tableName: "growths",
    timestamps: false, // Set to true if you have createdAt/updatedAt columns
  }
);

module.exports = Growth;
