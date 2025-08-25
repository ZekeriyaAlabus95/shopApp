const express = require("express");
const app  =  express();
app.use(express.json());
const productRoute = require("./routes/productRoute")
const sourceRoute = require("./routes/sourceRoute")
const cors = require("cors");
app.use(cors());




app.use("/api/products", productRoute)
app.use("/api/sources" , sourceRoute )
app.listen(8080,() =>{
    console.log("Server started")
})