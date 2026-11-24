/**
 * Executive Curriculum Vitae / Resume PDF Generator & Document Model
 * 
 * Generates an executive standard vector PDF (PDF-1.4) matching the exact
 * format of James Emmanuel E. Mendoza's curriculum vitae with zero external dependencies.
 */

export const RESUME_META = {
  fullName: "JAMES EMMANUEL E. MENDOZA",
  location: "Tondo, Manila",
  phone: "0992 543 3570",
  email: "mendozajamesemmanuel@gmail.com",
  linkedin: "https://www.linkedin.com/in/james-emmanuel-mendoza-46b377373/",
  linkedinDisplay: "linkedin.com/in/james-emmanuel-mendoza-46b377373",
  github: "https://github.com/Ememman",
  githubDisplay: "github.com/Ememman",
};

export const RESUME_EXPERIENCES = [
  {
    company: "Dowinn Group",
    role: "Technical Support Engineer",
    period: "September 28, 2026 – Present",
    tag: "Technical Support, Test Automation & Front-End Development",
    bullets: [
      "Served as Technical Support Engineer, diagnosing infrastructure/system issues, maintaining operational uptime, and providing technical support across enterprise internal systems.",
      "Automated cross-browser and mobile end-to-end testing pipelines using Playwright, Appium, and Cypress to eliminate regression escapes and accelerate QA delivery.",
      "Transitioned to active front-end engineering by the third week, building and coding operational portals, internal tools, and responsive user interfaces with Next.js, React, and TypeScript.",
      "Integrated TanStack Query for asynchronous server-state synchronization, optimistic cache updates, and reduced network roundtrips; streamlined technical documentation via Notion and GitHub.",
    ],
  },
  {
    company: "Straive",
    role: "On the Job Training",
    period: "February 02, 2026 – March 24, 2026",
    tag: "Enterprise IT Support & IMS Development",
    bullets: [
      "Applied academic knowledge to real-world IT support – Resolved issues like BIOS configuration, BitLocker lockouts, and RDP errors, moving beyond textbook theory.",
      "Developed communication & teamwork skills – Walked frustrated users through technical fixes, collaborated closely with senior colleagues, and shared team wins.",
      "Managed time under operational pressure – Balanced weekend duties, bulk agent registrations, and documentation while prioritizing effectively.",
      "Strengthened technical skills in key tools – Hands-on with 1Kosmos (MFA/biometrics), RDP, Active Directory, BitLocker, and security tools (WorkMate, Sentinel, Netskope).",
      "Architected and engineered the Straive IMS (Inventory Management System) in PHP (MVC) and MySQL with custom REST routing and accessible UI.",
    ],
  },
];

export const RESUME_SKILLS = [
  "Versatile full-stack developer proficient in React, Next.js, TypeScript, PHP (Laravel, CodeIgniter, MVC), Node.js, and databases (PostgreSQL, MySQL, MongoDB), with expertise in design tools (Figma, Canva) and project management.",
  "Architected responsive component ecosystems using Tailwind CSS and shadcn/ui; implemented TanStack Query for resilient asynchronous state management and real-time Socket.IO synchronization.",
  "Gathered system requirements, organized user feedback, tested basic functionalities • Documented code changes, debugged errors, improved software performance and user experience.",
  "Proficient in programming/coding and problem-solving (identifying root causes, developing technical solutions).",
  "Automated end-to-end and mobile test suites with Playwright, Appium, and Cypress; provided technical opinions and coding solutions in group discussions.",
];

export const RESUME_ACHIEVEMENTS = [
  { title: "HTML5 (SoloLearn)", date: "November 01, 2023" },
  { title: "Web Development (SoloLearn)", date: "January 30 2025" },
  { title: "Best in Research (SALON)", date: "May 02, 2026" },
];

export const RESUME_EDUCATION = {
  degree: "Bachelor of Science in Information Technology",
  school: "National Teachers College",
  years: "2022–2026",
  honor: "Magna Cum Laude",
};

function escapePdf(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function buildResumePdfBytes(): Uint8Array {
  const objects: string[] = [];
  function addObj(content: string): number {
    objects.push(content);
    return objects.length;
  }

  // 1: Catalog
  addObj("<< /Type /Catalog /Pages 2 0 R >>");
  // 2: Pages
  addObj("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  // 3: Page (Letter: 612 x 792 pt)
  addObj("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 6 0 R /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> >>");
  // 4: Font F1 (Times-Roman)
  addObj("<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>");
  // 5: Font F2 (Times-Bold)
  addObj("<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>");

  let stream = "";
  const yPdf = (topY: number) => (792 - topY).toFixed(2);

  const drawText = (font: string, size: number, x: number, topY: number, str: string) => {
    stream += `BT /${font} ${size} Tf ${x.toFixed(2)} ${yPdf(topY)} Td (${escapePdf(str)}) Tj ET\n`;
  };

  const drawLine = (x1: number, topY1: number, x2: number, topY2: number, width = 0.75) => {
    stream += `${width} w ${x1.toFixed(2)} ${yPdf(topY1)} m ${x2.toFixed(2)} ${yPdf(topY2)} l S\n`;
  };

  const margin = 44;
  const pageWidth = 612;
  let y = 46;

  // Header: Centered
  drawText("F2", 16.5, 175, y, RESUME_META.fullName);
  y += 15;
  drawText("F1", 9.5, 138, y, `${RESUME_META.location} | ${RESUME_META.phone} | ${RESUME_META.email}`);
  y += 12;
  drawText("F1", 8.5, 132, y, `${RESUME_META.linkedinDisplay}  |  ${RESUME_META.githubDisplay}`);

  const addSection = (title: string) => {
    y += 18;
    drawText("F2", 10.5, margin, y, title);
    y += 4;
    drawLine(margin, y, pageWidth - margin, y, 0.75);
    y += 11;
  };

  const wrapText = (txt: string, maxChars: number): string[] => {
    const words = txt.split(" ");
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      if ((cur + " " + w).trim().length <= maxChars) {
        cur = (cur + " " + w).trim();
      } else {
        if (cur) lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  };

  const addBullet = (bulletTxt: string) => {
    drawText("F1", 9, margin + 6, y, "\u2022");
    const wrapped = wrapText(bulletTxt, 108);
    for (let i = 0; i < wrapped.length; i++) {
      drawText("F1", 9, margin + 16, y, wrapped[i]);
      y += 11.5;
    }
    y += 2.5;
  };

  // 1. Professional Experience
  addSection("Professional Experience");

  // Dowinn Group
  drawText("F2", 9.5, margin, y, `${RESUME_EXPERIENCES[0].company} | ${RESUME_EXPERIENCES[0].role}`);
  drawText("F2", 9.5, 438, y, RESUME_EXPERIENCES[0].period);
  y += 11;
  RESUME_EXPERIENCES[0].bullets.forEach(addBullet);

  y += 4;
  // Straive
  drawText("F2", 9.5, margin, y, `${RESUME_EXPERIENCES[1].company} | ${RESUME_EXPERIENCES[1].role}`);
  drawText("F2", 9.5, 415, y, RESUME_EXPERIENCES[1].period);
  y += 11;
  RESUME_EXPERIENCES[1].bullets.forEach(addBullet);

  // 2. Technical and Professional Skills
  addSection("Technical and Professional Skills");
  RESUME_SKILLS.forEach(addBullet);

  // 3. Achievements and Certifications
  addSection("Achievements and Certifications");
  const datePositions = [476, 486, 504];
  RESUME_ACHIEVEMENTS.forEach((c, idx) => {
    drawText("F1", 9, margin, y, c.title);
    drawText("F1", 9, datePositions[idx] || 480, y, c.date);
    y += 12;
  });

  // 4. Educational Attainment
  addSection("Educational Attainment");
  drawText(
    "F2",
    9,
    margin,
    y,
    `${RESUME_EDUCATION.degree} | ${RESUME_EDUCATION.school} (${RESUME_EDUCATION.years}) – ${RESUME_EDUCATION.honor}`
  );

  // Stream object (object 6)
  const streamEncoder = new TextEncoder();
  const streamBytes = streamEncoder.encode(stream);
  const streamObj = `<< /Length ${streamBytes.length} >>\nstream\n${stream}endstream`;
  addObj(streamObj);

  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  const encoder = new TextEncoder();
  for (let i = 0; i < objects.length; i++) {
    offsets.push(encoder.encode(out).length);
    out += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const startXref = encoder.encode(out).length;
  out += `xref\n0 ${objects.length + 1}\n`;
  out += "0000000000 65535 f \n";
  for (let i = 0; i < offsets.length; i++) {
    out += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
  }
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  return encoder.encode(out);
}

export function createResumePdfBlob(): Blob {
  const bytes = buildResumePdfBytes();
  return new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
}

export function downloadResumePdf(filename = "MendozaJamesEmmanuelCV.pdf") {
  const blob = createResumePdfBlob();
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
}
