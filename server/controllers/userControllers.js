import userModel from "../models/userModel.js";

export const getUserData = async (req, res) => {
  try {
    const { userId } = req;

    const user = await userModel.findById(userId).select("-password -resetOtp -verifyOtp"); 
    // 👆 excludes sensitive fields

    if (!user) {
      return res.json({ success: false, message: "User Not Found!!" });
    }

    return res.json({
      success: true,
      userData: {
        name: user.name,
        email: user.email,
        isAccountVerified: user.isAccountVerified,
      },
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
