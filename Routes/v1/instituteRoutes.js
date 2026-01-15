import express from "express";
import {
  getRegister,
  getInstituteType,
  instituteRegistrationStepOne,
  addTpoDetails,
  sendOtp,
  verifyOtp,
  resendOtp,
  getCollegeListing,
  sendCollegeOtp,
  verifyCollegeOtp,
  resendCollegeOtp,
  saveManualCollegeDetails,
  getOnboardingAddedCourses,
  submit,
  // saveCollegeCourses,
  // finalizeInstituteOnboarding,
  saveOnboardingCourseSpecialization,
  getCollegePrefillData,
  getspecilization,
  getCourses,
  getstate,
  getcity,
  
  
  // submitInstituteOnboarding
} from "../../modules/controllers/v1/instituteRegistration/instituteRegistration.js";
import {
  validateInstituteRegistrationStepOne,
  validateAddTpoDetails,
  validateSendOtp,
  validateVerifyOtp,
  validateGetColleges,
  validateverifyCollegeOtp,
  validateManualForm,
  validateCourses,
  validatePrefill,
  
  validateSubmit
} from "../../modules/controllers/masters/instituteValidation.js";

const router = express.Router();

/* API Masters */
router.get("/register-by", getRegister);
router.get("/institute-type", getInstituteType);
router.get("/getCourses", getCourses);
router.get("/getspecilization/:id", getspecilization);
router.get("/states", getstate);
router.get("/city/:id", getcity);
/* Step 1 Registration */
router.post("/register/step-one",validateInstituteRegistrationStepOne, instituteRegistrationStepOne);
router.post("/add-tpo",validateAddTpoDetails, addTpoDetails);


router.post("/send-otp",validateSendOtp, sendOtp);
router.post("/verify-otp",validateVerifyOtp, verifyOtp);
// router.post("/verify-college-otp", validateverifyCollegeOtp,verifyCollegeOtp);
router.post("/resend-otp",validateSendOtp, resendOtp);

router.post("/send-college-otp",validateGetColleges, sendCollegeOtp);
router.post("/verify-college-otp",validateverifyCollegeOtp, verifyCollegeOtp);
router.post("/resend-college-otp",validateGetColleges, resendCollegeOtp);
router.post("/College-form",validateManualForm, saveManualCollegeDetails);
router.post("/saveOnboardingCourseSpecialization",validateCourses, saveOnboardingCourseSpecialization);
router.post("/get-college-list",validateGetColleges, getCollegeListing);
// router.post("/saveCollegeCourses",  saveCollegeCourses);
// router.post("/Final-Institute-Onboarding",  finalizeInstituteOnboarding);
router.post("/getOnboardingAddedCourses", validateCourses,getOnboardingAddedCourses);
router.post("/college-profile-data",validatePrefill, getCollegePrefillData);
// router.post("/submitInstituteOnboarding", submitInstituteOnboarding);
router.post("/submit", validateSubmit,submit);



//validation



export default router;
