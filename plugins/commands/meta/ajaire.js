const config = {
    name: "ajaire",
    aliases: ["faw", "antazi"],
    description: "nothing special"
}

const langData = {
    "en_US": {
        "details": "{source}"
    },
    "vi_VN": {
        "details": "{source}"
    }
}

const source = "🧩Currently Available Commands🧩\n\n\n\n                   🌀🔸Category: আজাইরে কমান্ড (কামের না আর কি)🔹\n\n\n👉1. toilet - Toilet posting \n👉2. Trump - Twitter funny post \n👉3. zuck - Zuckerberg  post \n👉4. mark - Mark Zuckerberg fb Comment \n👉5. putin - আমার ছোট ভাই পুতিন এর সাথে মিটিং.  \n👉6. Obama - Twitter Funny Post \n👉7. delet - delet trush \n👉8. lexi - Lexi Lore funny post \n👉9. phub - Post the content of the comment on ponhub \n👉10. memes - Some Funny Memes \n👉11. point - pont @anyone \n👉12. rip - Death \n👉13. slap - Slap Tag Member \n👉14. smoke - Smoke Cover Make \n👉15. trash - Trash Image Maker \n👉16. trigger - Trigger Image Create \n👉17. wanted - Most Wanted Criminal \n👉18. hitler - Hitler Image Create \n👉19. blur - Blur Image Create DP \n👉20. board - txt on Board Image Create \n👉21. doof - bord on class \n👉22. drake - [text 1] | [text 2] \n👉23. fact - imao fun  \n👉24. minionlanguage - learn & talk secretly \n👉25. morse - code language \n👉26. mystery - skubidu funny moment \n👉27. password - nothing special \n👉28. poop - eak shit \n👉29. bob - imao put on fire @person \n👉30. fast - check admins internet speed \n👉31. biden - joe biden twit \n👉32. selfi - make selfie with @person \n👉33. chock - chought the neek of @anyone \n👉34. spank - Try to use THIS Command Funny. \n\n\n ✅ For More Contact With Bot Developer : @ Arafat Hoshen Zihad \n\n ✌Fb:- https://www.facebook.com/C8H20O5P2S2 🔸 ";
	function onCall({ message, getLang }) {
		message.reply(getLang("details", { source }));
	}
	
	export default {
		config,
		langData,
		onCall
	}	