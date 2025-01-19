import mongoose from "mongoose"
import { DB_NAME } from "../constants.js"

const dbConnection = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`MongoDB connected || DB host : ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("db_connection : Database connection failed : ",error)
        throw error
    }
}

export default dbConnection