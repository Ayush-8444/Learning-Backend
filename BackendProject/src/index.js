import dotenv from "dotenv"
import db_connection from "./Db/db_connection.js"
import { app } from "./app.js"

dotenv.config({
    path: "./env"
})

db_connection()
.then(() => {
    app.on("error", (error) => {
        console.log("index : Error : ",error);        
    })
    app.listen(process.env.PORT || 8000 , () => {
        console.log("server is listening on the port ", process.env.PORT || 8000 );  
    });
})
.catch((error) => {
    console.log("index : Database connection failed : ",error); 
})
