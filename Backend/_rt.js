const path=require('path'); require('dotenv').config({path:path.join(__dirname,'.env')});
const mongoose=require('mongoose'); const jwt=require('jsonwebtoken'); const crypto=require('crypto');
(async()=>{
 await mongoose.connect(process.env.MONGO_URI);
 const User=require('./models/userModel');
 const authService=require('./services/authService');
 const u=await User.findOne({isVerified:true});
 const sid=crypto.randomBytes(16).toString('hex');
 u.sessions.push({sessionId:sid,ipHash:'t',device:'Desktop',browser:'Chrome',lastActive:new Date(),createdAt:new Date(),expiresAt:new Date(Date.now()+30*24*3600*1000)});
 await u.save();
 const refresh=jwt.sign({id:u._id,sessionId:sid},process.env.JWT_SECRET,{expiresIn:'30d'});
 try{
   const r=await authService.refreshToken(refresh,{ip:'1.1.1.1',headers:{'user-agent':'test'}});
   console.log('REFRESH OK -> new sessionId:', r.sessionId.slice(0,8), '| same as seed:', r.sessionId===sid);
 }catch(e){ console.log('REFRESH THREW:', e.message); }
 const fresh=await User.findById(u._id); fresh.sessions=fresh.sessions.filter(s=>s.sessionId!==sid); await fresh.save();
 await mongoose.disconnect();
})().catch(e=>{console.log('ERR',e.message);process.exit(1)});
