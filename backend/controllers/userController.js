const User = require('../models/userModel');

const filterObj = (obj, ...allowedFields)=>{
    let newObj = {};
    Object.keys(obj).forEach((field)=>{
        if(allowedFields.includes(field)) newObj[field] = obj[field]
        }
    )
    return newObj;
}

exports.createUser = async(req,res) =>{
    try{
        const user = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            passwordConfirm: req.body.passwordConfirm,
        });

        res.status(201).json({
            status:'user created successfully!',
            data:{
                user: user,
            }
        });
    }catch(err){
        res.status(400).json({
            status: "error",

        })
    }
}

exports.updateUser = async (req,res) => {
    try{
        if(req.body && req.params.userId){
            const filteredObj = filterObj(req.body,'name','email')
            const user = await User.findByIdAndUpdate(req.params.userId, filteredObj,{new: true});
            res.status(200).json({
                status:'success',
                data: {
                    user: user,
                }
            })
        }
    }catch(err){
        res.status(404).json({
            status:'error',
            message: err.message,
        })
    }
}

exports.getUser = async(req,res) =>{
    try{
        if(req.params.userId){
            const reqUser = await User.findById(req.params.userId);
            res.status(200).json({
                status: 'fail',
                data: {
                    user: reqUser,
                }
            })
        }else{
            throw new Error("Cannot find the userId");
        }
    }catch(err){
        res.status(404).json({
            status: 'error',
            message: 'Cannot find user with that userId',
            error: err,
        })
    }
}

exports.getAllUsers = async(req,res) => {
    try{
        const users = await User.find({active: true});
        res.status(200).json({
            status:'success',
            data: {
                users: users
            }
        })
    }catch(err){
        res.status(404).json({
            status:'error',
            message: err.message,
        })
    }
}

exports.deleteUser = async(req, res) =>{
    try{
        await User.findByIdAndUpdate(req.params.userId, {active: false}, {new: true});
        res.status(200).json({
            status:'success',
        })
    }catch(err){
        res.status(404).json({
            status:'error',
            message: err.message,
        })
    }

}


