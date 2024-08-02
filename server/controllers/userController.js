
const User = require("../models/users");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '15d',
  });
};

const signup = async (req, res) => {
    const { name, email, password, role, address, phone, brandName, paymentMethod } = req.body;
   try {
        

        // Check if user with the given email already exists
        const existing = await User.findOne({ email });

        if (existing) {
            return res.status(401).json({ message: "User already exists with this email address" });
        }

        // Generate salt and hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new user in the database
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            address,
            phone,
            brandName,
            paymentMethod,
        });
        const token=generateToken(newUser._id);
        //Setting cookie
        //Syntax:=>res.cookie(name, value, [options])
        res.cookie('e-comToken',token,{
          httpOnly:true,
          maxAge:2* 24 * 60 * 60 * 1000,//max age in miili-sec
        });
        // If user creation is successful, return success response
        if (newUser) {
            return res.status(201).json({
                name: newUser.name,
                email: newUser.email,
                _id: newUser._id,
                token: token,
            });
        } else {
            return res.status(400).json({ message: "Invalid user data" });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

const login = async (req, res) => {
  const { email, password } = req.body;  
  const existing = await User.findOne({ email });
  if (!existing) {
    //401==>unauthorised
    return res.status(401).json("No such User Exist");
  }
  const checkPassword = await bcrypt.compare(password, existing.password);
  //console.log(checkPassword);
  if (checkPassword) {
    //ok
    const token=generateToken(existing._id);
    res.cookie("e-comToken",token,{
      httpOnly:true,
      maxAge:2*24*60*60*1000,
    })
    return res.status(200).json({
      existing,
      token:token,
    });
  } else {
    return res.status(401).json({ message: "Invalid Credentials" });
  }
};


const logout=async(req,res)=>{
  res.clearCookie('e-comToken');
  return res.status(200).json({message:"Cookie is deleted and logged out successfully"});
}


const editProfile=async(req,res)=>{
  const user=await req.user;
  const{name,email,password,address,phone,brandName,paymentMethod}=req.body;
  //updating the user
  console.log(user,"userController line 99");
  const oldUser=await User.findById(user.id);
  if(!oldUser){
    return res.status(401).json({message:"No such user"});
  }
  oldUser.name=name||oldUser.name;
  oldUser.email=email||oldUser.email;
  oldUser.address=address||oldUser.address;
  oldUser.brandName=brandName||oldUser.brandName;
  oldUser.phone=phone||oldUser.phone;
  oldUser.paymentMethod = paymentMethod || oldUser.paymentMethod;
  if (password) {
    const salt = await bcrypt.genSalt(10);
    oldUser.password = await bcrypt.hash(password, salt);
  }
  const updatedUser=await oldUser.save();
  if(updatedUser){
    return res.status(200).json({
      message:"Updated Successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        address: updatedUser.address,
        role: updatedUser.role,
        phone: updatedUser.phone,
        brandName: updatedUser.brandName,
        paymentMethod: updatedUser.paymentMethod,
      },
    })
  }

}

module.exports = { login, signup,logout,editProfile };
