
var Sessions = require('../modules/Sessions.js');

avsConfig = require('../avs.json');

var options = {
    clientId: avsConfig.clientId,
    clientSecret: avsConfig.clientSecret
}

var sessions = Sessions(options);


var sessionId = "abcdfg";
var tokens = 
{ access_token: 'Atza|IwEBID71HhK7R6NxZPm1Px5p0S9apeUEpYUXlcrfo9kqa1dYm_dgwdFJSuXO7M9Mud5fj71ZDUdRyAw9YqGGa_dK_i6LBcJWbRAMYIsnupZKlvTxdH6IPRD0EEgWmCA9u_dRSz11SsSrgPrRvZ-8-kiFVdB_snjidSuNhY297_r0ReZ3l_WUS-MrO39AjlaKUuulfpi2EanhUUylySLd2tPhNiYxASeM-XUCt23oE-YX5lr3qvHQOq_T76boIBAIhse8yiJv98r9dECouKA6BgNFMBXOV7KLx3Ca6mQv51Zv-48wpzxHTX65xtOisxPAOYNZ-kLNICJ3R36b3C3VAOoPiU6qfNzNHbrT9rqAPZ_xIaOynTV5lrN7tLS_qcEebA1dthL2hSMv_-DKNcWKlCX6FtVqRuQkwMXlx8HwGecuaNncp6N7_AKax1bgXf90R7UlIgI0tm3QF5033961FgKKEv-MQA7lLFRb12LS370aLhOWL5ulp8MI8axDRpBcxQNEY84',
     refresh_token: 'Atzr|IwEBIBVADuIVmN9ppr-5bBH4ne7u0zRRqFX4y8aprTb-J0nXiYA4epY21NQflS7FYaZzr1IqNVQKUxnB3nWIrUUz0f__7unxxJ98dPXEgxdxbwHwx1cwoB5hLzRypfsUSZyWeJk6_ZfqtZS0Q3-fjOg8SDP7kq0QbPc3gxVEpDpHifbYy6aBFfV3GT61xpY4ROGNu2mMZeFZ0eDoOxTuPO3BhO9D--3yrcMpIm8LfVObsJnEIw-ahtRYVmSGxUegVmwXTP-4c8vfCDAmDT1gWfLOG0g8WX3lbAmra72FMr-L5sKghVO6E0wyBL5kKgh_Y5Fr5AZ-YofHsHo6byRCJ2ptmJPmclid668fldx4BZWcGZJV4u-rAghC9qCNcXUmE0v76of-oHvaC1LX9pNLMk-vvZkAkA6UIWOm5cFBZ0hjXqmquUWpLv0lETBXhiDcQbqDfVWyKZ8dxEKL7zX3hhkKIRUBCJPMH1kCfpD6vRnxmd6LaOZhFeG1-vPJq2rcUbwGPa8FpYlFmDv6z6CDlAEoCldV',
     token_type: 'bearer',
     expires_in: 3600 }

sessions.addSession(sessionId, tokens);




//sessions.startloop(sessions);
setInterval(function(){sessions.checkSessions();}, 10*1000);