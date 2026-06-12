export interface SkillQuestion {
  id: string;
  level: "Starters" | "Movers" | "Flyers";
  skill: "Speaking" | "Listening" | "Reading" | "Writing";
  prompt: string; // The target sentence, story, or emoji prompt
  audioText?: string; // Text to be spoken for Listening TTS
  questionText?: string; // Comprehension question for Reading/Listening
  options?: string[]; // Multiple choice options
  correctOption?: string; // The correct answer text
  illustration: string; // Emoji representation
  illustrationDesc: string; // Vietnamese explanation of the illustration
  hint: string; // Interactive instructions for the kid
}

export const questionBank: Record<string, Record<string, SkillQuestion>> = {
  Starters: {
    speaking: {
      id: "starters_speak_01",
      level: "Starters",
      skill: "Speaking",
      prompt: "The fat cat sat on the red mat.",
      illustration: "🐱🟥🛌",
      illustrationDesc: "Chú mèo béo (cat) đang ngồi trên chiếc thảm đỏ (red mat)",
      hint: "Thử thách phanh âm ngắn CVC. Con hãy phát âm thật chuẩn âm cuối /t/ nhé!",
    },
    listening: {
      id: "starters_listen_01",
      level: "Starters",
      skill: "Listening",
      prompt: "I like to eat red apples.",
      audioText: "I like to eat red apples.",
      questionText: "Con hãy nghe cô giáo AI đọc câu mẫu và chọn hình ảnh trái cây đúng nhé!",
      options: ["🍉 Dưa hấu xanh mát", "🍌 Chuối vàng ngọt ngào", "🍎 Táo đỏ tươi ngon", "🍇 Nho tím chín mọng"],
      correctOption: "🍎 Táo đỏ tươi ngon",
      illustration: "🎧🍎👦",
      illustrationDesc: "Bé đeo tai nghe và lắng nghe loại trái cây yêu thích",
      hint: "Bấm nút Loa phát thanh 🔊 để nghe cô giáo AI đọc mẫu từ 1-3 lần, sau đó chọn đĩa trái cây phù hợp nhé!",
    },
    reading: {
      id: "starters_read_01",
      level: "Starters",
      skill: "Reading",
      prompt: "Look at the cute animal. It is big and grey. It loves swimming in the water. It is a hippo.",
      questionText: "What cute animal is it? (Đây là con vật đáng yêu nào?)",
      options: ["🐒 A clever monkey", "🦛 A big grey hippo", "🦁 A brave lion", "🐱 A fat cat"],
      correctOption: "🦛 A big grey hippo",
      illustration: "📖🦛💦",
      illustrationDesc: "Bé đọc câu tả chú hippo to xám đang thích thú bơi lội dưới nước",
      hint: "Con hãy đọc chậm rãi mô tả con vật bên trên, tìm xem từ khóa nói về bạn thú nào nhé!",
    },
    writing: {
      id: "starters_write_01",
      level: "Starters",
      skill: "Writing",
      prompt: "The fat cat is on the red mat.",
      illustration: "🐱🟥🛌",
      illustrationDesc: "Chú mèo béo (cat) đang ngủ trên chiếc thảm đỏ (red mat)",
      hint: "Nhìn tranh gợi ý: 🐱 (cat) + 🟥 (red) + 🛌 (mat). Con hãy viết 1 câu tiếng Anh hoàn chỉnh mô tả chú mèo béo trên thảm đỏ nhé! Cô giáo AI sẽ sửa lỗi chính tả cho con.",
    }
  },
  Movers: {
    speaking: {
      id: "movers_speak_01",
      level: "Movers",
      skill: "Speaking",
      prompt: "Yesterday, the clever monkey washed a big round melon.",
      illustration: "🐒🧼🍉",
      illustrationDesc: "Chú khỉ thông minh (clever monkey) đang rửa quả dưa hấu tròn xoe (round melon)",
      hint: "Thử thách phát âm từ ghép và đuôi quá khứ /t/ của động từ 'washed'.",
    },
    listening: {
      id: "movers_listen_01",
      level: "Movers",
      skill: "Listening",
      prompt: "The clever monkey washes a big round melon.",
      audioText: "The clever monkey washes a big round melon.",
      questionText: "Bé nghe xem bạn khỉ thông minh đang làm hành động gì nhé?",
      options: [
        "🐒🧼🍉 Khỉ rửa dưa hấu tròn xoe",
        "🦁⚽🏃 Sư tử đá bóng trong sân",
        "🦛🛌💤 Hippo đang ngủ khò khò",
        "🐒🌳🍌 Khỉ leo cây hái chuối chín"
      ],
      correctOption: "🐒🧼🍉 Khỉ rửa dưa hấu tròn xoe",
      illustration: "🎧🐒🧼",
      illustrationDesc: "Chú khỉ chăm chỉ dùng nước sạch rửa quả dưa hấu",
      hint: "Hãy nhắm mắt lại, lắng nghe thật kỹ câu tiếng Anh nói về hành động của chú khỉ thông minh nhé!",
    },
    reading: {
      id: "movers_read_01",
      level: "Movers",
      skill: "Reading",
      prompt: "Yesterday, the clever monkey washed a big round melon. Then, it shared the sweet melon with its forest friends.",
      questionText: "Who did the monkey share the melon with? (Khỉ chia sẻ dưa hấu với ai?)",
      options: [
        "🦛 A big grey hippo",
        "🐒🐿️ Its forest friends",
        "🦁 A brave flying lion",
        "👤 No one (Ăn một mình)"
      ],
      correctOption: "🐒🐿️ Its forest friends",
      illustration: "📖🐒🍉🤝",
      illustrationDesc: "Chú khỉ tốt bụng chia sẻ dưa hấu ngọt cho các bạn trong rừng",
      hint: "Đọc kỹ câu thứ hai: 'it shared the sweet melon with...'. Con sẽ tìm ra ngay câu trả lời thôi!",
    },
    writing: {
      id: "movers_write_01",
      level: "Movers",
      skill: "Writing",
      prompt: "Yesterday, the clever monkey washed a big round melon.",
      illustration: "🐒🧼🍉",
      illustrationDesc: "Chú khỉ thông minh (clever monkey) đang rửa quả dưa hấu (washed a melon) ngày hôm qua",
      hint: "Sử dụng gợi ý: Yesterday (Hôm qua), 🐒 (clever monkey) + 🧼 (washed) + 🍉 (melon). Hãy viết lại câu mô tả hành động hôm qua của chú khỉ nhé. Nhớ dùng thì quá khứ đơn nha!",
    }
  },
  Flyers: {
    speaking: {
      id: "flyers_speak_01",
      level: "Flyers",
      skill: "Speaking",
      prompt: "The brave flying lion flew high in the beautiful sky.",
      illustration: "🦁☁️✈️",
      illustrationDesc: "Chú sư tử dũng cảm (brave lion) đang bay cao trên bầu trời xanh thẳm (beautiful sky)",
      hint: "Thử thách nối âm, phụ âm kép /fl/ và ngữ điệu câu trần thuật biểu cảm.",
    },
    listening: {
      id: "flyers_listen_01",
      level: "Flyers",
      skill: "Listening",
      prompt: "The brave flying lion flew high in the beautiful sky.",
      audioText: "The brave flying lion flew high in the beautiful sky.",
      questionText: "Nghe hành trình bay lượn và tìm bức tranh tương ứng nhé bé!",
      options: [
        "🏰⛰️ Lâu đài cổ kính trên đỉnh đồi",
        "🦁☁️ Sư tử dũng cảm sải cánh bay cao",
        "🚀🌕 Tàu vũ trụ phóng lên mặt trăng",
        "🐳🌊 Cá voi khổng lồ bơi giữa đại dương"
      ],
      correctOption: "🦁☁️ Sư tử dũng cảm sải cánh bay cao",
      illustration: "🎧🦁☁️",
      illustrationDesc: "Chú sư tử đeo cánh thiên thần bay giữa những tầng mây xanh",
      hint: "Lắng nghe từ khóa 'brave flying lion' và 'flew high in the sky' để chọn đáp án chuẩn xác nhất nhé!",
    },
    reading: {
      id: "flyers_read_01",
      level: "Flyers",
      skill: "Reading",
      prompt: "Scientists are exploring the mysteries of outer space. They want to travel to the moon and find water there to build a space station.",
      questionText: "Why do scientists want to travel to the moon?",
      options: [
        "🐟 To search for moon fish in the sea",
        "🚀 To find water and build a space station",
        "⚽ To play a soccer match in space",
        "👑 To become kings of the moon"
      ],
      correctOption: "🚀 To find water and build a space station",
      illustration: "📖🚀🔬🌕",
      illustrationDesc: "Các nhà khoa học chế tạo tên lửa để lên mặt trăng tìm nước",
      hint: "Tìm đoạn văn: 'They want to travel to the moon and...' để thấy mục tiêu của các nhà khoa học nhé!",
    },
    writing: {
      id: "flyers_write_01",
      level: "Flyers",
      skill: "Writing",
      prompt: "The brave flying lion flew high in the beautiful sky.",
      illustration: "🦁☁️✈️",
      illustrationDesc: "Chú sư tử dũng cảm (brave lion) đang bay lượn trên trời xanh thẳm",
      hint: "Thử thách viết câu nâng cao: 🦁 (brave flying lion) + ☁️ (beautiful sky) + ✈️ (flew high). Con hãy viết một câu mô tả thật sinh động về chú sư tử dũng cảm đang bay lượn nhé!",
    }
  }
};
