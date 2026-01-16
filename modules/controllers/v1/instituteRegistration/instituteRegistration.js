import commonModel from "../../../../commonModel.js/commonModel.js";
import { hashPassword } from "../../../../utils/password.js";
import { sendNormalOTPMsg } from "../../../../helper/otp.js";
import { sendEmail } from "../../../../utils/sendEmail.js";
import { validationResult } from 'express-validator'
import 'dotenv/config';




/* ================= REGISTER BY (STATIC MASTER) ================= */
export const getRegister = async (req, res) => {
  try {
    const data = [
      { id: 5, name: "College TPO" },
      { id: 6, name: "College Student Coordinator" },
      { id: 3, name: "Principal" },
      { id: 4, name: "Chairman" },
      { id: 7, name: "Dean" }
    ];

    return res.status(200).json({
      status: true,
      data
    });
  } catch (error) {
    console.error("Error in getRegister:", error);
    return res.status(500).json({
      status: false,
      msg: "Internal Server Error"
    });
  }
};



/* ================= INSTITUTE TYPE (STATIC MASTER) ================= */
export const getInstituteType = async (req, res) => {
  try {
    const data = [
      { id: 1, name: "College" },
      { id: 2, name: "Global" },
      { id: 3, name: "Deemed" },
      { id: 4, name: "State Run" },
      { id: 5, name: "IIT" }
    ];

    return res.status(200).json({
      status: true,
      data
    });
  } catch (error) {
    console.error("Error in getInstituteType:", error);
    return res.status(500).json({
      status: false,
      msg: "Internal Server Error"
    });
  }
};

/* ================= STEP 1 : INSTITUTE REGISTRATION ================= */


export const instituteRegistrationStepOne = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        errors: errors.array()
      });
    }

    const {
      register_by,
      institute_type,
      name,
      personal_email,
      official_email,
      mobile_number,
      password,
      college_name,
      tpo_name,
      tpo_email,
      tpo_mobile,
      tpo_password
    } = req.body;

    const userTypeMap = {
      "College TPO": 5,
      "College Student Coordinator": 6,
      "Principal": 3,
      "Chairman": 4,
      "Dean": 7
    };

    const user_type = userTypeMap[register_by];

    if (!user_type) {
      return res.status(400).json({
        status: false,
        msg: "Invalid register by value"
      });
    }
    const finalEmail =
      register_by === "College TPO" ? tpo_email : official_email;


    const existing = await commonModel.getData(
      "ups_college_onboarding_users",
      "id",
      `official_email = '${finalEmail.replace(/'/g, "''")}'`
    );


    if (existing && existing.length > 0) {
      return res.status(409).json({
        status: false,
        msg: "Official email already registered"
      });
    }

    const hashedPassword = await hashPassword(password);

    const insertId = await commonModel.insertData(
      "ups_college_onboarding_users",
      {
        institute_type,
        user_type,
        official_name: name,
        personal_email: personal_email || null,
        official_email,
        official_number: mobile_number,
        password: hashedPassword,
        tpo_name,
        tpo_official_email: tpo_email,
        tpo_number: tpo_mobile,
        college_name,
        created_by: 0,
        updated_by: 0,
        created_on: new Date()
      }
    );

    return res.status(201).json({
      status: true,
      msg: "Institute registration saved successfully",
      data: {
        onboarding_user_id: insertId
      }
    });

  } catch (error) {
    console.error("Error in instituteRegistrationStepOne:", error);
    return res.status(500).json({
      status: false,
      msg: "Internal Server Error"
    });
  }
};

/* ================= ADD TPO DETAILS ================= */
export const addTpoDetails = async (req, res) => {
  try {



    const {
      onboarding_user_id,
      tpo_name,
      tpo_email,
      tpo_mobile,
      tpo_password
    } = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        errors: errors.array()
      });
    }

    /* ---------- validations ---------- */
    // if (!onboarding_user_id)
    //   return res.status(400).json({ status: false, msg: "Onboarding user id is required" });

    // if (!tpo_name)
    //   return res.status(400).json({ status: false, msg: "TPO name is required" });

    // if (!tpo_email)
    //   return res.status(400).json({ status: false, msg: "TPO email is required" });

    // if (!tpo_mobile)
    //   return res.status(400).json({ status: false, msg: "TPO mobile number is required" });

    // if (!tpo_password)
    //   return res.status(400).json({ status: false, msg: "TPO password is required" });

    /* ---------- check institute exists ---------- */
    const institute = await commonModel.getData(
      "ups_college_onboarding_users",
      "id",
      `id = ${onboarding_user_id}`
    );

    if (!institute) {
      return res.status(404).json({
        status: false,
        msg: "Institute onboarding record not found"
      });
    }

    /* ---------- hash password ---------- */
    const hashedPassword = await hashPassword(tpo_password);

    /* ---------- update TPO details ---------- */
    const updateData = {
      tpo_name,
      tpo_official_email: tpo_email,
      tpo_number: tpo_mobile,
      password: hashedPassword,
      updated_on: new Date()
    };

    const updated = await commonModel.updateData(
      "ups_college_onboarding_users",
      updateData,
      `id = ${onboarding_user_id}`
    );
    console.log("UPDATE DATA:", updateData);

    console.log("UPDATED RESULT:", updated);

    if (!updated) {
      return res.status(500).json({
        status: false,
        msg: "Failed to save TPO details"
      });
    }

    return res.status(200).json({
      status: true,
      msg: "TPO details added successfully"
    });

  } catch (error) {
    console.error("Error in addTpoDetails:", error);
    return res.status(500).json({
      status: false,
      msg: "Internal Server Error"
    });
  }
};





export const sendOtp = async (req, res) => {
  try {
    const { onboarding_user_id } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        errors: errors.array()
      });
    }

    const user = await commonModel.getData(
      "ups_college_onboarding_users",
      "id, official_number, tpo_number",
      `id = ${onboarding_user_id}`
    );

    if (!user || user.length === 0) {
      return res.status(404).json({
        status: false,
        msg: "User not found"
      });
    }

    const id = user[0].id;

    let mobile;
    let otpField;

    /* EXPLICIT LOGIC — NO || */
    if (user[0].official_number && user[0].official_number!== "") {
      mobile = user[0].official_number;
      otpField = "official_number_otp";
    } else if (user[0].tpo_number && user[0].tpo_number!== "") {
      mobile = user[0].tpo_number;
      otpField = "tpo_number_otp";
    } else {
      return res.status(400).json({
        status: false,
        msg: "No mobile number found to send OTP"
      });
    }

    const otp = Math.floor(1000 + Math.random() * 9000);

    const content = `Your OTP for SkillsConnect is '${otp}' and is valid for 15 mins.
Please DO NOT share OTP with anyone to keep your account safe.
- UPSKILL TECH SOLUTIONS`;

    /* Send SMS */
    const smsSent = await sendNormalOTPMsg(mobile, content, otp);

    if (!smsSent) {
      return res.status(500).json({
        status: false,
        msg: "Failed to send OTP SMS"
      });
    }

    /* 2 Store OTP in correct column */
    await commonModel.updateData(
      "ups_college_onboarding_users",
      {
        [otpField]: otp,          
        updated_on: new Date(),   
        updated_by: 1
      },
      `id = ${id}`
    );

    return res.status(200).json({
      status: true,
      msg: "OTP sent successfully"
    });

  } catch (error) {
    console.error("Error in sendOtp:", error);
    return res.status(500).json({
      status: false,
      msg: "Internal Server Error"
    });
  }
};












export const verifyOtp = async (req, res) => {
  try {
    const { onboarding_user_id, otp } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        errors: errors.array()
      });
    }

    /* ================= FETCH USER ================= */
    const user = await commonModel.getData(
      "ups_college_onboarding_users",
      "id, official_number_otp, tpo_number_otp, updated_on",
      `id = ${onboarding_user_id}`
    );

    if (!user || user.length === 0) {
      return res.status(404).json({
        status: false,
        msg: "Onboarding user not found"
      });
    }

    let dbOtp = null;
    let otpField = null;

   
    if (user[0].official_number_otp) {
      dbOtp = user[0].official_number_otp;
      otpField = "official_number_otp";
    } else if (user[0].tpo_number_otp) {
      dbOtp = user[0].tpo_number_otp;
      otpField = "tpo_number_otp";
    } else {
      return res.status(400).json({
        status: false,
        msg: "OTP not found. Please resend OTP."
      });
    }console.log(dbOtp)

    /* ================= OTP MATCH ================= */
    if ((dbOtp) !== (otp)) {
      return res.status(400).json({
        status: false,
        msg: "Invalid OTP"
      });
    }

    /* ================= 15-MIN EXPIRY CHECK ================= */
    const sentAt = new Date(user[0].updated_on);
    const now = new Date();
    const diffMinutes = (now - sentAt) / (1000 * 60);

    if (diffMinutes > 15) {
      return res.status(400).json({
        status: false,
        msg: "OTP expired"
      });
    }

    /* ================= CLEAR ONLY VERIFIED OTP ================= */
    await commonModel.updateData(
      "ups_college_onboarding_users",
      {
        [otpField]: null,               
        // official_number_otp_status: "Yes",
        updated_on: new Date(),
        updated_by: 1
      },
      `id = ${onboarding_user_id}`
    );

    return res.status(200).json({
      status: true,
      msg: "OTP verified successfully"
    });

  } catch (error) {
    console.error("Error in verifyOtp:", error);
    return res.status(500).json({
      status: false,
      msg: "Internal Server Error"
    });
  }
};



export const resendOtp = async (req, res) => {
  try {
    const { onboarding_user_id } = req.body;

    /* ================= VALIDATION ================= */
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        errors: errors.array()
      });
    }

    /* ================= FETCH USER ================= */
    const user = await commonModel.getData(
      "ups_college_onboarding_users",
      "id, official_number, tpo_number",
      `id = ${onboarding_user_id}`
    );

    if (!user || user.length === 0) {
      return res.status(404).json({
        status: false,
        msg: "Onboarding user not found"
      });
    }

    const id = user[0].id;

    let mobile;
    let otpField;

    /* ✅ EXPLICIT NUMBER SELECTION (NO ||) */
    if (user[0].official_number && user[0].official_number!== "") {
      mobile = user[0].official_number;
      otpField = "official_number_otp";
    } else if (user[0].tpo_number && user[0].tpo_number !== "") {
      mobile = user[0].tpo_number;
      otpField = "tpo_number_otp";
    } else {
      return res.status(400).json({
        status: false,
        msg: "Mobile number not available"
      });
    }

    /* ================= GENERATE NEW OTP ================= */
    const otp = Math.floor(1000 + Math.random() * 9000);

    const content = `Your OTP for SkillsConnect is '${otp}' and is valid for 15 mins.
Please DO NOT share OTP with anyone to keep your account safe.
- UPSKILL TECH SOLUTIONS`;

    /* ================= SEND SMS ================= */
    const smsSent = await sendNormalOTPMsg(mobile, content, otp);

    if (!smsSent) {
      return res.status(500).json({
        status: false,
        msg: "Failed to resend OTP SMS"
      });
    }

    /* ================= UPDATE OTP & TIME ================= */
    await commonModel.updateData(
      "ups_college_onboarding_users",
      {
        [otpField]: otp,           // ✅ correct OTP column
        updated_on: new Date(),    // ⏱ resets 15-min window
        updated_by: 1
      },
      `id = ${id}`
    );

    return res.status(200).json({
      status: true,
      msg: "OTP resent successfully"
    });

  } catch (error) {
    console.error("Error in resendOtp:", error);
    return res.status(500).json({
      status: false,
      msg: "Internal Server Error"
    });
  }
};





export const getCollegeListing = async (req, res) => {
  try {
    const { college_name } = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        errors: errors.array()
      });
    }

    // if (!college_name) {
    //   return res.status(400).json({
    //     status: false,
    //     msg: "College name is required"
    //   });
    // }

    /* ================= SEARCH COLLEGES ================= */
    const CollegeName = college_name.replace(/'/g, "''");

    const condition = `
      college_name LIKE '%${CollegeName}%'
      
      AND status = 'Active'
    `;

    const colleges = await commonModel.getData(
      "ups_colleges",
      "id, college_name, verification_status",
      condition
    );

    /* ================= RESPONSE ================= */
    if (colleges && colleges.length > 0) {
      return res.status(200).json({
        status: true,
        type: "COLLEGE_FOUND",
        data: colleges
      });
    }

    // No college found → manual onboarding
    return res.status(200).json({
      status: true,
      type: "NO_COLLEGE_FOUND",
      msg: "No matching college found"
    });

  } catch (error) {
    console.error("Error in getCollegeListing:", error);
    return res.status(500).json({
      status: false,
      msg: "Internal Server Error"
    });
  }
};
















export const sendCollegeOtp = async (req, res) => {
  try {
    const { onboarding_user_id, ups_colleges_id } = req.body;
    console.log(onboarding_user_id, ups_colleges_id )

    /* ================= VALIDATION ================= */
    if (!onboarding_user_id || !ups_colleges_id) {
       console.log(onboarding_user_id, ups_colleges_id )
      return res.status(400).json({
        status: false,
        msg: "ups_colleges_id and onboarding_user_id required"
      });
    }

    /* ================= GET VERIFIED COLLEGE ================= */
    const collegeData = await commonModel.getData(
      "ups_colleges",
      "*",
      `id = ${ups_colleges_id} AND verification_status = 'Verified'`
    );

    if (!collegeData || collegeData.length === 0) {
      return res.status(404).json({
        status: false,
        msg: "Verified college not found",

      });
    }

    /* ================= GET VERIFIED TPO ================= */
    const tpoData = await commonModel.joinFetch(
      ["ups_users", ["ups_users.mobile"]],
      [
        [
          "LEFT",
          "ups_college_users_tpo_mapping ",
          "ups_college_users_tpo_mapping.user_id = ups_users.id",
          ["ups_college_users_tpo_mapping.master_college_id AS college_id"]
        ]
      ],
      `
        ups_college_users_tpo_mapping.master_college_id = ${ups_colleges_id}
        AND ups_users.user_type = 5
        AND ups_users.is_email_verified = 'Yes'
        AND ups_users.is_mobile_number_verified = 'Yes'
      `
    );

    if (!tpoData || tpoData.length === 0) {
      return res.status(404).json({
        status: false,
        msg: "No verified TPO found for this college"
      });
    }

    const tpoMobile = tpoData[0].mobile;

    /* ================= GENERATE OTP ================= */
    const otp = Math.floor(1111 + Math.random() * 8888);

    /* ================= PREPARE ONBOARDING DATA ================= */
    const onboardingPayload = {
      onboarding_user_id,
      college_id:ups_colleges_id,
      college_verificaiton_otp: otp,
      updated_by: 1,
      updated_on: new Date()
    };

    /* ================= CHECK EXISTING RECORD ================= */
    const existing = await commonModel.getData(
      "ups_colleges_onboarding",
      "id",
      `onboarding_user_id= ${onboarding_user_id}`
    );

    let onboardingId;

    if (existing && existing.length > 0) {
      // UPDATE
      await commonModel.updateData(
        "ups_colleges_onboarding",
        onboardingPayload,
        `id = ${existing[0].id}`
      );
      onboardingId = existing[0].id;
    } else {
      // INSERT
      onboardingPayload.created_by = 1;
      onboardingPayload.created_on = new Date();
      onboardingPayload.slug = collegeData[0].college_name;
      onboardingPayload.college_name = collegeData[0].college_name;
      onboardingPayload.sequence = 0;
      onboardingPayload.email = collegeData[0].college_email;
      onboardingPayload.mobile = collegeData[0].college_contact;
      onboardingPayload.college_profile = collegeData[0].college_profile;
      onboardingPayload.website = collegeData[0].website;
      onboardingPayload.college_description = collegeData[0].college_description;
      // onboardingPayload.college_verificaiton_otp = otp;
      onboardingPayload.college_verificaiton_otp_status = "NO";
      onboardingPayload.registered_from = collegeData[0].registered_from;
      onboardingPayload.country_id = collegeData[0].country_id;
      onboardingPayload.state_id = collegeData[0].state_id;
      onboardingPayload.city_id = collegeData[0].city_id;
      onboardingPayload.pincode = collegeData[0].pincode;
      onboardingPayload.fl_pitch = collegeData[0].fl_pitch;
      onboardingPayload.college_short_name = collegeData[0].college_short_name;
      onboardingPayload.college_address = collegeData[0].college_address;
      onboardingPayload.naac = collegeData[0].naac;
      onboardingId = await commonModel.insertData(
        "ups_colleges_onboarding",
        onboardingPayload,
        // sequence: 0,
        // college_name,
        // slug: collegeData[0].college_name,
        // email: collegeData[0].college_email,
        // mobile: collegeData[0].college_contact,
        // college_profile: collegeData[0].college_profile,
        // website: collegeData[0].website,
        // college_description: collegeData[0].college_description,
        // college_verificaiton_otp: otp,
        // college_verificaiton_otp_status: "NO",
        // registered_from: collegeData[0].registered_from,
        // country_id: collegeData[0].country_id,
        // state_id: collegeData[0].state_id,
        // city_id: collegeData[0].city_id,
        // pincode: collegeData[0].pincode,
        // fl_pitch: collegeData[0].fl_pitch,
        // college_short_name: collegeData[0].college_short_name,
        // college_address: collegeData[0].college_address,
        // naac: collegeData[0].naac


      );
    }

    /* ================= SEND OTP ================= */
    const content = `Your OTP for SkillsConnect is ${otp} and is valid for 15 mins.
Please DO NOT share OTP with anyone.
- UPSKILL TECH SOLUTIONS`;

    const smsSent = await sendNormalOTPMsg(
      tpoMobile,
      content,
      "College Onboarding Mobile Verification",
      otp
    );

    if (!smsSent) {
      return res.status(500).json({
        status: false,
        msg: "Failed to send OTP"
      });
    }

    /* ================= SUCCESS RESPONSE ================= */
    return res.status(200).json({
      status: true,
      msg: "OTP sent successfully to college TPO",
      ups_college_onboarding_id: onboardingId,
      masked_mobile: tpoMobile.replace(/(\d{2})\d{6}(\d{2})/, "$1******$2")
    });

  } catch (error) {
    console.error("Error in sendCollegeOtp:", error);
    return res.status(500).json({
      status: false,
      msg: "Internal Server Error"
    });
  }
};








export const verifyCollegeOtp = async (req, res) => {
  try {
    const { onboarding_user_id, college_verification_otp } = req.body;

    /* ================= VALIDATION ================= */
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        errors: errors.array()
      });
    }

    if (!onboarding_user_id || !college_verification_otp) {
      console.log(onboarding_user_id, college_verification_otp,ups_colleges_id)
      return res.status(400).json({
        status: false,
        msg: "onboarding_user_id  and OTP are required"
      });
    }

    /* ================= GET COLLEGE ================= */
    const college = await commonModel.getData(
      "ups_colleges",
      "id",
      `
        
         verification_status = 'Verified'
        AND status = 'Active'
      `
    );

    if (!college || college.length === 0) {
      return res.status(404).json({
        status: false,
        msg: "College not found or not verified"
      });
    }

    const collegeId = college[0].id;

    /* ================= GET ONBOARDING RECORD ================= */
    const data = await commonModel.getData(
      "ups_colleges_onboarding",
      "id, college_verificaiton_otp, college_verificaiton_otp_status, updated_on",
      `onboarding_user_id = ${onboarding_user_id}`
    );

    if (!data || data.length === 0) {
      return res.status(404).json({
        status: false,
        msg: "Onboarding record not found"
      });
    }

    const record = data[0];

    /* ================= ALREADY VERIFIED ================= */
    if (record.college_verificaiton_otp_status === "Yes") {
      return res.status(200).json({
        status: true,
        msg: "College already verified"
      });
    }

    /* ================= OTP MATCH ================= */
    if (
      (record.college_verificaiton_otp) !==
      (college_verification_otp)
    ) {
      console.log(record.college_verificaiton_otp)
      return res.status(400).json({
        status: false,
        msg: "Incorrect OTP"
      });
    }

    /* ================= OTP EXPIRY CHECK (15 MIN) ================= */
    const now = new Date();
    const otpTime = new Date(record.updated_on);
    const diffMinutes = (now - otpTime) / (1000 * 60);

    if (diffMinutes > 15) {
      return res.status(400).json({
        status: false,
        msg: "OTP expired"
      });
    }

    /* ================= UPDATE STATUS ================= */
    await commonModel.updateData(
      "ups_colleges_onboarding",
      {
        college_verificaiton_otp_status: "Yes",
        college_verificaiton_otp: null,
        updated_by: 1,
        updated_on: new Date()
      },
      `id = ${record.id}`
    );

    return res.status(200).json({
      status: true,
      msg: "College OTP verified successfully",
      ups_college_onboarding_id: record.id
    });

  } catch (error) {
    console.error("Error in verifyCollegeOtp:", error);
    return res.status(500).json({
      status: false,
      msg: "Internal Server Error"
    });
  }
};



export const resendCollegeOtp = async (req, res) => {
  try {
    const { onboarding_user_id,ups_colleges_id } = req.body;

    /* ================= VALIDATION ================= */
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        errors: errors.array()
      });
    }

    /* ================= GET COLLEGE ================= */
    const collegeData = await commonModel.getData(
      "ups_colleges",
      "*",
      `id = ${ups_colleges_id} AND verification_status = 'Verified'`
    );

    if (!collegeData || collegeData.length === 0) {
      return res.status(404).json({
        status: false,
        msg: "Verified college not found",

      });
    }
     const tpoData = await commonModel.joinFetch(
      ["ups_users", ["ups_users.mobile"]],
      [
        [
          "LEFT",
          "ups_college_users_tpo_mapping ",
          "ups_college_users_tpo_mapping.user_id = ups_users.id",
          ["ups_college_users_tpo_mapping.master_college_id AS college_id"]
        ]
      ],
      `
        ups_college_users_tpo_mapping.master_college_id = ${ups_colleges_id}
        AND ups_users.user_type = 5
        AND ups_users.is_email_verified = 'Yes'
        AND ups_users.is_mobile_number_verified = 'Yes'
      `
    );

    if (!tpoData || tpoData.length === 0) {
      return res.status(404).json({
        status: false,
        msg: "No verified TPO found for this college"
      });
    }

    const tpoMobile = tpoData[0].mobile;

    

    /* ================= GET ONBOARDING ================= */
    const onboarding = await commonModel.getData(
      "ups_colleges_onboarding",
      "id",
      `onboarding_user_id = ${onboarding_user_id}`
    );

    if (!onboarding || onboarding.length === 0) {
      return res.status(404).json({
        status: false,
        msg: "Onboarding record not found for this college"
      });
    }

    // const onboardingId = onboarding[0].id;

    /* ================= GENERATE OTP ================= */
    const otp = Math.floor(1000 + Math.random() * 9000);

    /* ================= UPDATE OTP ================= */
    await commonModel.updateData(
      "ups_colleges_onboarding",
      {
        college_verificaiton_otp: otp,
        college_verificaiton_otp_status: "NO",
        updated_by: 1,
        updated_on: new Date()
      },
      `onboarding_user_id = ${onboarding_user_id}`
    );

    /* ================= SEND OTP ================= */
    const content = `Your OTP for SkillsConnect is '${otp}' and is valid for 15 mins.
Please DO NOT share OTP with anyone.
- UPSKILL TECH SOLUTIONS`;

    const smsSent = await sendNormalOTPMsg(
      tpoMobile,
      content,
      "College Onboarding Mobile Verification",
      otp
    );

    if (!smsSent) {
      return res.status(500).json({
        status: false,
        msg: "Failed to resend OTP"
      });
    }

    return res.status(200).json({
      status: true,
      msg: "OTP resent successfully",
      
    });

  } catch (error) {
    console.error("Error in resendCollegeOtp:", error);
    return res.status(500).json({
      status: false,
      msg: "Internal Server Error"
    });
  }
};


export const getCollegePrefillData = async (req, res) => {
  try {
    const { college_id } = req.body;

    /* ================= VALIDATION ================= */
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        errors: errors.array()
      });
    }

    /* ================= GET COLLEGE (BY ID) ================= */
    const college = await commonModel.getData(
      "ups_colleges",
      `
        id,
        college_name,
        college_email,
        college_contact,
        website,
        college_profile,
        college_description,
        country_id,
        state_id,
        city_id,
        pincode,
        college_short_name,
        college_address,
        fl_pitch,
        naac,
        registered_from,
        status
      `,
      `id = ${college_id}`
    );

    if (!college || college.length === 0) {
      return res.status(404).json({
        status: false,
        msg: "College not found"
      });
    }

    /* ================= SUCCESS ================= */
    return res.status(200).json({
      status: true,
      data: college[0]
    });

  } catch (error) {
    console.error("Error in getCollegePrefillData:", error);
    return res.status(500).json({
      status: false,
      msg: "Internal Server Error"
    });
  }
};









export const saveManualCollegeDetails = async (req, res) => {
  try {
    const {
      onboarding_user_id,
      college_name,
      state_id,
      city_id,
      pincode,
      website,
      college_short_name,
      college_address,
      fl_pitch,
      naac




    } = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        errors: errors.array()
      });
    }

    /* ---------- check onboarding user ---------- */
    const user = await commonModel.getData(
      "ups_college_onboarding_users",
      "official_name",
      `id = ${onboarding_user_id}`
    );

    if (!user) {
      return res.status(404).json({
        status: false,
        msg: "Onboarding user not found"
      });
    }


    /* ---------- insert into ups_colleges_onboarding ---------- */
    const onboardingCollegeId = await commonModel.insertData(
      "ups_colleges_onboarding",
      {
        onboarding_user_id,
        college_name,
        slug: college_name,
        state_id,
        college_profile: college_name,
        email: '',
        mobile: '',
        college_description: '',
        country_id: "0",
        city_id,
        pincode,
        website,
        college_short_name,
        college_address,
        fl_pitch,
        naac,
        verification_status: "Assigned",
        sequence: 0,
        registered_from: user[0].official_name,
        created_by: 1,
        created_on: new Date(),
        updated_by: 1,
        updated_on: new Date()
      }
    );

    // /* ---------- insert courses ---------- */
    // if (Array.isArray(courses) && courses.length > 0) {
    //   for (const row of courses) {
    //     await commonModel.insertData(
    //       "ups_college_onboarding_course_specialization",
    //       {
    //         ups_college_onboarding_id: onboardingCollegeId,
    //         course_id: row.course_id,
    //         specialization_id: row.specialization_id,
    //         // created_by: 1,
    //         created_on: new Date(),
    //         // updated_by: 1,
    //         updated_on: new Date()
    //       }
    //     );
    //   }
    // }

    return res.status(200).json({
      status: true,
      msg: "Manual college details saved successfully",
      ups_college_onboarding_id: onboardingCollegeId
    });

  } catch (error) {
    console.error("Error in saveManualCollegeDetails:", error);
    return res.status(500).json({
      status: false,
      msg: "Internal Server Error"
    });
  }
};



export const saveOnboardingCourseSpecialization = async (req, res) => {
  try {
    const {
      ups_college_onboarding_id,
      course_id,
      specialization_id
    } = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        errors: errors.array()
      });
    }

    /* ----- avoid duplicates ----- */
    const exists = await commonModel.getData(
      "ups_college_onboarding_course_specialization",
      "id",
      `
        ups_college_onboarding_id = ${ups_college_onboarding_id}
        AND course_id = ${course_id}
        AND specialization_id = ${specialization_id}
      `
    );

    if (exists) {
      return res.status(409).json({
        status: false,
        msg: "Course with specialization already added"
      });
    }

    /* ----- insert ----- */
    await commonModel.insertData(
      "ups_college_onboarding_course_specialization",
      {
        ups_college_onboarding_id,
        course_id,
        specialization_id,
        created_on: new Date(),
        updated_on: new Date()
      }
    );

    return res.status(201).json({
      status: true,
      msg: "Course & specialization added successfully"
    });

  } catch (error) {
    console.error("Error in saveOnboardingCourseSpecialization:", error);
    return res.status(500).json({
      status: false,
      msg: "Internal Server Error"
    });
  }
};


export const getOnboardingAddedCourses = async (req, res) => {
  try {
    const { ups_college_onboarding_id } = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        errors: errors.array()
      });
    }

    const courses = await commonModel.joinFetch(
      ["ups_college_onboarding_course_specialization ", [
        "ups_college_onboarding_course_specialization.id",
        "c.course_name",
        "s.specilization_name"
      ]],
      [
        [
          "LEFT",
          "ups_courses c",
          "c.id = ups_college_onboarding_course_specialization.course_id",
          []
        ],
        [
          "LEFT",
          "ups_courses_specialization s",
          "s.id = ups_college_onboarding_course_specialization.specialization_id",
          []
        ]
      ],
      `ups_college_onboarding_course_specialization.ups_college_onboarding_id = ${ups_college_onboarding_id}`
    );

    return res.status(200).json({
      status: true,
      data: courses || []
    });




  } catch (error) {
    console.error("Error in getOnboardingAddedCourses:", error);
    return res.status(500).json({
      status: false,
      msg: "Internal Server Error"
    });
  }
};


export const submit = async (req, res) => {
  try {
    const { ups_college_onboarding_id } = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        errors: errors.array()
      });
    }

    /* ---------- fetch onboarding user ---------- */
    const users = await commonModel.getData(
      "ups_college_onboarding_users",
      `
        official_name,
        official_email,
        tpo_official_email
      `,
      `id = '${ups_college_onboarding_id}'`
    );

    if (!users || users.length === 0) {
      return res.status(404).json({
        status: false,
        msg: "Onboarding user not found"
      });
    }

    const user = users[0];

    /* ---------- emails ---------- */
    const registeredUserEmail = user.official_email;
    const tpoEmail = user.tpo_official_email || user.official_email;
    const adminEmail = process.env.ADMIN_EMAIL;

    /* ---------- templates ---------- */
    const userMailHtml = `
      <p>Hello ${user.official_name || ""},</p>
      <p>Thank you for registering with <b>SkillsConnect</b>.</p>
      <p>Your registration has been completed successfully.</p>
      <br/>
      <p>Regards,<br/>SkillsConnect Team</p>
    `;

    const adminMailHtml = `
      <p>Hello Admin,</p>
      <p>A new college has registered.</p>
      <ul>
        <li>Name: ${user.official_name || "N/A"}</li>
        <li>Email: ${registeredUserEmail || "N/A"}</li>
      </ul>
    `;

    const tpoMailHtml = `
      <p>Hello ${user.official_name || ""},</p>
      <p>Thank you for registering with <b>SkillsConnect</b>.</p>
      <p>Your registration has been completed successfully.</p>
      <br/>
      <p>Regards,<br/>SkillsConnect Team</p>
    
    `;
    console.log(registeredUserEmail, tpoEmail)
    /* ---------- send mails ---------- */
    if (registeredUserEmail) {
      await sendEmail({
        to: registeredUserEmail,
        subject: "Registration Successful - SkillsConnect",
        html: userMailHtml
      });
    }

    if (tpoEmail) {
      await sendEmail({
        to: tpoEmail,
        subject: "New College Registration - SkillsConnect",
        html: tpoMailHtml
      });
    }

    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: "New College Registered - SkillsConnect",
        html: adminMailHtml
      });
    }

    return res.status(200).json({
      status: true,
      msg: "Emails sent successfully"
    });

  } catch (error) {
    console.error("Submit error:", error);
    return res.status(500).json({
      status: false,
      msg: "Internal server error"
    });
  }
};





export const getCourses = async (req, res) => {
  try {
    const data = await commonModel.getData(
      "ups_courses",
      "id, course_name as name",
      "status = 'Active'"
    );

    return res.status(200).json({
      status: true,
      data
    });
  } catch (error) {
    console.error("Error in getRegister:", error);
    return res.status(500).json({
      status: false,
      msg: "Internal Server Error"
    });
  }
};


export const getspecilization = async (req, res) => {
  try {
    const course_id = req.params.id;
    const data = await commonModel.getData(
      "ups_courses_specialization",
      "id, specilization_name",
      `status = 'Active' AND course_id = '${course_id}'`
    );

    return res.status(200).json({
      status: true,
      data
    });
  } catch (error) {
    console.error("Error in getRegister:", error);
    return res.status(500).json({
      status: false,
      msg: "Internal Server Error"
    });
  }
};

export const getstate = async (req, res) => {
  try {
    const course_id = req.params.id;
    const data = await commonModel.getData(
      "ups_states",
      "id,name",
      `status = 'Active'`
    );

    return res.status(200).json({
      status: true,
      data
    });
  } catch (error) {
    console.error("Error in getRegister:", error);
    return res.status(500).json({
      status: false,
      msg: "Internal Server Error"
    });
  }
};




export const getcity = async (req, res) => {
  try {
    const state_id = req.params.id;
    const data = await commonModel.getData(
      "ups_cities",
      "id,name",
      `status = 'Active' AND state_id = '${state_id}'`
    );

    return res.status(200).json({
      status: true,
      data
    });
  } catch (error) {
    console.error("Error in getRegister:", error);
    return res.status(500).json({
      status: false,
      msg: "Internal Server Error"
    });
  }
};