import mongoose  from "mongoose";

export const connectDB = async () => {
    await mongoose.connect('mongodb+srv://tmeech:388734@cluster1.n8unl5m.mongodb.net/food-del').then(() => console.log("DB Connected"));
}