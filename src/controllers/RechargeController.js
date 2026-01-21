const sequelize = require('../config/connectDB'); // Import Sequelize connection
const { QueryTypes ,Op } = require('sequelize');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Transaction = require("../models/User");

const express = require('express');
// const bodyParser = require('body-parser')
const { PasswordReset } = require('../models');
const { sendEmail } = require('../services/userService');
const axios = require('axios');
const FormData = require('form-data');
const getOperators = async (req, res) => {
  try {
    console.log("Fetching operators from Cyrus Recharge API...");
    const memberid = process.env.CYRUS_MEMBER_ID;
    const pin = process.env.CYRUS_PIN;

    const response = await axios.get("https://cyrusrecharge.in/api/GetOperator.aspx", {
      params: { memberid, pin, Method: "getoperator" }
    });

    const apiData = response.data;
    // console.log("Full Cyrus Recharge API data:", JSON.stringify(apiData, null, 2));

    // Validate API data
    if (!Array.isArray(apiData) || apiData.length === 0 || apiData[0].Status !== "1") {
      return res.status(400).json({
        success: false,
        message: apiData[0]?.ErrorMessage || "Failed to fetch operators"
      });
    }

    // Safely extract services & operators
    const services = (apiData[0].data || []).map(service => ({
      serviceType: service.ServiceTypeName || "Unknown",
      operators: (service.data || []).map(op => ({
        code: op.OperatorCode || "",
        name: op.OperatorName || ""
      }))
    }));

    // console.log("Extracted services:", services);

    return res.json({
      success: true,
      message: apiData[0].SuccessMessage || "Operators fetched successfully",
      services
    });

  } catch (error) {
    console.error("getOperators error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching operators",
      details: error.message
    });
  }
};



 const getCircles = async (req, res) => {
  try {
    console.log('Fetching telecom circles from Cyrus Recharge API...');

    const memberid = process.env.CYRUS_MEMBER_ID;
    const pin = process.env.CYRUS_PIN;

    const response = await axios.get('https://cyrusrecharge.in/api/GetOperator.aspx', {
      params: {
        memberid,
        pin,
        Method: 'getcircle',
      },
      timeout: 10000, // optional: timeout after 10 seconds
    });

    const apiData = response.data;

    console.log('Full Cyrus Recharge API data:', JSON.stringify(apiData, null, 2));

    // Validate response
    if (!Array.isArray(apiData) || apiData.length === 0 || apiData[0].Status !== '1') {
      return res.status(400).json({
        success: false,
        message: apiData[0]?.ErrorMessage || 'Failed to fetch circles',
      });
    }

    // Extract circles safely
    const circles = (apiData[0]['data'] ?? []).map((circle) => ({
      'code': circle['circlecode'] ?? '',
      'name': circle['circlename'] ?? '',
    }));
    console.log('Extracted circles:', circles);

    return res.json({
      success: true,
      message: apiData[0].SuccessMessage || 'Circles fetched successfully',
      circles,
    });
  } catch (error) {
    console.error('getCircles error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching circles',
      details: error.message,
    });
  }
};


const getBanks = async (req, res) => {
  try {
    console.log('Fetching bank list from Cyrus Recharge API...');

    const merchantID = process.env.CYRUS_MEMBER_ID;
    const merchantKey = process.env.CYRUS_MERCHANT_KEY;
      console.log('Using MerchantID:', merchantID);
      console.log('Using MerchantKey:', merchantKey);
    // Cyrus API expects form-data (x-www-form-urlencoded)
    const formData = new URLSearchParams();
    formData.append('MerchantID', merchantID);
    formData.append('MerchantKey', merchantKey);
    formData.append('MethodName', 'banklist');

    const response = await axios.post(
      'https://cyrusrecharge.in/services_cyapi/DMT2_cyapi.aspx',
      formData.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 10000,
      }
    );

    const apiData = response.data;
    // console.log('Full Cyrus bank API data:', JSON.stringify(apiData, null, 2));

    if (apiData.statuscode !== 'TXN' || !Array.isArray(apiData.data)) {
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch banks',
      });
    }

    // Map banks into a clean format
    const banks = apiData.data.map((bank) => ({
      id: bank.id ?? '',
      code: bank.bankcode ?? '',
      name: bank.bankname ?? '',
      ifsc: bank.masterifsc ?? '',
      logo: bank.url ?? '',
    }));

    // console.log('Extracted banks:', banks);

    return res.json({
      success: true,
      message: apiData.status || 'Banks fetched successfully',
      banks,
    });
  } catch (error) {
    console.error('getBanks error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching banks',
      details: error.message,
    });
  }
};



const CYRUS_API_URL = 'https://cyrusrecharge.in/services_cyapi/DMT2_cyapi.aspx';
const MERCHANT_ID = 'AP****';
const MERCHANT_KEY = '******';

// Helper: check if customer exists
const checkCustomer = async (mobileNo) => {
  
  const form = new FormData();
 
    const merchantID = process.env.CYRUS_MEMBER_ID;
    const merchantKey = process.env.CYRUS_MERCHANT_KEY;
  form.append('MerchantID', merchantID);
  form.append('MerchantKey', merchantKey);
  form.append('MethodName', 'getcustomerdetails');
  form.append('MOBILENO', mobileNo.phone);

  const response = await axios.post('https://cyrusrecharge.in/services_cyapi/DMT2_cyapi.aspx', form, { headers: form.getHeaders() });
  // console.log("checkCustomer response:", response);
if (response.data.statuscode === 'TXN' && Array.isArray(response.data.data) && response.data.data.length > 0) {
    return response.data.data[0]; // return the first customer object
}
  return null; // not exists
};

// Helper: register customer
const registerCustomerFromDB = async (dbUser) => {
  // console.log("Registering customer from DB user:", dbUser);
  // Map database fields to API required fields
  const customerData = {
    FNAME: dbUser.name || '',          // from DB 'name'
    LNAME: dbUser.lastname || '',      // from DB 'lastname'
    MOBILENO: dbUser.phone || '',      // from DB 'phone'
    DOB: dbUser.dob || '',             // make sure DB has DOB field
    PINCODE: dbUser.zipCode || '',     // from DB 'zipCode'
    ADDRESS: dbUser.address || '',     // from DB 'address'
    Pan: dbUser.pancard || '',         // from DB 'pancard'
    Aadhar: dbUser.aadhaar_card || ''  // from DB 'aadhaar_card'
  };
  // console.log("Customer data prepared for registration:", dbUser.name, dbUser.phone);
  // console.log("Registering customer with data:", customerData);

  // Check required fields one by one
  if (!customerData.FNAME) return { success: false, message: 'Please add FNAME first in Main Site' };
  if (!customerData.LNAME) return { success: false, message: 'Please add LNAME first in Main Site' };
  if (!customerData.MOBILENO) return { success: false, message: 'Please add MOBILENO first in Main Site' };
  if (!customerData.DOB) return { success: false, message: 'Please add DOB first in Main Site' };
  if (!customerData.PINCODE) return { success: false, message: 'Please add PINCODE first in Main Site' };
  if (!customerData.ADDRESS) return { success: false, message: 'Please add ADDRESS first in Main Site' };
  if (!customerData.Pan) return { success: false, message: 'Please add Pan first in Main Site' };
  if (!customerData.Aadhar) return { success: false, message: 'Please add Aadhar first in Main Site' };

  // Prepare form for API
  const FormData = require('form-data');
  const form = new FormData();
  form.append('MerchantID', process.env.CYRUS_MEMBER_ID);
  form.append('MerchantKey', process.env.CYRUS_MERCHANT_KEY);
  form.append('MethodName', 'customerregistration');

  // Append all fields
  for (let key in customerData) {
    form.append(key, customerData[key]);
  }

  try {
    const axios = require('axios');
    const response = await axios.post('https://cyrusrecharge.in/services_cyapi/DMT2_cyapi.aspx', form, { headers: form.getHeaders() });
// console.log("registerCustomerFromDB response:", response.data);
        if (response.data.statuscode === 'TXN' && response.data.status === 'Transaction Successful') {
      // Extract OTP message from data array
      const otpMessage = response.data.data && response.data.data[0] && response.data.data[0].MESSAGE;
      return { success: true, message: otpMessage || 'Registration successful' };
    } else {
      return { success: false, message: response.data.status, details: response.data };
    }
  } catch (err) {
    return { success: false, message: 'API request error', details: err.message };
  }
};


// Main addBeneficiary function
const addBeneficiary = async (req, res) => {
  try {
console.log("addBeneficiary called with body:", req.body);
      const userId = req.user.id; 
    const { MobileNo, CustomerMobileNo, BankId, AccountNo, IFSC, Name } = req.body;

    if (!MobileNo || !CustomerMobileNo || !BankId || !AccountNo || !IFSC || !Name) {
      console.log("Missing fields:", { MobileNo, CustomerMobileNo, BankId, AccountNo, IFSC, Name });
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // 1️⃣ Check if customer exists
    
    let customer = await User.findOne({
      where: { id: userId }, // 👈 use userId instead of mobile number
    });
   

    // console.log("Proceeding to add beneficiary for customer:", customer);


     const addForm = new URLSearchParams();
    addForm.append("MerchantID", process.env.CYRUS_MEMBER_ID);
    addForm.append("MerchantKey", process.env.CYRUS_MERCHANT_KEY);
    addForm.append("MethodName", "addbeneficiary");
    addForm.append("MobileNo", MobileNo);
    addForm.append("CustomerMobileNo", CustomerMobileNo);
    addForm.append("BankId", BankId);
    addForm.append("AccountNo", AccountNo);
    addForm.append("IFSC", IFSC);
    addForm.append("Name", Name);
  

// 🔍 Debug log: print the complete payload
console.log("Add Beneficiary Payload:", Object.fromEntries(addForm.entries()));


    const addResp = await axios.post(
      "https://cyrusrecharge.in/services_cyapi/DMT2_cyapi.aspx",
      addForm
    );
     console.log("Add Beneficiary API Response:", addResp);
     if (!addResp.data || addResp.data.statuscode !== "TXN") {
      console.log("Add Beneficiary failed:", addResp.data);
      return res.status(200).json({
        success: false,
        message: addResp.data?.status || "Failed to add beneficiary",
        raw: addResp.data
      });
    }
    console.log("Add Beneficiary Response:", addResp.data);

    return res.status(200).json({
      success: true,
      message: "Beneficiary added successfully",
      details: addResp.data,
    });
     
  } catch (error) {
    console.error('addBeneficiary error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', details: error.message });
  }
};


// const addBeneficiary = async (req, res) => {
//   try {
//     const { MobileNo, CustomerMobileNo, BankId, AccountNo, IFSC, Name } = req.body;

//     if (!MobileNo || !CustomerMobileNo || !BankId || !AccountNo || !IFSC || !Name) {
//       return res.status(400).json({
//         success: false,
//         message: 'All fields are required',
//       });
//     }

//     const query = `
//       INSERT INTO beneficiaries 
//         (mobile_no, customer_mobile_no, bank_id, account_no, ifsc, name, created_at, updated_at) 
//       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
//     `;
//     const values = [MobileNo, CustomerMobileNo, BankId, AccountNo, IFSC, Name];

//     db.query(query, values, (err, result) => {
//       if (err) {
//         console.error('DB error:', err);
//         return res.status(500).json({
//           success: false,
//           message: 'Failed to add beneficiary',
//           details: err.message,
//         });
//       }

//       return res.json({
//         success: true,
//         message: 'Beneficiary added successfully',
//         beneficiaryId: result.insertId,
//       });
//     });
//   } catch (error) {
//     console.error('addBeneficiary error:', error.message);
//     return res.status(500).json({
//       success: false,
//       message: 'Server error',
//       details: error.message,
//     });
//   }
// };

const getBeneficiaryDetails = async (req, res) => {
  try {
       const userId = req.user.id; 
    console.log("Fetching beneficiary details from Cyrus DMT2 API...");


    let customer2 = await User.findOne({
      where: { id: userId }, // 👈 use userId instead of mobile number
    });

    if (!customer2) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }
      const { phone, pancard, aadhaar_card } = customer2; 

    if (!phone || !pancard || !aadhaar_card) {
      return res.status(400).json({
        success: false,
        message: "User missing required details (phone, pancard, aadhaar_card)",
      });
    }
    const form = new FormData();
    form.append("MerchantID", process.env.CYRUS_MEMBER_ID); // e.g. "AP****"
    form.append("MerchantKey", process.env.CYRUS_MERCHANT_KEY); // e.g. "******"
    form.append("MethodName", "getbeneficiarydetails");
    form.append("MOBILENO", phone || "9729047704"); // from req or fallback
    form.append("Pan", pancard || "EMEPK7241B");
    form.append("Aadhar", aadhaar_card || "513087904226");
      console.log("MerchantID:", process.env.CYRUS_MEMBER_ID);
console.log("MerchantKey:", process.env.CYRUS_MERCHANT_KEY ? "Loaded ✅" : "Missing ❌");
    const response = await axios.post(
      "https://cyrusrecharge.in/services_cyapi/DMT2_cyapi.aspx",
      form,
      { headers: form.getHeaders(), timeout: 10000 }
    );

    const apiData = response.data;
    console.log("Full response:", JSON.stringify(apiData, null, 2));

    // Handle API success/failure
    if (!apiData || apiData.statuscode !== "TXN") {
      return res.status(400).json({
        success: false,
        message: apiData?.status || "Failed to fetch beneficiary details",
        raw: apiData
      });
    }

    return res.json({
      success: true,
      message: apiData.status || "Beneficiary details fetched successfully",
      data: apiData.data || []
    });
  } catch (error) {
    console.error("getBeneficiaryDetails error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching beneficiary details",
      details: error.message
    });
  }
};

const sendMoney = async (req, res) => {
  try {
    const userId = req.user.id; // authenticated user
    console.log("Initiating money transfer via Cyrus API...");

    // 1️⃣ Fetch user info (for CustomerMobile, etc.)
    let customer = await User.findOne({ where: { id: userId } });
    if (!customer) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    // 2️⃣ Extract request fields
    const {
      beneficiaryAccount,
      beneficiaryIFSC,
      orderId,
      amount,
      comments
    } = req.body;

    if (!beneficiaryAccount || !beneficiaryIFSC || !orderId || !amount) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // 3️⃣ Build form data
    const form = new FormData();
    form.append("MerchantID", process.env.CYRUS_MERCHANT_ID);
    form.append("MerchantKey", process.env.CYRUS_MERCHANT_KEY);
    form.append("MethodName", "sendmoney");
    form.append("CustomerMobile", customer.phone); // 👈 from user table
    form.append("beneficiaryAccount", beneficiaryAccount);
    form.append("beneficiaryIFSC", beneficiaryIFSC);
    form.append("orderId", orderId);
    form.append("amount", amount);
    form.append("comments", comments || "test");

    // 4️⃣ Call Cyrus API
    const response = await axios.post(
      "https://cyrusrecharge.in/services_cyapi/DMT2_cyapi.aspx",
      form,
      { headers: form.getHeaders(), timeout: 10000 }
    );

    const apiData = response.data;
    console.log("SendMoney Response:", JSON.stringify(apiData, null, 2));

    // 5️⃣ Handle API success/failure
    if (!apiData || apiData.statuscode !== "TXN") {
      return res.status(400).json({
        success: false,
        message: apiData?.status || "Money transfer failed",
        raw: apiData
      });
    }

    return res.json({
      success: true,
      message: apiData.status || "Money sent successfully",
      data: apiData.data || []
    });
  } catch (error) {
    console.error("sendMoney error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while sending money",
      details: error.message
    });
  }
};

const addKYCDetails = async (dbUser) => {
  console.log("Adding KYC for customer:", dbUser.phone);

  // Prepare KYC data
  const kycData = {
    MOBILENO: dbUser.phone || '',
    Pan: dbUser.pancard || '',
    Aadhar: dbUser.aadhaar_card || ''
  };

  // Check required fields
  if (!kycData.MOBILENO) return { success: false, message: 'Please add MOBILENO first in Main Site' };
  if (!kycData.Pan) return { success: false, message: 'Please add Pan first in Main Site' };
  if (!kycData.Aadhar) return { success: false, message: 'Please add Aadhar first in Main Site' };

  // Prepare form for API
  const FormData = require('form-data');
  const form = new FormData();
  form.append('MerchantID', process.env.CYRUS_MEMBER_ID);
  form.append('MerchantKey', process.env.CYRUS_MERCHANT_KEY);
  form.append('MethodName', 'add_kycdetails');

  for (let key in kycData) {
    form.append(key, kycData[key]);
  }

  try {
    const axios = require('axios');
    const response = await axios.post(
      'https://cyrusrecharge.in/services_cyapi/DMT2_cyapi.aspx',
      form,
      { headers: form.getHeaders() }
    );

    console.log("addKYCDetails response:", response.data);

    if (response.data.statuscode === 'TXN' && response.data.status === 'Transaction Successful') {
      return { success: true, message: 'KYC details added successfully', details: response.data };
    } else {
      return { success: false, message: response.data.status, details: response.data };
    }
  } catch (err) {
    console.error("addKYCDetails error:", err.message);
    return { success: false, message: 'API request error', details: err.message };
  }
};

const verifyKyc = async (req, res) => {
  try {
    const userId = req.user.id; // authenticated user
    const { otp } = req.body;

    if (!otp) {
      return res.status(200).json({ success: false, message: "OTP is required" });
    }

    // 1️⃣ Fetch user info (phone from DB)
    const customer = await User.findOne({ where: { id: userId } });
    if (!customer) {
      return res.status(200).json({ success: false, message: "User not found" });
    }

    // 2️⃣ Build form data for Cyrus API
    const form = new FormData();
    form.append("MerchantID", process.env.CYRUS_MEMBER_ID);
    form.append("MerchantKey", process.env.CYRUS_MERCHANT_KEY);
    form.append("MethodName", "verify_kycdetails");
    form.append("MOBILENO", customer.phone); // 👈 registered mobile number
    form.append("otp", otp);

    // 3️⃣ Call Cyrus API
    const response = await axios.post(
      "https://cyrusrecharge.in/services_cyapi/DMT2_cyapi.aspx",
      form,
      { headers: form.getHeaders(), timeout: 15000 }
    );

    const apiData = response.data;
    console.log("KYC Verification Response:", JSON.stringify(apiData, null, 2));

    // 4️⃣ Validate API response
    if (!apiData || apiData.statuscode !== "TXN") {
      return res.status(200).json({
        success: false,
        message: apiData?.status || "KYC verification failed",
        raw: apiData,
      });
    }

    // ✅ On success, update user status in DB
    if (apiData.data?.[0]?.STS_CODE === "001") {
      await customer.update({ status: "active" }); // mark user active after KYC
    }


    // ✅ Success
    return res.json({
      success: true,
      message: apiData.status || "KYC verification successful",
      data: apiData.data || [],
      action: "PROCEED",
    });
  } catch (error) {
    console.error("verifyKyc error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while verifying KYC",
      details: error.message,
    });
  }
};


const checkUserStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1️⃣ Find user in DB
    const customer2 = await User.findOne({ where: { id: userId } });

    if (!customer2) {
      return res.status(200).json({
        success: false,
        message: "User not found",
      });
    }

   let customer = await checkCustomer(customer2);
       console.log("Customer check result:", customer);
    //  console.log("Customer check result:", customer2);
    if (!customer2) {
      return res.status(200).json({ success: false, message: 'User not found' });
    }

     const CustomerData = customer2;
    // 2️⃣ If not exists, register customer
    if (customer.STS_CODE === '002') {
      if (!CustomerData) {
        console.log("No CustomerData provided for registration");
        return res.status(200).json({ success: false, message: 'Customer not registered. Provide CustomerData to register.' });
      }
      const registered = await registerCustomerFromDB(CustomerData);
      if (!registered.success) {
  console.log("Registration failed:", registered.message);
  return res.status(200).json(registered); // directly return what registerCustomerFromDB gave
}
      customer = CustomerData; // treat newly registered customer as existing
    }

     console.log("Proceeding to add beneficiary for customer:", customer2);
     console.log("Customer MobileNo:", customer2.status);
     if (customer2.status === "inactive") {
      console.log("User inactive → performing KYC...");

      const kycForm = new URLSearchParams();
      kycForm.append("MerchantID", process.env.CYRUS_MEMBER_ID);
      kycForm.append("MerchantKey", process.env.CYRUS_MERCHANT_KEY);
      kycForm.append("MethodName", "add_kycdetails");
      kycForm.append("MOBILENO",customer2.phone); // from DB
      kycForm.append("Pan", customer2.pancard);       // from DB
      kycForm.append("Aadhar", customer2.aadhaar_card); // from DB

      const kycResp = await axios.post(
        "https://cyrusrecharge.in/services_cyapi/DMT2_cyapi.aspx",
        kycForm
      );

      console.log("KYC Response:", kycResp.data);

      if (kycResp.data.statuscode !== "TXN") {
        return res.status(200).json({ success: false, message: "KYC failed", details: kycResp.data, action: "KYC_REQUIRED", });
      }
 
      // ✅ Update user as active

    }

    if (customer2.status === "inactive") { return res.status(200).json({
      success: true,
      message: "User active and KYC complete",
      status: "active",
      action: "KYC_REQUIRED",
    });
  }else{
    return res.status(200).json({
      success: true,
      message: "User active and KYC complete",
      status: "active",
      action: "PROCEED",
    });
  }

  } catch (error) {
    console.error("checkUserStatus error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
      details: error.message, 
    });
  }
};

const getRechargePlan = async (req, res) => {
  try {
    console.log("get recharge plan...");
    const { operator, phone, circle } = req.body;
    if (!operator || !phone || !circle) {
      return res.status(400).json({ success: false, message: "Missing parameters" });
    }
 
    const APIID = process.env.CYRUS_MEMBER_ID;
    const PASSWORD = process.env.CYRUS_PASSWORD;
    console.log(" PASSWORD:", { PASSWORD, APIID});
    console.log(" Request Params:", { operator, phone, circle });
    const response = await axios.post(
      "https://cyrusrecharge.in/API/CyrusPlanFatchAPI.aspx",
          null,
      {
        params: {
          APIID,
          PASSWORD,
          Operator_Code: operator,
          Circle_Code: circle,
          MobileNumber: phone,
          data: "ALL",
        },
      }
    );
 
    const apiData = response.data;
    console.log(apiData);
   
 
    if (!apiData  || apiData.length === 0 ) {
      return res.status(200).json({
        success: false,
        message: apiData?.[0]?.ErrorMessage || "Failed to fetch operators",
      });
    }
 
    return res.json({
      success: true,
      message:  "Plan fetched successfully",
      apiData,
    });
 
  } catch (error) {
    console.error("getRechargePlan error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching operators",
      details: error.message,
    });
  }
};

const mobileRecharge = async (req, res) => {
  try {
    console.log("Recharge API hit...");
    let { operator, phone, circle, amount } = req.body;
 
    phone = phone.replace(/^(\+91|91)/, "");
 
    console.log("Cleaned Phone:", phone);
 
    if (!operator || !phone || !circle || !amount) {
      return res.status(400).json({ success: false, message: "Missing parameters" });
    }
 
    const userId = req.user?.id;
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID missing" });
    }
    

      const dthOperators = ["DTD", "TSD", "VDD", "SD", "ATD"];

    // ✅ Auto set remark based on operator
    const remark = dthOperators.includes(operator) ? "DTH Recharge" : "Mobile Recharge";
    console.log(`Selected Remark: ${remark}`);

    const [incomeSum] = await sequelize.query(
      "SELECT COALESCE(SUM(comm),0) AS totalIncome FROM incomes WHERE user_id = ?",
      { replacements: [userId], type: sequelize.QueryTypes.SELECT }
    );

    const [payoutSum] = await sequelize.query(
      "SELECT COALESCE(SUM(total),0) AS totalPayout FROM payouts WHERE user_id = ?",
      { replacements: [userId], type: sequelize.QueryTypes.SELECT }
    );

    const finalAmount = incomeSum.totalIncome - payoutSum.totalPayout;
    console.log(`User Balance: ${finalAmount}, Recharge Amount: ${amount}`);

    if (finalAmount < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient Balance.",
        availableBalance: finalAmount
      });
    }
    const usertx =
      "AP" + Math.random().toString(36).substring(2, 10).toUpperCase();
      const transaction_id =
      "TR" + Math.random().toString(36).substring(2, 6).toUpperCase();
  console.log('usertx',usertx);
    const memberid = process.env.CYRUS_MEMBER_ID;
    const pin = process.env.CYRUS_PIN;
 
    console.log("Request Params:", { operator, phone, circle, amount });
 
    const response = await axios.get(
  "https://cyrusrecharge.in/services_cyapi/recharge_cyapi.aspx",
  {
    params: {
      memberid,
      pin,
      number: phone,
      operator,
      circle,
      amount,
      usertx,
      format: "json",
      RechargeMode: 1,
      
    },
  }
);
 
   const apiData = response.data;
    console.log("Raw API Response:", apiData);
 
       const api_trans_id = apiData.ApiTransID || null;
    const operator_ref = apiData.OperatorRef || null;
    const transaction_date = apiData.TransactionDate || null;
 
 
await Transaction.create({
  user_id: req.user?.id || null,
  usertx,
  operator,
  phone,
  circle,
  amount,
  status: "Pending",
  transaction_id,
  api_trans_id,
 operator_ref,
 transaction_date,
   remark, 
});
 
    return res.json({
      success: true,
      message: "Recharge request sent successfully",
      usertx,      
      apiData,
    });
  } catch (error) {
    console.error("mobileRecharge error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while processing recharge",
      details: error.message,
    });
  }
};
 
// Callback endpoint
const rechargeCallback = async (req, res) => {
  try {
    const { Status, OperatorRef, APITransID, TransID, ErrorCode } = req.query;

    console.log("🔔 Cyrus Callback Received:", req.query);

    const transaction = await Transaction.findOne({
      where: {   api_trans_id: APITransID },
      raw: true // ✅ Force plain object, no User table joins
    });

    if (!transaction) {
      console.warn("⚠️ Transaction not found for TransID:", TransID);
      return res.status(200).send();
    }

    await Transaction.update(
      {
        status:
          Status === "SUCCESS"
            ? "Success"
            : Status === "FAILED" || Status === "FAILURE"
            ? "Failed"
            : Status === "REFUND"
            ? "Refunded"
            : transaction.status,
        remarks: ErrorCode || null,
        rname: OperatorRef || null
      },
      { where: {  api_trans_id: APITransID} }
    );

    console.log("✅ Transaction Updated:", TransID, Status);
    return res.status(200).send();
  } catch (error) {
    console.error("❌ Callback Processing Error:", error);
    return res.status(200).send();
  }
};



module.exports = { getOperators, getCircles, getBanks, addBeneficiary ,getBeneficiaryDetails,sendMoney,verifyKyc,checkUserStatus,getRechargePlan,mobileRecharge,rechargeCallback};

