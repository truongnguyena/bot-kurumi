module.exports.config = {
    name: 'getid',
    version: '1.0.0',
    hasPermssion: 0,
    credits: "Kurumi Bot",
    description: 'Lấy ID người dùng để add admin bot',
    commandCategory: 'Tiện ích',
    usages: 'getid @tag hoặc reply tin nhắn',
    cooldowns: 2
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID, type, mentions, messageReply } = event;

    let targetID = null;
    let targetName = null;

    // Nếu reply tin nhắn
    if (type === "message_reply" && messageReply) {
        targetID = messageReply.senderID;
    }
    // Nếu tag người
    else if (Object.keys(mentions).length > 0) {
        targetID = Object.keys(mentions)[0];
        targetName = mentions[targetID].replace('@', '');
    }
    // Lấy ID chính mình
    else {
        targetID = senderID;
    }

    try {
        const userInfo = await api.getUserInfo(targetID);
        const name = userInfo[targetID]?.name || targetName || "Không rõ";

        const msg = `📋 THÔNG TIN ID
━━━━━━━━━━━━━━━━━━
👤 Tên: ${name}
🆔 ID: ${targetID}
━━━━━━━━━━━━━━━━━━
💡 Copy ID trên để add vào ADMINBOT trong config.json`;

        return api.sendMessage(msg, threadID, messageID);
    } catch (error) {
        return api.sendMessage(`🆔 ID: ${targetID}`, threadID, messageID);
    }
};
