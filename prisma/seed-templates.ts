/**
 * Template structure definitions for all 4 evaluation instruments.
 * Extracted from prisma/seed.ts for modularity.
 */

interface LikertDescriptor {
  value: number;
  label: string;
}
interface TemplateQuestion {
  key: string;
  prompt: string;
  type: "likert" | "guided_open_ended";
  order: number;
  required: boolean;
  likertDescriptors?: LikertDescriptor[];
  suggestedResponses?: string[];
}
interface TemplateSection {
  key: string;
  title: string;
  description?: string;
  order: number;
  questions: TemplateQuestion[];
}
export type TemplateStructure = TemplateSection[];

const CILO_LK: LikertDescriptor[] = [
  { value: 1, label: "Not Achieved" },
  { value: 2, label: "Slightly Achieved" },
  { value: 3, label: "Moderately Achieved" },
  { value: 4, label: "Mostly Achieved" },
  { value: 5, label: "Fully Achieved" },
];
const AGR5: LikertDescriptor[] = [
  { value: 1, label: "Strongly Disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly Agree" },
];
const AGR4: LikertDescriptor[] = [
  { value: 1, label: "Strongly Disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Agree" },
  { value: 4, label: "Strongly Agree" },
];
const EV4: LikertDescriptor[] = [
  { value: 1, label: "Not Evident" },
  { value: 2, label: "Partially Evident" },
  { value: 3, label: "Evident" },
  { value: 4, label: "Highly Evident" },
];

function lk(key: string, prompt: string, order: number, d: LikertDescriptor[]): TemplateQuestion {
  return { key, prompt, type: "likert", order, required: true, likertDescriptors: d };
}
function oe(key: string, prompt: string, order: number, sug?: string[]): TemplateQuestion {
  const q: TemplateQuestion = { key, prompt, type: "guided_open_ended", order, required: false };
  if (sug) q.suggestedResponses = sug;
  return q;
}

// ── CILO Evaluation Tool ──────────────────────────────────────────────────────
export const ciloEvalStructure: TemplateStructure = [
  {
    key: "cilo-items",
    title: "Course Intended Learning Outcomes Evaluation",
    description:
      "Faculty bind each saved CILO to one Likert item before publishing this course-bound tool.",
    order: 1,
    questions: [
      lk("cilo-attainment-1", "I achieved the first course intended learning outcome.", 1, CILO_LK),
      lk(
        "cilo-attainment-2",
        "I achieved the second course intended learning outcome.",
        2,
        CILO_LK
      ),
      lk("cilo-attainment-3", "I achieved the third course intended learning outcome.", 3, CILO_LK),
    ],
  },
  {
    key: "overall-attainment",
    title: "Overall Course Outcome Attainment",
    order: 2,
    questions: [
      lk(
        "overall-attainment-1",
        "Overall, the course enabled me to achieve its intended learning outcomes",
        1,
        CILO_LK
      ),
    ],
  },
  {
    key: "facilities",
    title: "Facilities and Learning Resources Evaluation",
    order: 3,
    questions: [
      lk("facilities-1", "The classrooms were conducive to learning", 1, CILO_LK),
      lk(
        "facilities-2",
        "Laboratory facilities (if applicable) supported the learning outcomes",
        2,
        CILO_LK
      ),
      lk(
        "facilities-3",
        "Equipment, tools, or software required for the course were adequate",
        3,
        CILO_LK
      ),
      lk(
        "facilities-4",
        "Library, online resources, or learning materials were sufficient",
        4,
        CILO_LK
      ),
      lk(
        "facilities-5",
        "Overall, the facilities supported effective delivery of the subject",
        5,
        CILO_LK
      ),
    ],
  },
  {
    key: "qualitative",
    title: "Qualitative Feedback",
    description: "Optional open-ended feedback on your learning experience.",
    order: 4,
    questions: [
      oe("qualitative-1", "Which learning outcomes were fully achieved? Why?", 1),
      oe("qualitative-2", "Which learning outcomes were least achieved? Why?", 2),
      oe(
        "qualitative-3",
        "What facilities or resources need improvement to better support learning?",
        3
      ),
    ],
  },
];

// ── Graduating Student Exit Survey ────────────────────────────────────────────
export const exitSurveyStructure: TemplateStructure = [
  {
    key: "program-academic",
    title: "Program and Academic Experience",
    order: 1,
    questions: [
      lk(
        "program-academic-1",
        "The curriculum of my program was relevant and aligned with industry or professional standards.",
        1,
        AGR5
      ),
      lk("program-academic-2", "Courses were well-organized and appropriately sequenced.", 2, AGR5),
      lk(
        "program-academic-3",
        "Faculty members demonstrated strong subject expertise and effective teaching strategies.",
        3,
        AGR5
      ),
      lk(
        "program-academic-4",
        "Learning activities (lectures, discussions, projects, practicum, internships) supported my understanding of course outcomes.",
        4,
        AGR5
      ),
      lk(
        "program-academic-5",
        "Academic advising and program-level support were accessible and helpful.",
        5,
        AGR5
      ),
    ],
  },
  {
    key: "learning-outcomes",
    title: "Learning Outcomes and Skills Development",
    order: 2,
    questions: [
      lk(
        "learning-outcomes-1",
        "My program helped me develop critical thinking and problem-solving skills.",
        1,
        AGR5
      ),
      lk(
        "learning-outcomes-2",
        "I gained practical and technical skills relevant to my field of study.",
        2,
        AGR5
      ),
      lk(
        "learning-outcomes-3",
        "The program enhanced my communication skills (oral and written).",
        3,
        AGR5
      ),
      lk(
        "learning-outcomes-4",
        "I developed the ability to work effectively in teams and diverse environments.",
        4,
        AGR5
      ),
      lk(
        "learning-outcomes-5",
        "Ethical responsibility, professionalism, and social awareness were emphasized in my program.",
        5,
        AGR5
      ),
    ],
  },
  {
    key: "facilities",
    title: "Learning Environment and Facilities",
    order: 3,
    questions: [
      lk(
        "facilities-1",
        "Classrooms were conducive to learning in terms of space, lighting, ventilation, and seating.",
        1,
        AGR5
      ),
      lk(
        "facilities-2",
        "Laboratories, kitchens, offices, libraries, and other specialized facilities adequately supported my program requirements.",
        2,
        AGR5
      ),
      lk(
        "facilities-3",
        "Instructional technologies (LMS, computers, internet access, audiovisual tools) supported my learning effectively.",
        3,
        AGR5
      ),
      lk(
        "facilities-4",
        "Campus facilities (restrooms, study areas, common spaces, safety and security) were well-maintained and accessible.",
        4,
        AGR5
      ),
    ],
  },
  {
    key: "blended-learning",
    title: "Blended Learning Experience",
    order: 4,
    questions: [
      lk(
        "blended-learning-1",
        "The blended learning schedule was clearly communicated and well-organized.",
        1,
        AGR5
      ),
      lk(
        "blended-learning-2",
        "The balance between face-to-face and asynchronous classes supported my learning needs.",
        2,
        AGR5
      ),
      lk(
        "blended-learning-3",
        "Online and asynchronous learning materials were accessible, engaging, and aligned with course outcomes.",
        3,
        AGR5
      ),
      lk(
        "blended-learning-4",
        "Faculty provided adequate guidance, feedback, and support during asynchronous learning days.",
        4,
        AGR5
      ),
    ],
  },
  {
    key: "mission-formation",
    title: "Mission-Oriented Formation",
    order: 5,
    questions: [
      lk(
        "mission-formation-1",
        "My college experience strengthened my sense of Christ-centeredness and values.",
        1,
        AGR5
      ),
      lk(
        "mission-formation-2",
        "I was given opportunities to develop leadership skills inside and outside the classroom.",
        2,
        AGR5
      ),
      lk(
        "mission-formation-3",
        "The program promoted fairness, integrity, and a commitment to justice and service.",
        3,
        AGR5
      ),
      lk(
        "mission-formation-4",
        "I was challenged to pursue excellence in my academic, personal, and professional growth.",
        4,
        AGR5
      ),
    ],
  },
  {
    key: "overall-satisfaction",
    title: "Overall Satisfaction",
    order: 6,
    questions: [
      lk(
        "overall-satisfaction-1",
        "Overall, I am satisfied with my experience in the College.",
        1,
        AGR5
      ),
      lk(
        "overall-satisfaction-2",
        "My program adequately prepared me for employment, further studies, licensure, or entrepreneurship.",
        2,
        AGR5
      ),
      lk(
        "overall-satisfaction-3",
        "I would recommend my program and the College to prospective students.",
        3,
        AGR5
      ),
    ],
  },
  {
    key: "qualitative",
    title: "Qualitative Feedback",
    order: 7,
    questions: [
      oe(
        "qualitative-1",
        "What aspects of your program or college experience did you find most valuable?",
        1
      ),
      oe("qualitative-2", "What areas of your program or college services need improvement?", 2),
      oe(
        "qualitative-3",
        "How did the blended learning setup (face-to-face and asynchronous classes) affect your learning experience?",
        3
      ),
      oe(
        "qualitative-4",
        "Additional comments or suggestions for improving your program or the College:",
        4
      ),
    ],
  },
];

// ── Alumni Evaluation Tool ────────────────────────────────────────────────────
export const alumniEvalStructure: TemplateStructure = [
  {
    key: "program-experience",
    title: "Program Learning Experience",
    order: 1,
    questions: [
      lk(
        "program-experience-1",
        "The program provided a strong foundation in my field of study",
        1,
        AGR4
      ),
      lk("program-experience-2", "The courses were relevant to real-world applications", 2, AGR4),
      lk(
        "program-experience-3",
        "The program developed my critical thinking and problem-solving skills",
        3,
        AGR4
      ),
    ],
  },
  {
    key: "graduate-outcomes",
    title: "Graduate Outcomes Attainment",
    order: 2,
    questions: [
      lk(
        "graduate-outcomes-1",
        "I can apply knowledge and skills acquired from the program in my work",
        1,
        AGR4
      ),
      lk(
        "graduate-outcomes-2",
        "I can communicate effectively in a professional environment",
        2,
        AGR4
      ),
      lk("graduate-outcomes-3", "I demonstrate ethical and professional behavior", 3, AGR4),
      lk("graduate-outcomes-4", "I can work effectively with teams and stakeholders", 4, AGR4),
      lk(
        "graduate-outcomes-5",
        "I am capable of independent learning and self-improvement",
        5,
        AGR4
      ),
    ],
  },
  {
    key: "employment-readiness",
    title: "Employment and Readiness",
    order: 3,
    questions: [
      lk("employment-readiness-1", "The program adequately prepared me for employment", 1, AGR4),
      lk(
        "employment-readiness-2",
        "The skills I gained are aligned with industry expectations",
        2,
        AGR4
      ),
      lk("employment-readiness-3", "I was able to adapt quickly to workplace demands", 3, AGR4),
    ],
  },
  {
    key: "overall-assessment",
    title: "Overall Assessment",
    order: 4,
    questions: [
      lk("overall-assessment-1", "Overall satisfaction with the program", 1, AGR4),
      lk("overall-assessment-2", "Overall readiness as a graduate", 2, AGR4),
    ],
  },
  {
    key: "qualitative",
    title: "Qualitative Feedback",
    order: 5,
    questions: [
      oe("qualitative-1", "Strengths of the program:", 1),
      oe("qualitative-2", "Areas for improvement:", 2),
      oe("qualitative-3", "Suggestions to improve graduate readiness:", 3),
    ],
  },
];

// ── Industry Partner Internship Evaluation Tool ───────────────────────────────
export const industryEvalStructure: TemplateStructure = [
  {
    key: "knowledge",
    title: "Knowledge Competence",
    order: 1,
    questions: [
      lk("knowledge-1", "Applies theoretical knowledge to practical tasks", 1, EV4),
      lk("knowledge-2", "Demonstrates understanding of industry practices", 2, EV4),
      lk("knowledge-3", "Shows awareness of professional standards and procedures", 3, EV4),
    ],
  },
  {
    key: "skills",
    title: "Skills Competence",
    order: 2,
    questions: [
      lk("skills-1", "Performs assigned tasks effectively and accurately", 1, EV4),
      lk("skills-2", "Demonstrates problem-solving and critical thinking", 2, EV4),
      lk("skills-3", "Communicates clearly (oral and/or written)", 3, EV4),
      lk("skills-4", "Uses tools, equipment, or technology appropriately", 4, EV4),
    ],
  },
  {
    key: "professional-traits",
    title: "Professional and Character Traits",
    order: 3,
    questions: [
      lk("professional-traits-1", "Demonstrates professionalism and ethical behavior", 1, EV4),
      lk("professional-traits-2", "Shows initiative and willingness to learn", 2, EV4),
      lk("professional-traits-3", "Works well with supervisors and colleagues", 3, EV4),
      lk("professional-traits-4", "Demonstrates responsibility and reliability", 4, EV4),
    ],
  },
  {
    key: "overall-readiness",
    title: "Overall Graduate Readiness",
    order: 4,
    questions: [lk("overall-readiness-1", "Overall readiness for employment in the field", 1, EV4)],
  },
  {
    key: "qualitative",
    title: "Qualitative Feedback",
    order: 5,
    questions: [
      oe("qualitative-1", "Strengths of our interns:", 1),
      oe("qualitative-2", "Areas for improvement:", 2),
      oe("qualitative-3", "Recommendations for curriculum or training enhancement:", 3),
    ],
  },
  {
    key: "recommendation",
    title: "Recommendation",
    order: 6,
    questions: [
      oe("recommendation-1", "Would you recommend our graduates for employment?", 1, ["Yes", "No"]),
    ],
  },
];
