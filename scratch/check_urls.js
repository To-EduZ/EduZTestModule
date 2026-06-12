const urls = [
  // Original URLs from restore_db.js
  "https://res.cloudinary.com/dupquwf3j/image/upload/pg_1/v1779971869/hubxanh_yle_pdf_digitalizer/ST_P1_47_1779971867318.png",
  
  // Try without pg_1
  "https://res.cloudinary.com/dupquwf3j/image/upload/v1779971869/hubxanh_yle_pdf_digitalizer/ST_P1_47_1779971867318.png",
  
  // Try PDF format
  "https://res.cloudinary.com/dupquwf3j/image/upload/v1779971869/hubxanh_yle_pdf_digitalizer/ST_P1_47_1779971867318.pdf",
  "https://res.cloudinary.com/dupquwf3j/raw/upload/v1779971869/hubxanh_yle_pdf_digitalizer/ST_P1_47_1779971867318.pdf",

  // Try pg_1 but without version number
  "https://res.cloudinary.com/dupquwf3j/image/upload/pg_1/hubxanh_yle_pdf_digitalizer/ST_P1_47_1779971867318.png",
  "https://res.cloudinary.com/dupquwf3j/image/upload/hubxanh_yle_pdf_digitalizer/ST_P1_47_1779971867318.png",

  // Try other questions
  "https://res.cloudinary.com/dupquwf3j/image/upload/v1779972041/hubxanh_yle_pdf_digitalizer/MV_P2_47_1779972038367.pdf",
  "https://res.cloudinary.com/dupquwf3j/image/upload/v1779976441/hubxanh_yle_pdf_digitalizer/MV_P3_47_1779976438703.pdf"
];

async function check() {
  for (const url of urls) {
    try {
      const res = await fetch(url, { method: "HEAD" });
      console.log(`URL: ${url}`);
      console.log(`Status: ${res.status} ${res.statusText}\n`);
    } catch (e) {
      console.log(`URL: ${url} error: ${e.message}\n`);
    }
  }
}

check();
