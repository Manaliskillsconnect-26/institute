import express from "express";
import {
  getRegister,
  getInstituteType,
  instituteRegistrationStepOne,
  addTpoDetails,
  sendOtp,
  verifyOtp,
  getCollegeListing,
  sendCollegeOtp,
  verifyCollegeOtp,
  saveManualCollegeDetails,
  getOnboardingAddedCourses,
  // saveCollegeCourses,
  // finalizeInstituteOnboarding,
  saveOnboardingCourseSpecialization,
  submitInstituteOnboarding
} from "../../modules/controllers/v1/instituteRegistration/instituteRegistration.js";

const router = express.Router();

/* API Masters */
router.get("/register-by", getRegister);
router.get("/institute-type", getInstituteType);

/* Step 1 Registration */
router.post("/register/step-one", instituteRegistrationStepOne);
router.post("/add-tpo", addTpoDetails);


router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/get-college-list", getCollegeListing);

router.post("/send-college-otp", sendCollegeOtp);
router.post("/verify-college-otp", verifyCollegeOtp);
router.post("/College-form", saveManualCollegeDetails);
router.post("/saveOnboardingCourseSpecialization", saveOnboardingCourseSpecialization);
// router.post("/saveCollegeCourses",  saveCollegeCourses);
// router.post("/Final-Institute-Onboarding",  finalizeInstituteOnboarding);
router.post("/getOnboardingAddedCourses", getOnboardingAddedCourses);
router.post("/submitInstituteOnboarding", submitInstituteOnboarding);


export default router;
