export interface AdaptiveQuestion {
  id: string;
  level: "Starters" | "Movers" | "Flyers";
  skill: "Speaking" | "Listening" | "Reading" | "Writing";
  difficulty: number; // b: -2 to +2
  discrimination: number; // a: 0.5 to 2.0
  guessing: number; // c: 0.0 to 0.25
  prompt: string;
  audioText?: string;
  questionText?: string;
  options?: string[];
  correctOption?: string;
  illustration: string;
  illustrationDesc: string;
  hint: string;
}

export const adaptiveQuestionBank: AdaptiveQuestion[] = [
  // STARTERS - SPEAKING (b: -1.5 to -0.5)
  {
    id: "CAT_S_SP_1", level: "Starters", skill: "Speaking",
    difficulty: -1.5, discrimination: 1.0, guessing: 0,
    prompt: "I see a cat.", illustration: "🐱", illustrationDesc: "Con mèo", hint: "Đọc to câu trên nhé."
  },
  {
    id: "CAT_S_SP_2", level: "Starters", skill: "Speaking",
    difficulty: -1.0, discrimination: 1.2, guessing: 0,
    prompt: "The dog is runing fast.", illustration: "🐕🏃", illustrationDesc: "Chó chạy nhanh", hint: "Đọc to câu trên."
  },
  {
    id: "CAT_S_SP_3", level: "Starters", skill: "Speaking",
    difficulty: -0.5, discrimination: 1.5, guessing: 0,
    prompt: "A big red apple.", illustration: "🍎", illustrationDesc: "Táo đỏ lớn", hint: "Đọc to câu trên."
  },

  // STARTERS - LISTENING (b: -1.5 to -0.5, c: 0.25)
  {
    id: "CAT_S_LS_1", level: "Starters", skill: "Listening",
    difficulty: -1.2, discrimination: 1.0, guessing: 0.25,
    prompt: "I like bananas.", audioText: "I like bananas.", questionText: "Cô giáo vừa nói quả gì?",
    options: ["🍌 Bananas", "🍎 Apples", "🍇 Grapes", "🍉 Watermelon"], correctOption: "🍌 Bananas",
    illustration: "🎧", illustrationDesc: "Nghe", hint: "Nghe và chọn"
  },
  {
    id: "CAT_S_LS_2", level: "Starters", skill: "Listening",
    difficulty: -0.8, discrimination: 1.1, guessing: 0.25,
    prompt: "The car is blue.", audioText: "The car is blue.", questionText: "Xe ô tô màu gì?",
    options: ["🚗 Đỏ", "🚙 Xanh dương", "🚕 Vàng", "🚓 Đen"], correctOption: "🚙 Xanh dương",
    illustration: "🎧", illustrationDesc: "Nghe", hint: "Nghe và chọn"
  },
  {
    id: "CAT_S_LS_3", level: "Starters", skill: "Listening",
    difficulty: -0.5, discrimination: 1.3, guessing: 0.25,
    prompt: "I have two eyes.", audioText: "I have two eyes.", questionText: "Cô ấy có mấy mắt?",
    options: ["1", "2", "3", "4"], correctOption: "2",
    illustration: "🎧", illustrationDesc: "Nghe", hint: "Nghe và chọn"
  },

  // STARTERS - READING
  {
    id: "CAT_S_RD_1", level: "Starters", skill: "Reading",
    difficulty: -1.4, discrimination: 1.0, guessing: 0.25,
    prompt: "This is a book.", questionText: "Đây là gì?",
    options: ["Sách", "Bút", "Thước", "Cục tẩy"], correctOption: "Sách",
    illustration: "📖", illustrationDesc: "Đọc", hint: "Đọc và chọn"
  },
  {
    id: "CAT_S_RD_2", level: "Starters", skill: "Reading",
    difficulty: -0.9, discrimination: 1.2, guessing: 0.25,
    prompt: "My shirt is green.", questionText: "Áo màu gì?",
    options: ["Red", "Green", "Blue", "Yellow"], correctOption: "Green",
    illustration: "👕", illustrationDesc: "Áo", hint: "Đọc và chọn"
  },

  // STARTERS - WRITING
  {
    id: "CAT_S_WR_1", level: "Starters", skill: "Writing",
    difficulty: -1.0, discrimination: 1.5, guessing: 0,
    prompt: "I have a pen.", illustration: "🖊️", illustrationDesc: "Cây bút", hint: "Viết câu 'I have a pen.'"
  },
  {
    id: "CAT_S_WR_2", level: "Starters", skill: "Writing",
    difficulty: -0.6, discrimination: 1.3, guessing: 0,
    prompt: "The sun is hot.", illustration: "☀️", illustrationDesc: "Mặt trời nóng", hint: "Viết câu 'The sun is hot.'"
  },

  // MOVERS - SPEAKING (b: -0.5 to +0.5)
  {
    id: "CAT_M_SP_1", level: "Movers", skill: "Speaking",
    difficulty: -0.2, discrimination: 1.2, guessing: 0,
    prompt: "She is playing basketball.", illustration: "🏀", illustrationDesc: "Chơi bóng rổ", hint: "Đọc to."
  },
  {
    id: "CAT_M_SP_2", level: "Movers", skill: "Speaking",
    difficulty: 0.1, discrimination: 1.5, guessing: 0,
    prompt: "He washed his face yesterday.", illustration: "🧼", illustrationDesc: "Rửa mặt", hint: "Đọc to chú ý thì quá khứ."
  },
  {
    id: "CAT_M_SP_3", level: "Movers", skill: "Speaking",
    difficulty: 0.4, discrimination: 1.1, guessing: 0,
    prompt: "They are going to the supermarket.", illustration: "🛒", illustrationDesc: "Siêu thị", hint: "Đọc to."
  },

  // MOVERS - LISTENING
  {
    id: "CAT_M_LS_1", level: "Movers", skill: "Listening",
    difficulty: -0.3, discrimination: 1.0, guessing: 0.25,
    prompt: "My favorite subject is Math.", audioText: "My favorite subject is Math.", questionText: "Môn học yêu thích là gì?",
    options: ["Math", "English", "Science", "Music"], correctOption: "Math",
    illustration: "🎧", illustrationDesc: "Nghe", hint: "Nghe và chọn"
  },
  {
    id: "CAT_M_LS_2", level: "Movers", skill: "Listening",
    difficulty: 0.2, discrimination: 1.3, guessing: 0.25,
    prompt: "The train departs at 9 AM.", audioText: "The train departs at 9 AM.", questionText: "Chuyến tàu khởi hành lúc mấy giờ?",
    options: ["8 AM", "9 AM", "10 AM", "9 PM"], correctOption: "9 AM",
    illustration: "🎧", illustrationDesc: "Nghe", hint: "Nghe và chọn"
  },

  // MOVERS - READING
  {
    id: "CAT_M_RD_1", level: "Movers", skill: "Reading",
    difficulty: -0.1, discrimination: 1.2, guessing: 0.25,
    prompt: "Elephants are the largest land animals on Earth.", questionText: "Loài động vật trên cạn nào lớn nhất?",
    options: ["Lions", "Tigers", "Elephants", "Bears"], correctOption: "Elephants",
    illustration: "🐘", illustrationDesc: "Voi", hint: "Đọc và chọn"
  },
  {
    id: "CAT_M_RD_2", level: "Movers", skill: "Reading",
    difficulty: 0.4, discrimination: 1.4, guessing: 0.25,
    prompt: "Yesterday, Sarah bought a new dress for the party.", questionText: "Sarah mua gì?",
    options: ["A book", "A toy", "A dress", "A cake"], correctOption: "A dress",
    illustration: "👗", illustrationDesc: "Váy", hint: "Đọc và chọn"
  },

  // MOVERS - WRITING
  {
    id: "CAT_M_WR_1", level: "Movers", skill: "Writing",
    difficulty: -0.2, discrimination: 1.1, guessing: 0,
    prompt: "My brother plays the guitar.", illustration: "🎸", illustrationDesc: "Đàn guitar", hint: "Viết lại câu gợi ý."
  },
  {
    id: "CAT_M_WR_2", level: "Movers", skill: "Writing",
    difficulty: 0.3, discrimination: 1.4, guessing: 0,
    prompt: "We went to the beach last summer.", illustration: "🏖️", illustrationDesc: "Bãi biển", hint: "Viết câu về mùa hè năm ngoái."
  },

  // FLYERS - SPEAKING (b: +0.5 to +1.5)
  {
    id: "CAT_F_SP_1", level: "Flyers", skill: "Speaking",
    difficulty: 0.6, discrimination: 1.2, guessing: 0,
    prompt: "The scientist discovered a new planet.", illustration: "🔭", illustrationDesc: "Hành tinh", hint: "Đọc to."
  },
  {
    id: "CAT_F_SP_2", level: "Flyers", skill: "Speaking",
    difficulty: 1.0, discrimination: 1.6, guessing: 0,
    prompt: "I would travel around the world if I were rich.", illustration: "🌍", illustrationDesc: "Du lịch thế giới", hint: "Đọc to câu điều kiện."
  },
  {
    id: "CAT_F_SP_3", level: "Flyers", skill: "Speaking",
    difficulty: 1.4, discrimination: 1.3, guessing: 0,
    prompt: "Environmental protection is very important nowadays.", illustration: "🌱", illustrationDesc: "Bảo vệ môi trường", hint: "Đọc to và rõ chữ."
  },

  // FLYERS - LISTENING
  {
    id: "CAT_F_LS_1", level: "Flyers", skill: "Listening",
    difficulty: 0.7, discrimination: 1.1, guessing: 0.25,
    prompt: "He has been living here since 2010.", audioText: "He has been living here since 2010.", questionText: "Anh ấy sống ở đây từ khi nào?",
    options: ["2000", "2010", "2020", "2012"], correctOption: "2010",
    illustration: "🎧", illustrationDesc: "Nghe", hint: "Nghe kỹ"
  },
  {
    id: "CAT_F_LS_2", level: "Flyers", skill: "Listening",
    difficulty: 1.2, discrimination: 1.5, guessing: 0.25,
    prompt: "Despite the heavy rain, they continued playing.", audioText: "Despite the heavy rain, they continued playing.", questionText: "Họ làm gì mặc dù trời mưa to?",
    options: ["Stopped playing", "Went home", "Continued playing", "Started crying"], correctOption: "Continued playing",
    illustration: "🎧", illustrationDesc: "Nghe", hint: "Nghe kỹ"
  },

  // FLYERS - READING
  {
    id: "CAT_F_RD_1", level: "Flyers", skill: "Reading",
    difficulty: 0.8, discrimination: 1.2, guessing: 0.25,
    prompt: "Astronauts have to train vigorously before going to space.", questionText: "Phi hành gia cần làm gì trước khi lên không gian?",
    options: ["Eat lots of food", "Sleep all day", "Train vigorously", "Buy a rocket"], correctOption: "Train vigorously",
    illustration: "🚀", illustrationDesc: "Tên lửa", hint: "Đọc kỹ"
  },
  {
    id: "CAT_F_RD_2", level: "Flyers", skill: "Reading",
    difficulty: 1.3, discrimination: 1.4, guessing: 0.25,
    prompt: "Volcanoes are mountains that open downwards to a pool of molten rock.", questionText: "Núi lửa nối xuống đâu?",
    options: ["Ocean", "Molten rock", "Space", "Ice cave"], correctOption: "Molten rock",
    illustration: "🌋", illustrationDesc: "Núi lửa", hint: "Đọc kỹ"
  },

  // FLYERS - WRITING
  {
    id: "CAT_F_WR_1", level: "Flyers", skill: "Writing",
    difficulty: 0.9, discrimination: 1.4, guessing: 0,
    prompt: "I have been studying English for five years.", illustration: "📚", illustrationDesc: "Học tập", hint: "Viết lại câu thì hiện tại hoàn thành tiếp diễn."
  },
  {
    id: "CAT_F_WR_2", level: "Flyers", skill: "Writing",
    difficulty: 1.5, discrimination: 1.6, guessing: 0,
    prompt: "If it rains tomorrow, we will stay at home.", illustration: "🏠", illustrationDesc: "Ở nhà", hint: "Viết lại câu điều kiện."
  },
];
