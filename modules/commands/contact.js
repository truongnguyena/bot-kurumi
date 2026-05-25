const adminGuard = require('../../utils/adminGuard');

module.exports.config = {
  name: 'contact',
  version: '1.0.0',
  hasPermssion: 0,
  credits: 'Kurumi Bot',
  description: 'Gửi danh thiếp Facebook (tag hoặc reply)',
  commandCategory: 'Tiện ích',
  usages: '@tag | reply | [uid]',
  cooldowns: 3,
  usePrefix: true,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, mentions, messageReply, senderID } = event;
  let userID =
    Object.keys(mentions || {}).length > 0
      ? Object.keys(mentions)[0]
      : args[0]
        ? args[0]
        : messageReply
          ? messageReply.senderID
          : senderID;

  if (!userID) {
    return api.sendMessage(
      `📇 Cách dùng:\n• ${global.config.PREFIX}contact @tag\n• Reply tin nhắn + contact\n• ${global.config.PREFIX}contact [uid]\n\n${adminGuard.getAdminContactLine()}`,
      threadID,
      messageID
    );
  }

  return api.shareContact(
    `📇 Liên hệ được chia sẻ bởi ${global.config.BOTNAME || 'Kurumi Bot'}`,
    userID,
    threadID,
    messageID
  );
};
