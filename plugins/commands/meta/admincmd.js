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
        "details": "Bot Messenger chạy trên NodeJS:\n{source}"
    }
}
const source = "💦 Group admin commands 💦 \n\n\n ⚜ box - control box \n ⚜ resend - resend (on/off) \n ⚜ kick - kick any user  \n ⚜ ban - ban a user with @mention \n ⚜ unban - unban user with ID  \n ⚜ setname - nickname changer \n\n\n ✅ For More Contact With Bot Developer : @ Arafat Hoshen Zihad \n\n ✌Fb:- https://www.facebook.com/C8H20O5P2S2 🔸";
function onCall({ message, getLang }) {
    message.reply(getLang("details", { source }));
}

export default {
    config,
    langData,
    onCall
}