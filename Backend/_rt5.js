const path=require('path'); require('dotenv').config({path:path.join(__dirname,'.env'),quiet:true});
const mongoose=require('mongoose'); const jwt=require('jsonwebtoken'); const crypto=require('crypto');
mongoose.set('strictQuery', true);
(async()=>{
 await mongoose.connect(process.env.MONGO_URI);
 const User=require('./models/userModel');
 const authService=require('./services/authService');
 const u=await User.findOne({isVerified:true});
 const sid=crypto.randomBytes(16).toString('hex');
 u.sessions.push({sessionId:sid,ipHash:'t',device:'Desktop',browser:'Chrome',lastActive:new Date(),createdAt:new Date(),expiresAt:new Date(Date.now()+30*24*3600*1000)});
 await u.save();
 const refresh=jwt.sign({id:u._id,sessionId:sid},process.env.JWT_SECRET,{expiresIn:'30d'});
 try {
   const r=await authService.refreshToken(refresh,{ip:'1.1.1.1',headers:{'user-agent':'test'}});
   const r2=await authService.refreshToken(refresh,{ip:'1.1.1.1',headers:{'user-agent':'test'}});
   process.stdout.write(`RESULT: refresh1 keptSid=${r.sessionId===sid} refresh2 keptSid=${r2.sessionId===sid}\n`);
 } catch(e){ process.stdout.write(`RESULT: REAL ERROR ${e.statusCode} ${e.message}\n`); }
 const fresh=await User.findById(u._id); fresh.sessions=fresh.sessions.filter(s=>s.sessionId!==sid); await fresh.save();
 await mongoose.disconnect();
})().catch(e=>{process.stdout.write('OUTER '+e.message+'\n');process.exit(1)});
