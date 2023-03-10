const config = {
    name: "admincmd",
    aliases: ["admincmd", "cmdadmin"],
    description: "show cmd 4 admin"
}

const langData = {
    "en_US": {
        "details": "{source}"
    },
    "vi_VN": {
        "details": "Bot Messenger cháº¡y trÃªn NodeJS:\n{source}"
    }
}
const source = "ð¦ Group admin commands ð¦ \n\n\n â box - control box \n â resend - resend (on/off) \n â kick - kick any user  \n â ban - ban a user with @mention \n â unban - unban user with ID  \n â setname - nickname changer \n\n\n â For More Contact With Bot Developer : @ Arafat Hoshen Zihad \n\n âFb:- https://www.facebook.com/C8H20O5P2S2 ð¸";
function onCall({ message, getLang }) {
    message.reply(getLang("details", { source }));
}

export default {
    config,
    langData,
    onCall
}