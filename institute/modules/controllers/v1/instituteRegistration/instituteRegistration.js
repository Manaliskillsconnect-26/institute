import commonModel from "../../../../commonModel.js/commonModel.js";
import { hashPassword } from "../../../../utils/password.js";
import { sendNormalOTPMsg } from "../../../../helper/otp.js";



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
    const {
      register_by,
      institute_type,
      name,
      personal_email,
      official_email,
      mobile_number,
      password,
      college_name,

      // TPO fields
      tpo_name,
      tpo_email,
      tpo_mobile,
      tpo_password
    } = req.body;

    /* ================= MAP register_by → user_type ================= */
    const userTypeMap = {
      "College TPO": 5,
      "College Student Coordinator": 6,
      "Principal": 3,
      "Chairman": 4,
      "Dean": 7
    };

    const user_type = userTypeMap[register_by];

    /* ================= PASSWORD HANDLING ================= */
    finalPassword = await hashPassword(tpo_password);

    /* ================= DUPLICATE EMAIL CHECK ================= */
    const existing = await commonModel.getData(
      "ups_college_onboarding_users",
      "id",
      `official_email = '${official_email.replace(/'/g, "''")}'`
    );

    if (existing) {
      return res.status(409).json({
        status: false,
        msg: "Official email already registered"
      });
    }

    /* ================= INSERT DATA ================= */
    const insertData = {
      institute_type: institute_type || null,
      user_type,

      official_name: register_by === "College TPO" ? tpo_name : name,
      personal_email: personal_email || null,
      official_email,
      official_number: mobile_number,

      password: finalPassword,
      college_name: register_by === "College TPO" ? null : college_name,

      // TPO specific
      tpo_name: register_by === "College TPO" ? tpo_name : null,
      tpo_official_email: register_by === "College TPO" ? tpo_email : null,
      tpo_number: register_by === "College TPO" ? tpo_mobile : null,

      created_by: 0,
      updated_by: 0,
      created_on: new Date()
    };

    const insertId = await commonModel.insertData(
      "ups_college_onboarding_users",
      insertData
    );

    /* ================= SUCCESS ================= */
    return res.status(201).json({
      status: true,
      msg: "Registration completed successfully",
      data: {
        onboarding_user_id: insertId,
        register_by
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

        /* ---------- validations ---------- */
        if (!onboarding_user_id)
            return res.status(400).json({ status: false, msg: "Onboarding user id is required" });

        if (!tpo_name)
            return res.status(400).json({ status: false, msg: "TPO name is required" });

        if (!tpo_email)
            return res.status(400).json({ status: false, msg: "TPO email is required" });

        if (!tpo_mobile)
            return res.status(400).json({ status: false, msg: "TPO mobile number is required" });

        if (!tpo_password)
            return res.status(400).json({ status: false, msg: "TPO password is required" });

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

    if (!onboarding_user_id) {
      return res.status(400).json({
        status: false,
        msg: "Onboarding user id required"
      });
    }

    const user = await commonModel.getData(
      "ups_college_onboarding_users",
      "id, official_number",
      `id = ${onboarding_user_id}`
    );

    if (!user) {
      return res.status(404).json({
        status: false,
        msg: "User not found"
      });
    }

    const id = user[0].id;                 
    const mobile = user[0].official_number;
    const otp = Math.floor(1000 + Math.random() * 9000);

    const content = `Your OTP for SkillsConnect is '${otp}' and is valid for 15 mins.
Please DO NOT share OTP with anyone to keep your account safe.
- UPSKILL TECH SOLUTIONS`;

    /* 1️⃣ Send SMS */
    const smsSent = await sendNormalOTPMsg(mobile, content, otp);

    if (!smsSent) {
      return res.status(500).json({
        status: false,
        msg: "Failed to send OTP SMS"
      });
    }

    /* 2️⃣ ONLY UPDATE OTP (NOT INSERT ID) */
    await commonModel.updateData(
      "ups_college_onboarding_users",
      {
        official_number_otp: otp,           
        // official_number_otp_status: null,
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

    /* ================= VALIDATION ================= */
    if (!onboarding_user_id || !otp) {
      return res.status(400).json({
        status: false,
        msg: "Onboarding user id and OTP are required"
      });
    }

    /* ================= FETCH USER ================= */
    const user = await commonModel.getData(
      "ups_college_onboarding_users",
      "id, official_number_otp, tpo_number_otp",
      `id = ${onboarding_user_id}`
    );

    if (!user) {
      return res.status(404).json({
        status: false,
        msg: "Onboarding user not found"
      });
    }

    const dbOtp =
      user[0].official_number_otp || user[0].tpo_number_otp;

    /* ================= OTP CHECK ================= */
    if (String(dbOtp) !== String(otp)) {
      return res.status(400).json({
        status: false,
        msg: "Invalid OTP"
      });
    }

    /* ================= MARK VERIFIED ================= */
    // await commonModel.updateData(
    //   "ups_college_onboarding_users",
    //   {
    //     official_number_otp: otp,
    //     updated_on: new Date(),
    //     updated_by: 1
    //   },
    //   `id = ${onboarding_user_id}`
    // );

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




export const getCollegeListing = async (req, res) => {
  try {
    const { onboarding_user_id } = req.body;

    if (!onboarding_user_id) {
      return res.status(400).json({
        status: false,
        msg: "Onboarding user id required"
      });
    }

    /* ================= FETCH ONBOARDING USER ================= */
    const onboardingUser = await commonModel.getData(
      "ups_colleges",
      "college_name",
      `id = ${onboarding_user_id}`
    );

    if (!onboardingUser) {
      return res.status(404).json({
        status: false,
        msg: "Onboarding user not found"
      });
    }

    const collegeName = onboardingUser[0].college_name;

    /* ================= SEARCH COLLEGES ================= */
    const condition = `
      college_name LIKE '%${collegeName.replace(/'/g, "''")}%'
      AND verification_status = 'Verified'
      AND status = 'Active'
    `;

    const colleges = await commonModel.getData(
      "ups_colleges",
      "id, college_name, verification_status",
      condition
    );

    /* ================= RESPONSE ================= */
    if (colleges) {
      return res.status(200).json({
        status: true,
        type: "COLLEGE_FOUND",
        data: colleges
      });
    }

    // No college found → go to manual onboarding
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
    const { onboarding_user_id, college_id } = req.body;

    if (!onboarding_user_id || !college_id) {
      return res.status(400).json({
        status: false,
        msg: "onboarding_user_id and college_id required"
      });
    }

    /* ================= GET VERIFIED COLLEGE ================= */
    const college = await commonModel.getData(
      "ups_colleges",
      "id, college_name",
      `id = ${college_id} AND verification_status = 'Verified'`
    );

    if (!college) {
      return res.status(404).json({
        status: false,
        msg: "Verified college not found"
      });
    }

    /* ================= GET VERIFIED TPO MOBILE ================= */
    const tpoData = await commonModel.joinFetch(
      ["ups_users", ["ups_users.mobile"]],
      [
        [
          "LEFT",
          "ups_college_users_tpo_mapping cutm",
          "cutm.user_id = ups_users.id",
          []
        ]
      ],
      `
        cutm.master_college_id = ${college_id}
        AND ups_users.user_type = 5
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
    const otp = Math.floor(1000 + Math.random() * 9000);

    /* ================= UPSERT COLLEGE ONBOARDING ================= */
    const existing = await commonModel.getData(
      "ups_colleges_onboarding",
      "id",
      `college_id = ${college_id} AND onboarding_user_id = ${onboarding_user_id}`
    );

    let onboardingId;

    if (existing) {
      await commonModel.updateData(
        "ups_colleges_onboarding",
        {
          college_verificaiton_otp: otp,
          updated_by: 1,
          updated_on: new Date()
        },
        `id = ${existing[0].id}`
      );
      onboardingId = existing[0].id;
    } else {
      onboardingId = await commonModel.insertData(
        "ups_colleges_onboarding",
        {
          onboarding_user_id,
          college_id,
          college_verificaiton_otp: otp,
          created_by: 1,
          created_on: new Date(),
          updated_by: 1,
          updated_on: new Date()
        }
      );
    }

    /* ================= SEND OTP ================= */
    const content = `Your OTP for SkillsConnect is '${otp}' and is valid for 15 mins.
Please DO NOT share OTP with anyone.
- UPSKILL TECH SOLUTIONS`;

    const smsSent = await sendNormalOTPMsg(tpoMobile, content, otp);

    if (!smsSent) {
      return res.status(500).json({
        status: false,
        msg: "Failed to send OTP"
      });
    }

    return res.status(200).json({
      status: true,
      msg: "OTP sent successfully to college TPO",
      ups_college_onboarding_id: onboardingId
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
    const { ups_college_onboarding_id, college_verification_otp } = req.body;

    if (!ups_college_onboarding_id || !college_verification_otp) {
      return res.status(400).json({
        status: false,
        msg: "OTP and onboarding id required"
      });
    }

    /* ================= GET ONBOARDING RECORD ================= */
    const data = await commonModel.getData(
      "ups_colleges_onboarding",
      "id, college_verificaiton_otp, college_verificaiton_otp_status",
      `id = ${ups_college_onboarding_id}`
    );

    if (!data) {
      return res.status(404).json({
        status: false,
        msg: "Onboarding record not found"
      });
    }

    /* ================= ALREADY VERIFIED ================= */
    if (data[0].college_verificaiton_otp_status === "Yes") {
      return res.status(200).json({
        status: true,
        msg: "College already verified"
      });
    }

    /* ================= OTP MATCH ================= */
    if (
      String(data[0].college_verificaiton_otp) !==
      String(college_verification_otp)
    ) {
      return res.status(400).json({
        status: false,
        msg: "Incorrect OTP"
      });
    }

    /* ================= UPDATE STATUS ================= */
    await commonModel.updateData(
      "ups_colleges_onboarding",
      {
        college_verificaiton_otp_status: "Yes",
        college_verificaiton_otp: null, // invalidate OTP
        updated_by: 1,
        updated_on: new Date()
      },
      `id = ${ups_college_onboarding_id}`
    );

    return res.status(200).json({
      status: true,
      msg: "College OTP verified successfully"
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
    const { ups_college_onboarding_id } = req.body;

    if (!ups_college_onboarding_id) {
      return res.status(400).json({
        status: false,
        msg: "ups_college_onboarding_id required"
      });
    }

    /* ================= GET ONBOARDING RECORD ================= */
    const onboarding = await commonModel.getData(
      "ups_colleges_onboarding",
      "id, college_id, onboarding_user_id",
      `id = ${ups_college_onboarding_id}`
    );

    if (!onboarding) {
      return res.status(404).json({
        status: false,
        msg: "Onboarding record not found"
      });
    }

    const { college_id } = onboarding[0];

    /* ================= GET VERIFIED TPO MOBILE ================= */
    const tpo = await commonModel.joinFetch(
      ["ups_users u", ["u.mobile"]],
      [
        [
          "LEFT",
          "ups_college_users_tpo_mapping cutm",
          "cutm.user_id = u.id",
          []
        ]
      ],
      `
        cutm.master_college_id = ${college_id}
        AND u.user_type = 5
        AND u.is_mobile_number_verified = 'Yes'
      `
    );

    if (!tpo || !tpo.length) {
      return res.status(404).json({
        status: false,
        msg: "Verified TPO not found for this college"
      });
    }

    const tpoMobile = tpo[0].mobile;

    /* ================= GENERATE NEW OTP ================= */
    const otp = Math.floor(1000 + Math.random() * 9000);

    /* ================= UPDATE OTP ================= */
    await commonModel.updateData(
      "ups_colleges_onboarding",
      {
        college_verificaiton_otp: otp,
        college_verificaiton_otp_status: "No",
        updated_by: 1,
        updated_on: new Date()
      },
      `id = ${ups_college_onboarding_id}`
    );

    /* ================= SEND SMS ================= */
    const content = `Your OTP for SkillsConnect is ${otp}. 
Valid for 15 mins. Please do not share it.`;

    const smsSent = await sendNormalOTPMsg(tpoMobile, content, otp);

    if (!smsSent) {
      return res.status(500).json({
        status: false,
        msg: "Failed to resend OTP"
      });
    }

    return res.status(200).json({
      status: true,
      msg: "OTP resent successfully"
    });

  } catch (error) {
    console.error("Error in resendCollegeOtp:", error);
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
      courses,
      
      email,
     
      
      
      
    } = req.body;

    if (!onboarding_user_id || !college_name) {
      return res.status(400).json({
        status: false,
        msg: "onboarding_user_id and college_name required"
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
        slug:college_name,
        state_id,
        college_profile:college_name,
        email:'',
        mobile:'',
        college_description:'',
        country_id:"0",
        city_id,
        pincode,
        website,
        verification_status: "Assigned",
        sequence:0,
        registered_from: user[0].official_name,
        created_by: 1,
        created_on: new Date(),
        updated_by: 1,
        updated_on: new Date()
      }
    );

    /* ---------- insert courses ---------- */
    if (Array.isArray(courses) && courses.length > 0) {
      for (const row of courses) {
        await commonModel.insertData(
          "ups_college_onboarding_course_specialization",
          {
            ups_college_onboarding_id: onboardingCollegeId,
            course_id: row.course_id,
            specialization_id: row.specialization_id,
            // created_by: 1,
            created_on: new Date(),
            // updated_by: 1,
            updated_on: new Date()
          }
        );
      }
    }

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

    if (!ups_college_onboarding_id || !course_id || !specialization_id) {
      return res.status(400).json({
        status: false,
        msg: "onboarding id, course id and specialization id required"
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

    if (!ups_college_onboarding_id) {
      return res.status(400).json({
        status: false,
        msg: "onboarding id required"
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









