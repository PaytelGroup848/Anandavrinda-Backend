const express  =  require('express');
const app  = express();

app.post('/register',async(req,res)=>{
    const {name,email,number,role}=  await req.body;

})