//this file not yet in used
 

const mysql=require("mysql");

const db=mysql.createConnection({
    host:process.env.DB_HOST,
    user:process.env.DB_USER,
    password:process.env.DB_PASSWORD,
    database:process.env.DATABASE

})

db.connect((err)=>{

    if(err)
    {
        console.error("Database connection failed:",err)
    }else{
        console.log("Mysql connected");
    }
});
module.exports=db;
