import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import Header from "@/components/Header";
import { 
  BookOpen, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  Lightbulb,
  Shield,
  Database,
  Server,
  Users,
  Target,
  Zap,
  Code,
  Brain,
  Trophy,
  ArrowRight,
  RefreshCw,
  Clock,
  MessageSquare,
  Play,
  Mic,
  FileText,
  ChevronRight
} from "lucide-react";

// ========== CHAPTER 2.5 SYSTEM MODEL PRESENTATION DATA ==========
const systemModelScript = {
  totalTime: "5 minutes",
  sections: [
    {
      id: "opening",
      title: "Opening - What is the System Model?",
      duration: "30 seconds",
      timeRange: "0:00 - 0:30",
      script: `"Good morning/afternoon. I'll be presenting Chapter 2.5: The System Model for CodeQuest.

The System Model defines WHO uses our system and HOW they interact with it. It consists of two main parts:
1. Actors and Scenarios - the users and their real-world interactions
2. Use Cases - the formal system behaviors

Let me walk you through each component."`,
      keyPoints: [
        "System Model = Actors + Scenarios + Use Cases",
        "Defines WHO uses the system",
        "Defines HOW they interact with it"
      ],
      tips: [
        "Make eye contact with the panel",
        "Speak slowly and clearly",
        "Show confidence - you know this!"
      ]
    },
    {
      id: "actors",
      title: "Part 1: Actors",
      duration: "45 seconds",
      timeRange: "0:30 - 1:15",
      script: `"CodeQuest has TWO primary actors:

First, the LEARNER - this is our main user. They're beginner programmers, self-paced learners, or university students. Their responsibilities include:
- Inputting code in the editor
- Attempting debugging challenges
- Requesting hints when stuck
- Tracking their learning progress

Second, the ADMINISTRATOR - the system manager. Their responsibilities include:
- Managing the curriculum (adding/editing quests)
- Reviewing statistical feedback on quest performance
- Removing users who violate policies

Both actors interact with the same system but see different interfaces based on their role - this is Role-Based Access Control in action."`,
      keyPoints: [
        "2 Actors: Learner & Administrator",
        "Learner = Primary user (beginner programmer)",
        "Admin = System manager (curriculum control)",
        "RBAC determines what each role can access"
      ],
      tips: [
        "Use your hands to show 'two' when saying actors",
        "Emphasize RBAC - it's a security feature"
      ]
    },
    {
      id: "scenarios",
      title: "Part 2: Key Scenarios (Real-World Flows)",
      duration: "1 minute 30 seconds",
      timeRange: "1:15 - 2:45",
      script: `"Now let me describe the KEY SCENARIOS - these are real-world interaction stories.

SCENARIO 1: Solving a Quest
Imagine a learner named Abebe. He selects a quest with a broken Python loop. He analyzes the code, identifies the logical flaw, modifies it, and clicks Submit. The Code Evaluator runs his code in a secure sandbox. The Quest Engine compares the output against our Success Criteria. If it passes, Abebe gets notified and unlocks the next quest.

SCENARIO 2: Requesting Hints
When a learner is stuck after multiple failed attempts, they click 'Request Hint'. The AI Assistant analyzes the difference between their code and the reference solution. It then provides a GRADUAL guiding question - not the answer - helping them reason through the problem themselves.

SCENARIO 3: Handling Infinite Loops
This is critical for security. If a learner accidentally writes an infinite loop, the Sandbox Manager monitors the execution time. After 5 seconds, it force-kills the process to prevent server instability. The learner receives a timeout notification suggesting they check for infinite loops.

SCENARIO 4: Admin Curriculum Update
An Admin logs in, reviews statistical feedback, and notices a quest has a 90% failure rate. They access Curriculum Management, modify the quest description or adjust the test cases, and save. The changes go live immediately for all learners."`,
      keyPoints: [
        "SCN-01: Learner solves quest → Sandbox executes → Quest Engine validates",
        "SCN-02: Stuck learner → AI hint (guiding question, not answer)",
        "SCN-04: Infinite loop → 5-second timeout → Force-kill",
        "SCN-05: Admin reviews stats → Updates curriculum"
      ],
      tips: [
        "Use Abebe's name - makes it personal and memorable",
        "Emphasize '5 seconds' for the timeout - it's a specific number examiners like",
        "Stress 'guiding question, not the answer' for hints"
      ]
    },
    {
      id: "usecases",
      title: "Part 3: Use Case Diagram & Core Use Cases",
      duration: "1 minute 30 seconds",
      timeRange: "2:45 - 4:15",
      script: `"Now for the formal Use Cases. [If you have a diagram, point to it]

The Use Case diagram shows our two actors - Learner on the left, Admin on the right - connected to the system's main functions.

Let me highlight the 6 CORE USE CASES:

UC-01: SUBMITTING CODE
The learner inputs their solution and clicks execute. The system receives the code for processing.

UC-02: EXECUTE CODE
The Code Evaluator runs the code in an isolated sandbox environment, monitoring for the 5-second safety limit.

UC-03: VALIDATING QUEST SUCCESS
The Quest Engine compares the output against predefined test cases. Pass → Quest marked complete. Fail → Learner notified code is still broken.

UC-04: UNLOCKING KNOWLEDGE SCROLL
Upon successful validation, the system automatically presents a brief theoretical explanation - this is our 'Discover then Learn' approach in action.

UC-05: REQUESTING HINTS
Learner clicks Request Hint → AI analyzes code difference → System provides context-aware guidance without the direct answer.

UC-06: CURRICULUM MANAGEMENT (Admin only)
Admin accesses the portal, adds or modifies quests based on analytics, and pushes changes live.

These use cases map directly to our functional requirements and will be implemented in the core system."`,
      keyPoints: [
        "6 Core Use Cases total",
        "UC-01 to UC-03: Code submission flow",
        "UC-04: Knowledge Scroll = 'Discover then Learn'",
        "UC-05: AI hints without answers",
        "UC-06: Admin curriculum control"
      ],
      tips: [
        "Point to diagram if available",
        "Connect back to 'Discover then Learn' - it's your project's unique value",
        "Mention 'maps to functional requirements' - shows system thinking"
      ]
    },
    {
      id: "closing",
      title: "Closing - Summary & Connection",
      duration: "45 seconds",
      timeRange: "4:15 - 5:00",
      script: `"To summarize the System Model:

We have TWO ACTORS: Learners who debug code, and Admins who manage curriculum.

We defined SEVEN SCENARIOS covering the complete user journey - from solving quests, to requesting hints, to handling errors, to admin management.

We formalized SIX USE CASES that will drive our implementation.

The System Model ensures we build the RIGHT system for the RIGHT users. It connects directly to our functional requirements and will guide our class design in the next chapter.

Thank you. I'm happy to take any questions."`,
      keyPoints: [
        "2 Actors, 7 Scenarios, 6+ Use Cases",
        "Connects to Functional Requirements",
        "Guides implementation design",
        "End confidently!"
      ],
      tips: [
        "Slow down for the summary",
        "Make eye contact with each panel member",
        "End with confidence - 'I'm happy to take questions'"
      ]
    }
  ]
};

// Examiner questions specific to System Model
const systemModelQuestions = [
  {
    question: "Why did you choose these two actors specifically?",
    answer: "Based on our requirement gathering, we identified two distinct user groups with different needs. Learners are our primary users - beginner programmers who need to practice debugging. Administrators are secondary users who need to manage content and monitor platform effectiveness. This separation also supports Role-Based Access Control for security.",
    difficulty: "Easy"
  },
  {
    question: "Explain the difference between a Scenario and a Use Case.",
    answer: "A Scenario is a specific, concrete story of one interaction - like 'Abebe solving a Python loop quest.' It has named actors and detailed steps. A Use Case is more abstract and formal - it describes the system behavior in general terms that can apply to any user. Scenarios help us understand real needs; Use Cases help us design the system.",
    difficulty: "Medium"
  },
  {
    question: "How does Scenario 4 (Infinite Loop) protect the system?",
    answer: "The Sandbox Manager implements a 5-second timeout. When code execution exceeds this limit, the process is force-killed. This prevents: 1) Server resource exhaustion, 2) Denial of service to other users, 3) System instability. Each user's sandbox is isolated, so one user's failure doesn't affect others.",
    difficulty: "Medium"
  },
  {
    question: "How do the Use Cases map to your Functional Requirements?",
    answer: "Direct mapping: UC-01/02 maps to FR-01 (Code Submission & Execution), UC-03 maps to FR-02 (Validation Logic) and FR-03 (Result Feedback), UC-04 maps to FR-05 (Progress Tracking), and the timeout scenario maps to FR-04 (Timeout Notification). This traceability ensures we implement exactly what users need.",
    difficulty: "Hard"
  },
  {
    question: "What's the flow when a learner submits code?",
    answer: "1) Learner writes code in the editor, 2) Clicks Submit, 3) Code sent to Application Server, 4) Code Evaluator executes in Sandbox (with 5-sec timeout), 5) Quest Engine compares output to TestCase expected values, 6) Result (Pass/Fail) returned to UI, 7) If Pass → Knowledge Scroll unlocked, Progress updated.",
    difficulty: "Medium"
  },
  {
    question: "How does the hint system work in UC-05?",
    answer: "When a learner clicks 'Request Hint': 1) The AI Assistant receives the learner's current code, 2) It compares against the reference solution, 3) It identifies the type of error (logical, syntax, etc.), 4) It generates a GUIDING QUESTION that points toward the issue without revealing the answer. For example, 'Have you checked if your loop counter is incrementing?' instead of 'Add i += 1'.",
    difficulty: "Medium"
  },
  {
    question: "Why separate Administrator from Learner roles?",
    answer: "Security and Separation of Concerns. Admins need access to curriculum management and analytics - functions that could disrupt learning if misused. Learners should only access quest-solving features. This separation enables: 1) Role-Based Access Control (RBAC), 2) Audit trails per role, 3) Different UI experiences, 4) Protection against privilege escalation attacks.",
    difficulty: "Medium"
  },
  {
    question: "What happens if the Admin modifies a quest a learner is currently solving?",
    answer: "The learner's in-progress session uses cached quest data. Changes only apply to new attempts. When the learner submits, validation uses the NEW test cases. If there's a mismatch, the system gracefully handles it by notifying the learner that quest content has been updated and offering a fresh start.",
    difficulty: "Hard"
  }
];

// Practice exercises for System Model
const systemModelExercises = [
  {
    type: "Fill in the Blank",
    question: "CodeQuest has ___ actors: _______ and _______.",
    answer: "2; Learner; Administrator",
    hint: "Think about who uses the system to learn vs. who manages it"
  },
  {
    type: "Explain",
    question: "In 2 sentences, explain what happens in Scenario 4 (Infinite Loop).",
    answer: "When a learner's code runs for more than 5 seconds, the Sandbox Manager force-kills the process. The learner receives a timeout notification and the system remains stable.",
    hint: "Focus on the timeout duration and the safety mechanism"
  },
  {
    type: "List",
    question: "Name 4 responsibilities of the Learner actor.",
    answer: "1) Input code in editor, 2) Attempt debugging challenges, 3) Request hints when stuck, 4) Track learning progress",
    hint: "What does a student DO on the platform?"
  },
  {
    type: "Diagram",
    question: "Draw the flow: Learner submits code → ??? → Learner sees result",
    answer: "Learner → Submit → Application Server → Sandbox Execution → Quest Engine Validation → Result (Pass/Fail) → UI Display",
    hint: "Think about what systems process the code before returning a result"
  },
  {
    type: "Compare",
    question: "What's the difference between UC-03 (Validate Quest) and UC-04 (Knowledge Scroll)?",
    answer: "UC-03 determines if code passes by comparing output to test cases. UC-04 ONLY triggers when UC-03 succeeds - it unlocks theoretical content. UC-03 = validation logic, UC-04 = reward/learning mechanism.",
    hint: "One is about checking correctness, the other is about what happens after success"
  },
  {
    type: "Scenario",
    question: "A learner named Sara is stuck on a recursion quest. Walk through what happens when she clicks 'Request Hint'.",
    answer: "1) Sara clicks 'Request Hint' button, 2) System sends her current code to AI Assistant, 3) AI compares Sara's code with reference solution, 4) AI identifies she forgot the base case, 5) System returns: 'What happens when your function has nothing to recurse on?' (not the answer), 6) Sara reads hint and modifies her code.",
    hint: "Remember: the AI gives guiding questions, not answers"
  }
];

// Quiz Questions Data
const quizQuestions = [
  {
    id: 1,
    category: "Introduction",
    question: "What is the main learning approach used by CodeQuest?",
    options: [
      "Tutorial-based learning",
      "Discover then Learn (debugging-first)",
      "Video-based instruction",
      "Reading documentation"
    ],
    correct: 1,
    explanation: "CodeQuest uses the 'Discover then Learn' approach where learners fix bugs first, then learn the underlying concept through Knowledge Scrolls."
  },
  {
    id: 2,
    category: "Architecture",
    question: "How many subsystems are in CodeQuest's architecture?",
    options: ["4", "6", "8", "10"],
    correct: 2,
    explanation: "CodeQuest has 8 subsystems: UI, User Management, Quest Management, Execution & Validation, Secure Sandbox, AI & Analytics, Database Management, and Logging & Monitoring."
  },
  {
    id: 3,
    category: "Security",
    question: "What is the timeout limit for code execution in the sandbox?",
    options: ["2 seconds", "5 seconds", "10 seconds", "30 seconds"],
    correct: 1,
    explanation: "The sandbox enforces a 5-second execution timeout to prevent infinite loops and protect system resources."
  },
  {
    id: 4,
    category: "Security",
    question: "How many security layers does CodeQuest implement?",
    options: ["3", "4", "5", "6"],
    correct: 3,
    explanation: "CodeQuest implements 6 security layers: Network, Application, Authentication, Authorization, Data Security, and Sandbox Security (Defense in Depth)."
  },
  {
    id: 5,
    category: "Database",
    question: "Which entity stores the learner's XP and level?",
    options: ["User", "Learner", "Progress", "Submission"],
    correct: 1,
    explanation: "The Learner entity (1:1 with User) stores current_level and total_points (XP)."
  },
  {
    id: 6,
    category: "Features",
    question: "What happens after a learner successfully completes a quest?",
    options: [
      "They get a certificate",
      "A Knowledge Scroll is unlocked with concept explanation",
      "They can skip the next quest",
      "Nothing special happens"
    ],
    correct: 1,
    explanation: "After successful completion, the system unlocks a 'Knowledge Scroll' with a brief theoretical explanation of the programming concept."
  },
  {
    id: 7,
    category: "Architecture",
    question: "What technology is used for authentication?",
    options: ["Session cookies", "OAuth only", "JWT (JSON Web Tokens)", "API keys"],
    correct: 2,
    explanation: "CodeQuest uses JWT-based authentication for secure session management."
  },
  {
    id: 8,
    category: "Performance",
    question: "What is the target response time for 95% of requests?",
    options: ["500ms", "1 second", "2 seconds", "5 seconds"],
    correct: 2,
    explanation: "The system aims to return results within 2 seconds for 95% of requests."
  },
  {
    id: 9,
    category: "Security",
    question: "What is the rate limit for code submissions?",
    options: ["1 per minute", "5 per minute", "10 per minute", "Unlimited"],
    correct: 1,
    explanation: "Learners are limited to 5 code submissions per minute to prevent DoS attacks."
  },
  {
    id: 10,
    category: "Features",
    question: "How does the AI hint system work?",
    options: [
      "Gives the full answer",
      "Provides gradual guiding questions without revealing the answer",
      "Shows the solution code",
      "Only says 'try again'"
    ],
    correct: 1,
    explanation: "The AI analyzes the difference between learner code and solution, providing context-specific guiding questions—not direct answers."
  },
  {
    id: 11,
    category: "Database",
    question: "What are the 6 core database entities?",
    options: [
      "User, Admin, Quest, Test, Code, Result",
      "User, Learner, Quest, TestCase, Submission, Progress",
      "Account, Profile, Challenge, Answer, Score, Badge",
      "Student, Teacher, Lesson, Quiz, Grade, Certificate"
    ],
    correct: 1,
    explanation: "The 6 entities are: User, Learner, Quest, TestCase, Submission, and Progress."
  },
  {
    id: 12,
    category: "Methodology",
    question: "How many phases are in the project timeline?",
    options: ["4", "5", "6", "7"],
    correct: 3,
    explanation: "The project has 7 phases: Planning, Prototype, Core Implementation, AI Features, Testing, Deployment, and Final Review."
  }
];

// Examiner Questions Data
const examinerQuestions = [
  {
    category: "Problem & Solution",
    questions: [
      {
        question: "Why debugging-first instead of traditional tutorials?",
        answer: "Research shows active problem-solving creates deeper understanding than passive learning. Studies on 'productive failure' demonstrate that struggling first, then receiving explanation leads to better retention. Traditional platforms like FreeCodeCamp focus on syntax, not the debugging intuition needed in real jobs."
      },
      {
        question: "How is CodeQuest different from existing platforms?",
        answer: "Unlike FreeCodeCamp/W3Schools that teach syntax linearly, CodeQuest presents broken code first. Unlike YouTube tutorials where learners just follow along, CodeQuest forces exploration and hypothesis-forming. The combination of gamification + AI hints + secure sandbox is unique."
      },
      {
        question: "What problem does CodeQuest solve?",
        answer: "Beginners can follow tutorials but fail when facing real errors. There's a gap between theoretical knowledge and problem-solving proficiency. Existing platforms don't cultivate 'debugging intuition'—the skill of reading errors, interpreting outputs, and reasoning through solutions."
      }
    ]
  },
  {
    category: "Technical Architecture",
    questions: [
      {
        question: "Explain the system architecture briefly.",
        answer: "Client (UI) → Application Server (Quest Engine, Auth, Validation) → Sandbox Cluster (isolated code execution). Supporting: PostgreSQL Database, AI Cloud Service for hints, and Logging/Monitoring. All connected via HTTPS, with sandbox isolated via TCP."
      },
      {
        question: "What are the 8 subsystems and their purposes?",
        answer: "1) UI - Web IDE, dashboards. 2) User Management - JWT auth, RBAC. 3) Quest Management - CRUD for quests/tests. 4) Execution & Validation - core logic engine. 5) Secure Sandbox - isolated code execution. 6) AI & Analytics - hints, progress tracking. 7) Database - PostgreSQL persistence. 8) Logging - audit trails, metrics."
      },
      {
        question: "Why build from scratch instead of using existing LMS?",
        answer: "Three reasons: 1) Security - existing LMS lack OS-level sandbox isolation. 2) Real-time constraints - need strict 5-second timeout. 3) AI integration - building fresh allows AI hints as core component, not bolted-on."
      }
    ]
  },
  {
    category: "Security",
    questions: [
      {
        question: "How do you prevent malicious code execution?",
        answer: "Defense in Depth with 6 layers: Network (HTTPS/WAF), Application (input validation, rate limiting), Authentication (JWT), Authorization (RBAC), Data (AES-256 encryption), and Sandbox (process isolation, 5-sec timeout, no network access, resource limits)."
      },
      {
        question: "What happens if a user writes an infinite loop?",
        answer: "The Sandbox Manager detects code running > 5 seconds, force-kills the process, and returns a timeout notification to the user. One user's failure doesn't affect other users' sessions due to isolation."
      },
      {
        question: "Explain the 6 security layers.",
        answer: "Layer 1: Network - HTTPS/TLS encryption, WAF, DDoS protection. Layer 2: Application - Input validation, CSRF protection, rate limiting. Layer 3: Authentication - JWT tokens, bcrypt password hashing. Layer 4: Authorization - Role-based access control. Layer 5: Data - AES-256 encryption at rest. Layer 6: Sandbox - Isolated execution, resource limits."
      }
    ]
  },
  {
    category: "Database & Data",
    questions: [
      {
        question: "Explain the database schema.",
        answer: "6 entities: User (auth data), Learner (1:1 with User, stores XP/level), Quest (challenges with initial/solution code), TestCase (inputs/expected outputs, N:1 with Quest), Submission (learner attempts, linked to User+Quest), Progress (status tracking per user per quest)."
      },
      {
        question: "Why separate User and Learner tables?",
        answer: "Security - separates authentication credentials from learner metrics, minimizing data exposed during quest operations. Also allows for different user types (Admin vs Learner) with shared base auth."
      },
      {
        question: "What data does the system collect?",
        answer: "User-generated (code submissions, error logs, hints requested, quest progression), Challenge data (curated debugging tasks with concept metadata), System metrics (execution rates, performance timing), and Feedback data from pilot users."
      }
    ]
  },
  {
    category: "Features & User Experience",
    questions: [
      {
        question: "How does the hint system work without giving answers?",
        answer: "The AI compares learner code with reference solution, identifies common error patterns, and generates context-specific guiding questions. For example, instead of 'move line 4 up', it might ask 'In Python, can you use a variable before defining it?'"
      },
      {
        question: "What gamification elements are included?",
        answer: "XP points for completing quests, difficulty levels (Easy/Medium/Hard), achievements/badges (First Blood, Bug Hunter, Speed Demon), progress maps showing completed/locked quests, streaks for daily activity, and leaderboards (future feature)."
      },
      {
        question: "What is a 'Knowledge Scroll'?",
        answer: "A brief theoretical explanation unlocked after successfully completing a quest. It connects the practical fix the learner just made to the underlying programming concept, reinforcing the 'discover then learn' approach."
      }
    ]
  },
  {
    category: "Performance & Scalability",
    questions: [
      {
        question: "What are the performance requirements?",
        answer: "Results within 2 seconds for 95% of requests, support for 50 concurrent code executions, 99% uptime during active hours, and the 5-second sandbox timeout."
      },
      {
        question: "How will the system scale?",
        answer: "Modular microservice architecture allows independent scaling. Cloud deployment (AWS/GCP/Azure) with multi-zone for resilience. Containerized sandbox can be replicated. The design supports adding new programming languages without major refactoring."
      },
      {
        question: "What potential challenges did you identify?",
        answer: "1) Balanced difficulty (using A/B testing, analytics). 2) Code security (6-layer defense). 3) User motivation (gamification, streaks). 4) Performance overhead (caching, distributed execution). 5) Real-world relevance (basing challenges on real beginner errors)."
      }
    ]
  },
  {
    category: "Methodology & Process",
    questions: [
      {
        question: "What development methodology did you use?",
        answer: "Agile methodology with modular iterative design. Each module (quests, sandbox, hints, progress tracking) designed, tested, and revised in short cycles."
      },
      {
        question: "Explain the 7 project phases.",
        answer: "1) Weeks 1-3: Planning & requirements. 2) Weeks 4-6: Prototype (basic quest, auth, editor). 3) Weeks 7-12: Core system (sandbox, execution). 4) Weeks 13-15: AI hints, analytics. 5) Weeks 16-19: Testing (unit, integration, usability). 6) Weeks 20-21: Deployment, optimization. 7) Week 22: Final review."
      },
      {
        question: "How will you measure success?",
        answer: "Learning metrics (error reduction, completion rates without hints, faster solve times), Engagement metrics (active users, session duration, hint dependency decrease), System metrics (uptime, response times), and Educational impact (pre/post tests, instructor feedback)."
      }
    ]
  }
];

// Content Sections Data
const contentSections = [
  {
    id: "introduction",
    title: "1. Introduction - What is CodeQuest?",
    icon: BookOpen,
    content: [
      {
        subtitle: "Elevator Pitch (30 seconds)",
        text: "CodeQuest is an interactive, quest-based web platform that teaches programming through debugging challenges. Instead of passive tutorials, learners fix broken code to discover programming concepts themselves."
      },
      {
        subtitle: "The Problem It Solves",
        bullets: [
          "Beginners can follow tutorials but struggle with real errors",
          "Traditional platforms teach syntax, not debugging intuition",
          "Gap between theoretical knowledge and problem-solving proficiency"
        ]
      },
      {
        subtitle: "Your Innovation",
        bullets: [
          "\"Discover then Learn\" approach - fix the bug first, learn the concept after",
          "Gamification (XP, levels, achievements) for engagement",
          "Gradual hints without giving answers"
        ]
      }
    ]
  },
  {
    id: "objectives",
    title: "2. Objectives",
    icon: Target,
    content: [
      {
        subtitle: "General Objective",
        text: "Interactive web platform teaching programming through debugging"
      },
      {
        subtitle: "Specific Objectives",
        bullets: [
          "Gamified quest system with broken/incomplete code",
          "Gradual hints + post-solution concept explanations (\"Knowledge Scrolls\")",
          "User progress tracking dashboard",
          "AI assistance for context-aware hints",
          "Evaluate platform effectiveness in improving debugging skills"
        ]
      }
    ]
  },
  {
    id: "architecture",
    title: "3. Technical Architecture",
    icon: Server,
    content: [
      {
        subtitle: "System Flow",
        text: "Client (UI) → Application Server → Sandbox Cluster → Database + AI Cloud + Logging"
      },
      {
        subtitle: "8 Subsystems (Memorize!)",
        bullets: [
          "1. User Interface (UI) - Web IDE, dashboards, captures code submissions",
          "2. User Management - JWT authentication, RBAC (Learner/Admin roles)",
          "3. Quest Management - Create/edit quests, difficulty levels, test cases",
          "4. Execution & Validation - Core logic engine, sends code to sandbox",
          "5. Secure Sandbox - Isolated container, 5-sec timeout, network isolation",
          "6. AI & Analytics - Generates hints via LLM, tracks learner progress",
          "7. Database Management - PostgreSQL: users, quests, submissions, progress",
          "8. Logging & Monitoring - Audit trails, security events, sandbox metrics"
        ]
      }
    ]
  },
  {
    id: "security",
    title: "4. Security - Defense in Depth",
    icon: Shield,
    content: [
      {
        subtitle: "6 Security Layers",
        bullets: [
          "Layer 1: Network Security - HTTPS/TLS, WAF, DDoS protection",
          "Layer 2: Application Security - Input validation, CSRF, rate limiting (5 submissions/min)",
          "Layer 3: Authentication - JWT tokens, bcrypt password hashing",
          "Layer 4: Authorization - Role-Based Access Control (RBAC)",
          "Layer 5: Data Security - AES-256 encryption at rest",
          "Layer 6: Sandbox Security - 5-sec timeout, no network, process isolation"
        ]
      },
      {
        subtitle: "Why 6 Layers?",
        text: "If one fails, others still protect the system. Based on NIST/OWASP standards."
      }
    ]
  },
  {
    id: "database",
    title: "5. Database Schema",
    icon: Database,
    content: [
      {
        subtitle: "6 Core Entities",
        bullets: [
          "User - id, username, email, password_hash, role (parent of Learner)",
          "Learner - current_level, total_points (1:1 with User)",
          "Quest - title, description, level, initial_code, solution_code, explanation",
          "TestCase - input_data, expected_output, is_hidden (N:1 with Quest)",
          "Submission - submitted_code, result (Pass/Fail), execution_time, error_message",
          "Progress - status (Started/Completed), last_attempt_at (links User + Quest)"
        ]
      }
    ]
  },
  {
    id: "usecases",
    title: "6. Key Use Cases",
    icon: Users,
    content: [
      {
        subtitle: "Core Flows",
        bullets: [
          "UC-01: Submit Code → Sandbox executes → Compare with test cases → Pass/Fail",
          "UC-02: Validate Success → Unlock \"Knowledge Scroll\" on success",
          "UC-03: Request Hint → AI analyzes code diff → Gradual hint (not answer)",
          "UC-04: Handle Infinite Loop → Code >5 sec → Force-kill → Timeout notification",
          "UC-05: View Progress → Quest map, completed quests, XP earned",
          "UC-06: Admin Manages Content → Create/edit/delete quests, view analytics"
        ]
      }
    ]
  },
  {
    id: "nfr",
    title: "7. Non-Functional Requirements",
    icon: Zap,
    content: [
      {
        subtitle: "Performance",
        bullets: [
          "Results within 2 seconds for 95% of requests",
          "Support 50 concurrent code executions",
          "99% uptime during active hours"
        ]
      },
      {
        subtitle: "Security",
        bullets: [
          "Rate limiting: 5 code submissions per minute",
          "Sandbox: Force-kill in 5 seconds (infinite loops)",
          "Isolation: One user's failure doesn't affect others"
        ]
      },
      {
        subtitle: "Scalability",
        bullets: [
          "Cloud-hosted (AWS/GCP/Azure)",
          "Multi-zone deployment for resilience",
          "Modular architecture for adding languages"
        ]
      }
    ]
  },
  {
    id: "methodology",
    title: "8. Methodology - 7 Phases",
    icon: Code,
    content: [
      {
        subtitle: "Project Timeline",
        bullets: [
          "Phase 1 (Weeks 1-3): Planning, requirements, wireframes",
          "Phase 2 (Weeks 4-6): Prototype (basic quest, auth, editor)",
          "Phase 3 (Weeks 7-12): Core system (sandbox, execution engine)",
          "Phase 4 (Weeks 13-15): AI hints, analytics dashboard",
          "Phase 5 (Weeks 16-19): Testing (unit, integration, usability)",
          "Phase 6 (Weeks 20-21): Deployment, load testing, optimization",
          "Phase 7 (Week 22): Final review, future planning"
        ]
      }
    ]
  },
  {
    id: "research",
    title: "9. Research Foundation",
    icon: Brain,
    content: [
      {
        subtitle: "Key Studies to Reference",
        bullets: [
          "Active Learning Theory: Learning by doing > passive reading",
          "Productive Failure: Struggle first → explanation after = better retention",
          "Gamification Research: Quests, XP, achievements boost engagement",
          "Debugging Pedagogy: Forces hypothesis-forming, cause-effect thinking"
        ]
      },
      {
        subtitle: "Existing Systems Analyzed",
        bullets: [
          "FreeCodeCamp/W3Schools: Good curriculum, but no debugging practice",
          "YouTube Tutorials: Follow-along, but no exploration/experimentation"
        ]
      }
    ]
  },
  {
    id: "differentiators",
    title: "10. Key Differentiators",
    icon: Trophy,
    content: [
      {
        subtitle: "What Makes CodeQuest Unique",
        bullets: [
          "1. Debugging-First Learning - Not syntax tutorials",
          "2. Discover → Learn - Concept explanation AFTER solving",
          "3. Gradual Hints - AI helps without spoiling",
          "4. Gamification - XP, levels, achievements, streaks",
          "5. Secure Sandbox - Real code execution safely",
          "6. Admin Analytics - Track learner progress"
        ]
      }
    ]
  },
  {
    id: "future",
    title: "11. Future Work",
    icon: Lightbulb,
    content: [
      {
        subtitle: "Planned Enhancements",
        bullets: [
          "Add more languages (Java, Rust, Go)",
          "Multiplayer debugging challenges",
          "Instructor dashboards for classrooms",
          "More sophisticated AI tutors",
          "Mobile app version"
        ]
      }
    ]
  }
];

const PresentationPractice = () => {
  const [activeTab, setActiveTab] = useState("system-model");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<number[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const handleAnswerSelect = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;
    
    setShowResult(true);
    if (selectedAnswer === quizQuestions[currentQuestion].correct) {
      setScore(score + 1);
    }
    setAnsweredQuestions([...answeredQuestions, currentQuestion]);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizCompleted(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setAnsweredQuestions([]);
    setQuizCompleted(false);
  };

  const progressPercentage = ((currentQuestion + 1) / quizQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <Badge variant="outline" className="mb-2">Presentation Preparation</Badge>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              CodeQuest Presentation Practice
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Master every detail of your final year project. Study the content, practice with quizzes, 
              and prepare for examiner questions.
            </p>
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-4">
              <TabsTrigger value="system-model" className="gap-2">
                <Mic className="w-4 h-4" />
                <span className="hidden sm:inline">Ch 2.5</span> Script
              </TabsTrigger>
              <TabsTrigger value="content" className="gap-2">
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Study</span> Content
              </TabsTrigger>
              <TabsTrigger value="questions" className="gap-2">
                <HelpCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Examiner</span> Q&A
              </TabsTrigger>
              <TabsTrigger value="quiz" className="gap-2">
                <Brain className="w-4 h-4" />
                <span className="hidden sm:inline">Practice</span> Quiz
              </TabsTrigger>
            </TabsList>

            {/* ========== CHAPTER 2.5 SYSTEM MODEL TAB ========== */}
            <TabsContent value="system-model" className="space-y-6">
              {/* Overview Card */}
              <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/20 rounded-xl">
                        <Mic className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Chapter 2.5: System Model</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">Your 5-Minute Presentation Script</p>
                      </div>
                    </div>
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      <Clock className="w-3 h-3 mr-1" />
                      {systemModelScript.totalTime}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    This is your complete, word-for-word script for presenting the System Model section. 
                    Each section includes exact timing, what to say, key points to emphasize, and presentation tips.
                  </p>
                </CardContent>
              </Card>

              {/* Timeline Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Presentation Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {systemModelScript.sections.map((section, idx) => (
                      <div key={section.id} className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {section.timeRange}
                        </Badge>
                        <span className="text-sm font-medium">{section.title.split(' - ')[0]}</span>
                        {idx < systemModelScript.sections.length - 1 && (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Script Sections */}
              <div className="space-y-4">
                {systemModelScript.sections.map((section, idx) => (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className="overflow-hidden">
                      <CardHeader className="bg-secondary/30 border-b">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                              {idx + 1}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{section.title}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {section.duration}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {section.timeRange}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" className="gap-1">
                            <Play className="w-4 h-4" />
                            Practice
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        {/* Script */}
                        <div className="space-y-2">
                          <h4 className="font-semibold flex items-center gap-2 text-primary">
                            <MessageSquare className="w-4 h-4" />
                            What to Say (Script)
                          </h4>
                          <div className="bg-muted/50 rounded-lg p-4 border-l-4 border-primary">
                            <p className="whitespace-pre-line text-sm leading-relaxed font-medium">
                              {section.script}
                            </p>
                          </div>
                        </div>

                        {/* Key Points */}
                        <div className="space-y-2">
                          <h4 className="font-semibold flex items-center gap-2 text-primary">
                            <Target className="w-4 h-4" />
                            Key Points to Emphasize
                          </h4>
                          <ul className="grid gap-2">
                            {section.keyPoints.map((point, pIdx) => (
                              <li key={pIdx} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Presentation Tips */}
                        <div className="space-y-2">
                          <h4 className="font-semibold flex items-center gap-2 text-amber-500">
                            <Lightbulb className="w-4 h-4" />
                            Presentation Tips
                          </h4>
                          <ul className="grid gap-2">
                            {section.tips.map((tip, tIdx) => (
                              <li key={tIdx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <span className="text-amber-500">💡</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* System Model Q&A */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-orange-500" />
                    System Model - Expected Questions
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Questions examiners might ask specifically about Chapter 2.5
                  </p>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="space-y-2">
                    {systemModelQuestions.map((q, idx) => (
                      <AccordionItem key={idx} value={`q-${idx}`} className="border rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline text-left">
                          <div className="flex items-start gap-3 flex-1">
                            <HelpCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <span className="font-medium">{q.question}</span>
                              <Badge 
                                variant="outline" 
                                className={`ml-2 text-xs ${
                                  q.difficulty === 'Easy' ? 'border-green-500 text-green-500' :
                                  q.difficulty === 'Medium' ? 'border-amber-500 text-amber-500' :
                                  'border-red-500 text-red-500'
                                }`}
                              >
                                {q.difficulty}
                              </Badge>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4">
                          <div className="ml-8 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                              <p className="text-sm">{q.answer}</p>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>

              {/* Practice Exercises */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Practice Exercises
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Test your understanding before the presentation
                  </p>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="space-y-2">
                    {systemModelExercises.map((ex, idx) => (
                      <AccordionItem key={idx} value={`ex-${idx}`} className="border rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline text-left">
                          <div className="flex items-start gap-3">
                            <Badge variant="secondary" className="text-xs">
                              {ex.type}
                            </Badge>
                            <span className="font-medium">{ex.question}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4 space-y-3">
                          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                            <div className="flex items-start gap-2">
                              <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                              <p className="text-sm"><strong>Hint:</strong> {ex.hint}</p>
                            </div>
                          </div>
                          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                              <p className="text-sm"><strong>Answer:</strong> {ex.answer}</p>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Study Content Tab */}
            <TabsContent value="content" className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <Accordion type="single" collapsible className="space-y-2">
                    {contentSections.map((section) => (
                      <AccordionItem key={section.id} value={section.id} className="border rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <section.icon className="w-5 h-5 text-primary" />
                            </div>
                            <span className="font-semibold">{section.title}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 pb-6">
                          <div className="space-y-4 pl-12">
                            {section.content.map((item, idx) => (
                              <div key={idx} className="space-y-2">
                                <h4 className="font-medium text-primary">{item.subtitle}</h4>
                                {item.text && (
                                  <p className="text-muted-foreground">{item.text}</p>
                                )}
                                {item.bullets && (
                                  <ul className="space-y-1">
                                    {item.bullets.map((bullet, bIdx) => (
                                      <li key={bIdx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                        <span className="text-primary mt-1">•</span>
                                        {bullet}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Examiner Q&A Tab */}
            <TabsContent value="questions" className="space-y-4">
              <div className="grid gap-4">
                {examinerQuestions.map((category, catIdx) => (
                  <Card key={catIdx}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Badge variant="secondary">{category.category}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="space-y-2">
                        {category.questions.map((q, qIdx) => (
                          <AccordionItem key={qIdx} value={`${catIdx}-${qIdx}`} className="border-b-0">
                            <AccordionTrigger className="hover:no-underline text-left">
                              <div className="flex items-start gap-3">
                                <HelpCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                                <span className="font-medium">{q.question}</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 pb-4">
                              <div className="ml-8 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                                <div className="flex items-start gap-2">
                                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                  <p className="text-sm">{q.answer}</p>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Quiz Tab */}
            <TabsContent value="quiz" className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <AnimatePresence mode="wait">
                    {!quizCompleted ? (
                      <motion.div
                        key="quiz"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        {/* Progress */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Question {currentQuestion + 1} of {quizQuestions.length}</span>
                            <span>Score: {score}/{answeredQuestions.length}</span>
                          </div>
                          <Progress value={progressPercentage} className="h-2" />
                        </div>

                        {/* Category Badge */}
                        <Badge variant="outline">
                          {quizQuestions[currentQuestion].category}
                        </Badge>

                        {/* Question */}
                        <h3 className="text-xl font-semibold">
                          {quizQuestions[currentQuestion].question}
                        </h3>

                        {/* Options */}
                        <div className="space-y-3">
                          {quizQuestions[currentQuestion].options.map((option, idx) => {
                            const isCorrect = idx === quizQuestions[currentQuestion].correct;
                            const isSelected = idx === selectedAnswer;
                            
                            let optionClass = "border-2 p-4 rounded-lg cursor-pointer transition-all";
                            
                            if (showResult) {
                              if (isCorrect) {
                                optionClass += " border-green-500 bg-green-500/10";
                              } else if (isSelected && !isCorrect) {
                                optionClass += " border-red-500 bg-red-500/10";
                              } else {
                                optionClass += " border-muted opacity-50";
                              }
                            } else {
                              optionClass += isSelected 
                                ? " border-primary bg-primary/10" 
                                : " border-muted hover:border-primary/50";
                            }

                            return (
                              <motion.div
                                key={idx}
                                whileHover={!showResult ? { scale: 1.01 } : {}}
                                whileTap={!showResult ? { scale: 0.99 } : {}}
                                className={optionClass}
                                onClick={() => handleAnswerSelect(idx)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                                    isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
                                  }`}>
                                    {String.fromCharCode(65 + idx)}
                                  </div>
                                  <span>{option}</span>
                                  {showResult && isCorrect && (
                                    <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto" />
                                  )}
                                  {showResult && isSelected && !isCorrect && (
                                    <XCircle className="w-5 h-5 text-red-500 ml-auto" />
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>

                        {/* Explanation */}
                        {showResult && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg"
                          >
                            <div className="flex items-start gap-2">
                              <Lightbulb className="w-5 h-5 text-blue-500 mt-0.5" />
                              <p className="text-sm">{quizQuestions[currentQuestion].explanation}</p>
                            </div>
                          </motion.div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end gap-3">
                          {!showResult ? (
                            <Button 
                              onClick={handleSubmitAnswer}
                              disabled={selectedAnswer === null}
                            >
                              Submit Answer
                            </Button>
                          ) : (
                            <Button onClick={handleNextQuestion} className="gap-2">
                              {currentQuestion < quizQuestions.length - 1 ? (
                                <>
                                  Next Question
                                  <ArrowRight className="w-4 h-4" />
                                </>
                              ) : (
                                "See Results"
                              )}
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="results"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-6 py-8"
                      >
                        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary to-purple-500 rounded-full flex items-center justify-center">
                          <Trophy className="w-12 h-12 text-white" />
                        </div>
                        
                        <div>
                          <h3 className="text-2xl font-bold">Quiz Complete!</h3>
                          <p className="text-muted-foreground mt-2">
                            You scored {score} out of {quizQuestions.length}
                          </p>
                        </div>

                        <div className="text-6xl font-bold">
                          {Math.round((score / quizQuestions.length) * 100)}%
                        </div>

                        <div className="flex justify-center gap-3">
                          <Button onClick={resetQuiz} variant="outline" className="gap-2">
                            <RefreshCw className="w-4 h-4" />
                            Try Again
                          </Button>
                          <Button onClick={() => setActiveTab("questions")}>
                            Review Q&A
                          </Button>
                        </div>

                        {score === quizQuestions.length && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-green-500 font-medium"
                          >
                            🎉 Perfect score! You're ready for the presentation!
                          </motion.p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
};

export default PresentationPractice;
