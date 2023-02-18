const config = {
    name: "getlink",
    description: "getlink",
    usage: "[reply]",
    cooldown: 3,
    permissions: [0, 1, 2],
    credits: "XaviaTeam"
}

const langData = {
    "vi_VN": {
        "replyMessage": "Vui lòng reply tin nhắn",
        "noAttachment": "Không có tệp đính kèm",
        "noSupportedAttachment": "Không có tệp đính kèm hỗ trợ, chỉ hỗ trợ ảnh và ảnh động",
        "uploadFailed": "Lấy link thất bại",
        "error": "Đã xảy ra lỗi"
    },
    "en_US": {
        "replyMessage": "Please reply a message",
        "noAttachment": "No attachment",
        "noSupportedAttachment": "No supported attachment, only support photo and animated image",
        "uploadFailed": "Upload failed",
        "error": "An error occured"
    },
    "ar_SY": {
        "replyMessage": "الرجاء الرد على الرسالة",
        "noAttachment": "لا يوجد مرفق",
        "noSupportedAttachment": "لا يوجد مرفق مدعوم ، يدعم فقط الصور والصورة المتحركة",
        "uploadFailed": "فشل الرفع",
        "error": "حدث خطأ"
    }
}

const supportedType = ["photo", "animated_image"];

function upload(url) {
    return new Promise(resolve => {
        global.request(`${global.xva_api.main}/imgbb`, {
            method: "POST",
            data: {
                url: url
            }
        }, async (error, res, data) => {
            if (error) {
                console.error(error);
                return resolve(null);
            }

            return resolve(data.url);
        })
    })
}

async function onCall({ message, getLang }) {
    try {
        const { type, messageReply } = message;

        if (type != "message_reply") return message.reply(getLang("replyMessage"));

        let { attachments } = messageReply;

        if (!attachments || !attachments.length) return message.reply(getLang("noAttachment"));
        let filteredAttachments = attachments.filter(attachment => supportedType.includes(attachment.type));

        if (!filteredAttachments.length) return message.reply(getLang("noSupportedAttachment"));

        let urls = [];
        for (let attachment of filteredAttachments) {
            let url = await upload(attachment.url);
            if (!url) continue;
            urls.push(url);
        }

        if (!urls.length) return message.reply(getLang("uploadFailed"));

        let text = urls.join("\n");
        return message.reply(text);
    } catch (err) {
        message.reply(getLang("error"));
    }
}

export default {
    config,
    langData,
    onCall
}
