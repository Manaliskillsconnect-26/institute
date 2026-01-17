import axios from "axios";
import commonModel from "../commonModel.js/commonModel.js";


export const msg91SMS = async (
  phone,
  otp,
  {
    templateId = process.env.MSG91_TEMPLATE_ID,
    authKey = process.env.MSG91_AUTH_KEY
  } = {}
) => {
  if (!phone || !otp) {
    console.error("msg91SMS: phone or otp missing");
    return false;
  }

  const url = "https://control.msg91.com/api/v5/flow/";
  const payload = {
    template_id: templateId,
    short_url: "0",
    recipients: [
      {
        mobiles: `91${phone}`,
        var1: `${otp}`
      }
    ]
  };

  try {
    const resp = await axios.post(url, payload, {
      headers: {
        accept: "application/json",
        authkey: authKey,
        "content-type": "application/json"
      },
      timeout: 15000
    });

    const data = resp?.data;

    if (data?.type === "success") {
      return data;
    }

    console.error("msg91SMS failed:", data);
    return false;

  } catch (err) {
    console.error(
      "msg91SMS error:",
      err?.response?.data || err.message
    );
    return false;
  }
};


export const bhashSMS = async (
  number,
  content,
  {
    userName = process.env.BHASH_USER || "SkillsConnect",
    pass = process.env.BHASH_PASS || "Sc342eefyt46",
    sender = process.env.BHASH_SENDER || "SKILCO",
    priority = "ndnd",
    type = "normal"
  } = {}
) => {
  if (!number || !content) {
    console.error("bhashSMS: number or content missing");
    return false;
  }

  const base = "https://bhashsms.com/api/sendmsg.php";
  const url = `${base}?user=${encodeURIComponent(userName)}&pass=${encodeURIComponent(
    pass
  )}&sender=${encodeURIComponent(sender)}&phone=${encodeURIComponent(
    number
  )}&text=${encodeURIComponent(content)}&priority=${encodeURIComponent(
    priority
  )}&stype=${encodeURIComponent(type)}`;

  try {
    const resp = await axios.get(url, { timeout: 15000 });

    if (resp?.status === 200 && typeof resp.data === "string") {
      // success response starts with "S."
      if (resp.data.startsWith("S.")) {
        return resp.data;
      }
    }

    console.error("bhashSMS failed:", resp.data);
    return false;

  } catch (err) {
    console.error(
      "bhashSMS error:",
      err?.response?.data || err.message
    );
    return false;
  }
};


const sendAlertMailToAdmin = async (subject, body) => {
  console.warn("ADMIN ALERT:", subject, body);
  return true;
};


export const sendNormalOTPMsg = async (
  number,
  content,
  otp,
  purpose = null
) => {
  if (!number || !content || !otp) {
    console.error("sendNormalOTPMsg: missing params", {
      number,
      content,
      otp
    });
    return false;
  }

  try {
    
    const balanceRes = await axios.get(
      "http://bhashsms.com/api/checkbalance.php",
      {
        params: {
          user: "SkillsConnect",
          pass: "Sc342eefyt46"
        }
      }
    );

    const balance = Number(
      String(balanceRes.data).replace(/\D/g, "")
    );

    if (isNaN(balance)) {
      console.error("Invalid balance response:", balanceRes.data);
      return false;
    }

    let response = null;

   
    if (balance <= 200) {
      response = await msg91SMS(number, otp);
      await sendAlertMailToAdmin(
        "BhashSMS balance low",
        `Remaining balance: ${balance}`
      );
    } else {
      response = await bhashSMS(number, content);

      if (!response) {
        response = await msg91SMS(number, otp);
        await sendAlertMailToAdmin(
          "BhashSMS failed",
          "Fallback to MSG91 used"
        );
      }
    }

    if (!response) return false;

   
    try {
      await commonModel.updateData(
  "ups_college_onboarding_users",
  {
    tpo_number_otp: otp,
    tpo_number_otp_status: null,
    updated_by: 1,
    updated_on: new Date()
  },
  ` id = ${onboarding_user_id}`
);

    } catch (e) {
    
    }

    return true;

  } catch (error) {
    console.error("OTP sending failed:", error);
    return false;
  }
};
