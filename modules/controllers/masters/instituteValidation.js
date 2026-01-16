import { body } from 'express-validator';





export const validateInstituteRegistrationStepOne = [

  /* ================= register_by ================= */
  body("register_by")
    .notEmpty().withMessage("Register by is required"),

  /* ================= CONDITIONAL VALIDATION ================= */
  body().custom((value, { req }) => {

    const { register_by } = req.body;

    /* ---------- COMMON ---------- */
    if (!req.body.institute_type) {
      throw new Error("Institute type is required");
    }

    if (!req.body.password) {
      throw new Error("Password is required");
    }

    if (req.body.password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    if (!req.body.college_name) {
      throw new Error("College name is required");
    }

    /* ---------- COLLEGE TPO ---------- */
    if (register_by === "College TPO") {

      if (!req.body.tpo_name) {
        throw new Error("TPO name is required");
      }

      if (!req.body.tpo_email) {
        throw new Error("TPO email is required");
      }

      if (!/^\S+@\S+\.\S+$/.test(req.body.tpo_email)) {
        throw new Error("Invalid TPO email");
      }

      if (!req.body.tpo_mobile) {
        throw new Error("TPO mobile number is required");
      }

      if (!/^\d{10}$/.test(req.body.tpo_mobile)) {
        throw new Error("TPO mobile must be 10 digits");
      }

    } else {
      /* ---------- OTHER ROLES ---------- */

      if (!req.body.name) {
        throw new Error("Name is required");
      }

      if (!req.body.official_email) {
        throw new Error("Official email is required");
      }

      if (!/^\S+@\S+\.\S+$/.test(req.body.official_email)) {
        throw new Error("Invalid official email");
      }

      if (!req.body.mobile_number) {
        throw new Error("Mobile number is required");
      }

      if (!/^\d{10}$/.test(req.body.mobile_number)) {
        throw new Error("Mobile number must be 10 digits");
      }
    }

    return true;
  })
];



 



export const validateAddTpoDetails = [
  body("onboarding_user_id")
    .notEmpty().withMessage("Onboarding user id is required")
    .isInt().withMessage("Onboarding user id must be numeric"),

  body("tpo_name")
    .notEmpty().withMessage("TPO name is required"),

  body("tpo_email")
    .notEmpty().withMessage("TPO email is required")
    .isEmail().withMessage("Invalid TPO email"),

  body("tpo_mobile")
    .notEmpty().withMessage("TPO mobile number is required")
    .isLength({ min: 10, max: 10 })
    .withMessage("TPO mobile must be 10 digits"),

  body("tpo_password")
    .notEmpty().withMessage("TPO password is required")
    .isLength({ min: 8 })
    .withMessage("TPO password must be at least 6 characters"),
];



export const validateSendOtp = [
  body("onboarding_user_id")
    .notEmpty().withMessage("Onboarding user id required")
    .isInt().withMessage("Onboarding user id must be numeric"),
];


export const validateVerifyOtp = [
  body("onboarding_user_id")
    .notEmpty().withMessage("Onboarding user id required")
    .isInt().withMessage("Onboarding user id required"),

   body("otp")
    .notEmpty().withMessage(" OTP required")
    .isInt().withMessage("OTP requiredc"), 
];


export const validateverifyCollegeOtp = [
  body("onboarding_user_id")
    .notEmpty().withMessage("onboarding_user_id is required"),
    body("college_verification_otp")
    .notEmpty().withMessage("college_verification_otp is required")
    
];

export const validatsendCollegeOtp = [
  body("onboarding_user_id")
    .notEmpty().withMessage("onboarding_user_id is required"),
    body("ups_colleges_id")
    .notEmpty().withMessage("ups_colleges_id")
    
];

export const validatePrefill=[
  body("college_id")
    .notEmpty().withMessage("College id is required")

]

export const validateGetColleges=[
    body("college_name")
    .notEmpty().withMessage("College name is required")

]
export const validateSubmit = [
  body("ups_college_onboarding_id")
    .notEmpty().withMessage("Onboarding id required")
    .isInt().withMessage("Onboarding id must be numeric"),
];
export const validateManualForm = [
  body("onboarding_user_id")
    .notEmpty().withMessage("onboarding_user_id is requires")
    .isInt().withMessage("Onboarding id must be numeric"),
  
  body("college_name")
    .notEmpty().withMessage("College name is required")  
];

export const validateCourses = [
  body("ups_college_onboarding_id")
    .notEmpty().withMessage("ups_college_onboarding_idis requires")
    .isInt().withMessage("ups_college_onboarding_id must be numeric"),

  body("course_id")
    .notEmpty().withMessage("course_id is requires")
    .isInt().withMessage("course_id must be numeric"),
    
  body("ups_college_onboarding_id")
    .notEmpty().withMessage("course_id is requires")
    .isInt().withMessage("course_id must be numeric"),  
  
  
];


export default {validateInstituteRegistrationStepOne,validateAddTpoDetails,validateSendOtp,validateSubmit,validateVerifyOtp,validateGetColleges,validateverifyCollegeOtp,validateManualForm,validateCourses,validatePrefill};
console.log("VALIDATOR HIT");


