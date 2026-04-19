import { WizardShell } from "@/components/student/evaluations/wizard-shell";

export default function EvaluationPage() {
  const mockForm = {
    title: "Post-Term CILO Evaluation Tool",
    sections: [
      { 
        name: "Section B: Course Intended Learning Outcomes", 
        description: "Please rate the extent to which the following CILO were attained:",
        questions: [
          { id: 1, text: "CILO 1: Analyze complex computing problems and apply principles of computing." },
          { id: 2, text: "CILO 2: Design, implement, and evaluate a computing-based solution." },
          { id: 3, text: "CILO 3: Recognize professional responsibilities and make informed judgments." },
        ]
      },
      {
        name: "Section D: Facilities and Resources",
        description: "Please rate the level to which the following statements were attained:",
        questions: [
          { id: 4, text: "The classrooms were conducive to learning." },
          { id: 5, text: "Equipment, tools, or software required for the course were adequate." },
        ]
      }
    ]
  };

  return <WizardShell {...mockForm} />;
}
