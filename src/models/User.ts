import mongoose, { Schema, Document } from 'mongoose';
//const bcrypt = require('bcryptjs')
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  rol: number;
  encryptPassword(password:string): Promise<string>;
  validatePassword(password:string): Promise<boolean>;
  validateEncriptedsPassword(password:string): boolean;

}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  rol: { type: Number }
});

UserSchema.methods.encryptPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(5);
    const encripted = bcrypt.hash(password, salt);
    console.log('encripted pass:', encripted);
    
    return encripted;
};


UserSchema.methods.validatePassword = async function (password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password); //compare no encripted pass from req.body with encrypted user.password from db
};

UserSchema.methods.validateEncriptedsPassword = function (password: string): Boolean {
  return (password === this.password) //compare encripted pass from req.body with encrypted user.password from db
};


// Export the model and return your IUser interface
export default mongoose.model<IUser>('User', UserSchema);