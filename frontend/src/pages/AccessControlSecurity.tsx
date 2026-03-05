import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Lock, 
  Key, 
  Users, 
  Database, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Layers,
  Globe,
  Server,
  FileCode,
  Eye,
  EyeOff,
  Printer,
  Download,
  GitBranch,
  FileText
} from "lucide-react";
import Header from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Document, Packer, Paragraph, TextRun, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell, HeadingLevel, BorderStyle, WidthType, AlignmentType } from "docx";
import { saveAs } from "file-saver";

const AccessControlSecurity = () => {
  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    // Create a new window with print-optimized content for PDF export
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const pdfContent = `
<!DOCTYPE html>
<html>
<head>
  <title>CodeQuest - Access Control & Security Documentation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      padding: 40px; 
      color: #1a1a1a;
      line-height: 1.6;
    }
    h1 { font-size: 24px; margin-bottom: 8px; color: #0f172a; }
    h2 { font-size: 18px; margin: 24px 0 12px; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    h3 { font-size: 14px; margin: 16px 0 8px; color: #334155; }
    p { margin-bottom: 12px; color: #475569; }
    .header { text-align: center; margin-bottom: 32px; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; }
    .header .subtitle { color: #64748b; font-size: 14px; }
    .header .date { color: #94a3b8; font-size: 12px; margin-top: 8px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 11px; }
    th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; }
    th { background: #f1f5f9; font-weight: 600; color: #1e293b; }
    tr:nth-child(even) { background: #f8fafc; }
    .badge { 
      display: inline-block; 
      padding: 2px 8px; 
      border-radius: 4px; 
      font-size: 10px; 
      font-weight: 600;
      margin: 1px;
    }
    .badge-learner { background: #3b82f6; color: white; }
    .badge-admin { background: #ef4444; color: white; }
    .badge-anon { background: #e2e8f0; color: #475569; border: 1px solid #cbd5e1; }
    .badge-system { background: #6b7280; color: white; }
    .section { margin-bottom: 24px; page-break-inside: avoid; }
    .legend { display: flex; gap: 16px; margin-top: 16px; font-size: 11px; }
    .legend-item { display: flex; align-items: center; gap: 6px; }
    .check { color: #22c55e; font-weight: bold; }
    .cross { color: #ef4444; font-weight: bold; }
    .code-block { 
      background: #1e293b; 
      color: #e2e8f0; 
      padding: 16px; 
      border-radius: 8px; 
      font-family: 'Consolas', monospace; 
      font-size: 11px; 
      white-space: pre-wrap;
      margin: 12px 0;
    }
    @media print {
      body { padding: 20px; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Access Control & Security</h1>
    <p class="subtitle">CodeQuest System Design Document</p>
    <p class="date">Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>

  <div class="section">
    <h2>1. Introduction</h2>
    <p>Access control determines which functionalities of the system each user is granted permission to access. Different users have varying levels of access to different subsystems within the system. To ensure security and protect against unauthorized access, malicious data modifications, and accidental introduction of inconsistencies, the system implements access control policies and security measures.</p>
  </div>

  <div class="section">
    <h2>2. Subsystem Access Control Matrix</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 20%">Subsystem</th>
          <th style="width: 20%">Components</th>
          <th style="width: 35%">Operations</th>
          <th style="width: 25%">Users</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td rowspan="3"><strong>User Interface (UI) Subsystem</strong></td>
          <td>Dashboard UI</td>
          <td>View progress, achievements, statistics</td>
          <td><span class="badge badge-learner">Learner</span> <span class="badge badge-admin">Admin</span></td>
        </tr>
        <tr>
          <td>Web IDE</td>
          <td>Write code, run tests, submit solutions</td>
          <td><span class="badge badge-learner">Learner</span> <span class="badge badge-admin">Admin</span></td>
        </tr>
        <tr>
          <td>Admin Portal</td>
          <td>Manage quests, users, view analytics</td>
          <td><span class="badge badge-admin">Admin</span></td>
        </tr>
        <tr>
          <td rowspan="2"><strong>User Management Subsystem</strong></td>
          <td>Auth Service</td>
          <td>Login, logout, register, password reset</td>
          <td><span class="badge badge-anon">Anonymous</span> <span class="badge badge-learner">Learner</span> <span class="badge badge-admin">Admin</span></td>
        </tr>
        <tr>
          <td>Profile API</td>
          <td>View/update own profile, view all users (admin)</td>
          <td><span class="badge badge-learner">Learner</span> <span class="badge badge-admin">Admin</span></td>
        </tr>
        <tr>
          <td rowspan="2"><strong>Quest Management Subsystem</strong></td>
          <td>Quest Service</td>
          <td>View published quests, attempt quests</td>
          <td><span class="badge badge-anon">Anonymous</span> <span class="badge badge-learner">Learner</span> <span class="badge badge-admin">Admin</span></td>
        </tr>
        <tr>
          <td>Quest Content API</td>
          <td>Create, update, delete, publish quests</td>
          <td><span class="badge badge-admin">Admin</span></td>
        </tr>
        <tr>
          <td rowspan="2"><strong>Execution & Validation Subsystem</strong></td>
          <td>Sandbox Execution</td>
          <td>Execute submitted code in isolated environment</td>
          <td><span class="badge badge-learner">Learner</span> <span class="badge badge-admin">Admin</span></td>
        </tr>
        <tr>
          <td>Validation Engine</td>
          <td>Run test cases, validate output</td>
          <td><span class="badge badge-system">System</span></td>
        </tr>
        <tr>
          <td rowspan="2"><strong>AI & Analytics Service Subsystem</strong></td>
          <td>LLM External API</td>
          <td>Generate hints, explanations</td>
          <td><span class="badge badge-learner">Learner</span> <span class="badge badge-admin">Admin</span></td>
        </tr>
        <tr>
          <td>Progress Analytics</td>
          <td>View own progress / View all user analytics</td>
          <td><span class="badge badge-learner">Learner</span> (own) <span class="badge badge-admin">Admin</span> (all)</td>
        </tr>
        <tr>
          <td><strong>Database Management Subsystem</strong></td>
          <td>Database Access Layer</td>
          <td>CRUD operations (RLS enforced)</td>
          <td><span class="badge badge-system">System</span></td>
        </tr>
        <tr>
          <td><strong>Logging & Monitoring Subsystem</strong></td>
          <td>Logging Service</td>
          <td>Write logs, view audit trails</td>
          <td><span class="badge badge-system">System</span> <span class="badge badge-admin">Admin</span> (view)</td>
        </tr>
        <tr>
          <td><strong>Secure Sandbox Subsystem</strong></td>
          <td>Container Security</td>
          <td>Detect exploits, terminate suspicious containers</td>
          <td><span class="badge badge-system">System</span></td>
        </tr>
      </tbody>
    </table>
    <div class="legend">
      <div class="legend-item"><span class="badge badge-anon">Anonymous</span> Unauthenticated users</div>
      <div class="legend-item"><span class="badge badge-learner">Learner</span> Authenticated learners</div>
      <div class="legend-item"><span class="badge badge-admin">Admin</span> Platform administrators</div>
      <div class="legend-item"><span class="badge badge-system">System</span> Internal processes</div>
    </div>
  </div>

  <div class="section">
    <h2>3. Resource-Level Access Control Matrix</h2>
    <table>
      <thead>
        <tr>
          <th>Resource / Action</th>
          <th style="text-align: center">Anonymous</th>
          <th style="text-align: center">Learner</th>
          <th style="text-align: center">Admin</th>
        </tr>
      </thead>
      <tbody>
        <tr><td colspan="4" style="background: #e2e8f0; font-weight: 600;">Quest Management</td></tr>
        <tr><td>View published quests</td><td style="text-align: center" class="check">✓</td><td style="text-align: center" class="check">✓</td><td style="text-align: center" class="check">✓</td></tr>
        <tr><td>View unpublished quests</td><td style="text-align: center" class="cross">✗</td><td style="text-align: center" class="cross">✗</td><td style="text-align: center" class="check">✓</td></tr>
        <tr><td>Create/Edit quests</td><td style="text-align: center" class="cross">✗</td><td style="text-align: center" class="cross">✗</td><td style="text-align: center" class="check">✓</td></tr>
        <tr><td>Delete quests</td><td style="text-align: center" class="cross">✗</td><td style="text-align: center" class="cross">✗</td><td style="text-align: center" class="check">✓</td></tr>
        <tr><td>View solution_code</td><td style="text-align: center" class="cross">✗</td><td style="text-align: center" class="cross">✗</td><td style="text-align: center" class="check">✓</td></tr>
        <tr><td colspan="4" style="background: #e2e8f0; font-weight: 600;">Code Submissions</td></tr>
        <tr><td>Submit code</td><td style="text-align: center" class="cross">✗</td><td style="text-align: center" class="check">✓</td><td style="text-align: center" class="check">✓</td></tr>
        <tr><td>View own submissions</td><td style="text-align: center" class="cross">✗</td><td style="text-align: center" class="check">✓</td><td style="text-align: center" class="check">✓</td></tr>
        <tr><td>View all submissions</td><td style="text-align: center" class="cross">✗</td><td style="text-align: center" class="cross">✗</td><td style="text-align: center" class="check">✓</td></tr>
        <tr><td colspan="4" style="background: #e2e8f0; font-weight: 600;">User Management</td></tr>
        <tr><td>Register account</td><td style="text-align: center" class="check">✓</td><td style="text-align: center">-</td><td style="text-align: center">-</td></tr>
        <tr><td>View own profile</td><td style="text-align: center" class="cross">✗</td><td style="text-align: center" class="check">✓</td><td style="text-align: center" class="check">✓</td></tr>
        <tr><td>View all users</td><td style="text-align: center" class="cross">✗</td><td style="text-align: center" class="cross">✗</td><td style="text-align: center" class="check">✓</td></tr>
        <tr><td>Suspend/remove users</td><td style="text-align: center" class="cross">✗</td><td style="text-align: center" class="cross">✗</td><td style="text-align: center" class="check">✓</td></tr>
        <tr><td colspan="4" style="background: #e2e8f0; font-weight: 600;">Analytics & Progress</td></tr>
        <tr><td>View own progress</td><td style="text-align: center" class="cross">✗</td><td style="text-align: center" class="check">✓</td><td style="text-align: center" class="check">✓</td></tr>
        <tr><td>View platform analytics</td><td style="text-align: center" class="cross">✗</td><td style="text-align: center" class="cross">✗</td><td style="text-align: center" class="check">✓</td></tr>
        <tr><td colspan="4" style="background: #e2e8f0; font-weight: 600;">Test Cases</td></tr>
        <tr><td>View visible test cases</td><td style="text-align: center" class="cross">✗</td><td style="text-align: center" class="check">✓</td><td style="text-align: center" class="check">✓</td></tr>
        <tr><td>View hidden test cases</td><td style="text-align: center" class="cross">✗</td><td style="text-align: center" class="cross">✗</td><td style="text-align: center" class="check">✓</td></tr>
        <tr><td>Manage test cases</td><td style="text-align: center" class="cross">✗</td><td style="text-align: center" class="cross">✗</td><td style="text-align: center" class="check">✓</td></tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>4. Security Architecture</h2>
    <h3>Multi-Layered Security Model</h3>
    <table>
      <tr><th>Layer</th><th>Security Domain</th><th>Implementation</th></tr>
      <tr><td>Layer 1</td><td>Network Security</td><td>HTTPS/TLS encryption, WAF, DDoS protection</td></tr>
      <tr><td>Layer 2</td><td>Application Security</td><td>Input validation, CSRF protection, rate limiting</td></tr>
      <tr><td>Layer 3</td><td>Authentication</td><td>JWT tokens, secure password hashing, session management</td></tr>
      <tr><td>Layer 4</td><td>Authorization</td><td>Role-based access control (RBAC), resource-level permissions</td></tr>
      <tr><td>Layer 5</td><td>Data Security</td><td>AES-256 encryption at rest, secure credential storage</td></tr>
      <tr><td>Layer 6</td><td>Sandbox Security</td><td>Isolated code execution, resource limits, process isolation</td></tr>
    </table>
  </div>

  <div class="section">
    <h2>5. Sandbox Security Controls</h2>
    <table>
      <tr><th>Control Type</th><th>Allowed</th><th>Blocked</th></tr>
      <tr><td>Process Isolation</td><td class="check">✓ Containers/VMs</td><td class="cross">✗ Direct host access</td></tr>
      <tr><td>Execution Time</td><td class="check">✓ 5-second timeout</td><td class="cross">✗ Infinite loops</td></tr>
      <tr><td>Memory</td><td class="check">✓ Limited per execution</td><td class="cross">✗ Unlimited allocation</td></tr>
      <tr><td>Network</td><td class="check">✓ None (isolated)</td><td class="cross">✗ Outbound connections</td></tr>
      <tr><td>Filesystem</td><td class="check">✓ Read-only, temp purged</td><td class="cross">✗ Write outside sandbox</td></tr>
      <tr><td>System Calls</td><td class="check">✓ Whitelisted only</td><td class="cross">✗ fork, exec, socket</td></tr>
    </table>
  </div>

  <div class="section">
    <h2>6. Role Storage Schema</h2>
    <div class="code-block">-- Role enum type
CREATE TYPE public.app_role AS ENUM ('admin', 'learner');

-- Separate user_roles table (NOT on User table)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.User(user_id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'learner',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;</div>
    <p><strong>Security Note:</strong> Roles are stored in a separate table (not on the User table) to prevent privilege escalation attacks. Never trust client-side role checks.</p>
  </div>

</body>
</html>
    `;

    printWindow.document.write(pdfContent);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print dialog
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const handleExportText = () => {
    // Create a formatted text version for export
    const docContent = `
ACCESS CONTROL & SECURITY - CodeQuest System Design Document
=============================================================

1. INTRODUCTION
---------------
Access control determines which functionalities of the system each user is granted 
permission to access. Different users have varying levels of access to different 
subsystems within the system.

2. SUBSYSTEM ACCESS CONTROL MATRIX
----------------------------------
Subsystem                          | Component              | Operations                              | Users
-----------------------------------|------------------------|----------------------------------------|------------------
User Interface Subsystem           | Dashboard UI           | View progress, achievements            | Learner, Admin
                                   | Web IDE                | Write code, run tests                  | Learner, Admin
                                   | Admin Portal           | Manage quests, users                   | Admin
User Management Subsystem          | Auth Service           | Login, logout, register                | Anonymous, Learner, Admin
                                   | Profile API            | View/update profile                    | Learner, Admin
Quest Management Subsystem         | Quest Service          | View published quests                  | Anonymous, Learner, Admin
                                   | Quest Content API      | Create, update, delete quests          | Admin
Execution & Validation Subsystem   | Sandbox Execution      | Execute code                           | Learner, Admin
                                   | Validation Engine      | Run test cases                         | System
AI & Analytics Service Subsystem   | LLM External API       | Generate hints                         | Learner, Admin
                                   | Progress Analytics     | View analytics                         | Learner (own), Admin (all)
Database Management Subsystem      | Database Access        | CRUD operations                        | System
Logging & Monitoring Subsystem     | Logging Service        | Write logs, view trails                | System, Admin (view)
Secure Sandbox Subsystem           | Container Security     | Detect exploits                        | System

3. RESOURCE-LEVEL ACCESS CONTROL
--------------------------------
Resource              | Anonymous | Learner | Admin
--------------------------------------------------
View published quests |     ✓     |    ✓    |   ✓
Create/edit quests    |     ✗     |    ✗    |   ✓
Submit code           |     ✗     |    ✓    |   ✓
View own progress     |     ✗     |    ✓    |   ✓
View all users        |     ✗     |    ✗    |   ✓
Suspend users         |     ✗     |    ✗    |   ✓

4. SECURITY ARCHITECTURE
------------------------
Layer 1: Network Security - HTTPS/TLS, WAF, DDoS protection
Layer 2: Application Security - Input validation, CSRF, rate limiting
Layer 3: Authentication - JWT tokens, bcrypt hashing
Layer 4: Authorization - RBAC, resource-level permissions
Layer 5: Data Security - AES-256 encryption at rest
Layer 6: Sandbox Security - Process isolation, resource limits

5. SANDBOX SECURITY CONTROLS
-----------------------------
✓ Process isolation (containers/VMs)
✓ 5-second execution timeout
✓ Memory limits per execution
✓ No network access
✓ Read-only filesystem
✗ System calls blocked (fork, exec, socket)
✗ File system access outside sandbox blocked
✗ Dangerous module imports blocked

Generated: ${new Date().toISOString()}
    `;
    
    const blob = new Blob([docContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'codequest-access-control-security.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportWord = async () => {
    const tableBorder = {
      top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    };

    const createTableCell = (text: string, isHeader = false) => {
      return new DocxTableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text,
                bold: isHeader,
                size: 20,
              }),
            ],
          }),
        ],
        borders: tableBorder,
        shading: isHeader ? { fill: "F1F5F9" } : undefined,
      });
    };

    const subsystemData = [
      ["User Interface (UI) Subsystem", "Dashboard UI", "View progress, achievements, statistics", "Learner, Admin"],
      ["", "Web IDE", "Write code, run tests, submit solutions", "Learner, Admin"],
      ["", "Admin Portal", "Manage quests, users, view analytics", "Admin"],
      ["User Management Subsystem", "Auth Service", "Login, logout, register, password reset", "Anonymous, Learner, Admin"],
      ["", "Profile API", "View/update own profile, view all users (admin)", "Learner, Admin"],
      ["Quest Management Subsystem", "Quest Service", "View published quests, attempt quests", "Anonymous, Learner, Admin"],
      ["", "Quest Content API", "Create, update, delete, publish quests", "Admin"],
      ["Execution & Validation Subsystem", "Sandbox Execution", "Execute submitted code in isolated environment", "Learner, Admin"],
      ["", "Validation Engine", "Run test cases, validate output", "System"],
      ["AI & Analytics Service Subsystem", "LLM External API", "Generate hints, explanations", "Learner, Admin"],
      ["", "Progress Analytics", "View own progress / View all user analytics", "Learner (own), Admin (all)"],
      ["Database Management Subsystem", "Database Access Layer", "CRUD operations (RLS enforced)", "System"],
      ["Logging & Monitoring Subsystem", "Logging Service", "Write logs, view audit trails", "System, Admin (view)"],
      ["Secure Sandbox Subsystem", "Container Security", "Detect exploits, terminate suspicious containers", "System"],
    ];

    const resourceData = [
      ["View published quests", "✓", "✓", "✓"],
      ["View unpublished quests", "✗", "✗", "✓"],
      ["Create/Edit quests", "✗", "✗", "✓"],
      ["Delete quests", "✗", "✗", "✓"],
      ["Submit code", "✗", "✓", "✓"],
      ["View own submissions", "✗", "✓", "✓"],
      ["View all submissions", "✗", "✗", "✓"],
      ["Register account", "✓", "-", "-"],
      ["View own profile", "✗", "✓", "✓"],
      ["View all users", "✗", "✗", "✓"],
      ["Suspend/remove users", "✗", "✗", "✓"],
      ["View own progress", "✗", "✓", "✓"],
      ["View platform analytics", "✗", "✗", "✓"],
    ];

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Title
            new Paragraph({
              text: "System Design",
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              text: `Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),

            // 1. Introduction
            new Paragraph({
              text: "Introduction",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400 },
            }),
            new Paragraph({
              text: "The system design phase marks a critical juncture in the development of the CodeQuest system. In this section, we delve into the architectural framework, components, and interactions that shape the foundation of our innovative solution. The design goal for our system is to provide a Secure Code Execution Environment and Intelligent Feedback.",
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "• Traceability: ", bold: true }),
                new TextRun("The design realizes our goals for Quest Evaluation and Secure Infrastructure."),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "• Constraints: ", bold: true }),
                new TextRun("The architecture is dictated by the 5-second execution limit and the need for isolated Execution sandbox to prevent security breaches."),
              ],
              spacing: { after: 300 },
            }),

            // 2. Current Software Architecture
            new Paragraph({
              text: "Current Software Architecture",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400 },
            }),
            new Paragraph({
              text: "As CodeQuest is a greenfield project, there is no legacy architecture being replaced.",
              spacing: { after: 300 },
            }),

            // 3. Proposed Software Architecture
            new Paragraph({
              text: "Proposed Software Architecture",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400 },
            }),

            // Overview
            new Paragraph({
              text: "Overview",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200 },
            }),

            // Subsystem Decomposition
            new Paragraph({
              text: "Subsystem Decomposition",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300 },
            }),
            new Paragraph({
              text: "Subsystem decomposition is a process in a system design where the overall system is broken down into smaller, more manageable subsystems or modules. Each subsystem is designed to handle a specific set of functionalities, and together, they contribute to the overall functioning of the entire system. This system is broken down into the following main subsystems:",
              spacing: { after: 200 },
            }),
            new Paragraph({ text: "1. User Interface (UI) Subsystem" }),
            new Paragraph({ text: "2. User Management Subsystem" }),
            new Paragraph({ text: "3. Quest Management Subsystem" }),
            new Paragraph({ text: "4. Execution & Validation Subsystem" }),
            new Paragraph({ text: "5. AI & Analytics Service Subsystem" }),
            new Paragraph({ text: "6. Database Management Subsystem" }),
            new Paragraph({ text: "7. Logging & Monitoring Subsystem" }),
            new Paragraph({ text: "8. Secure Sandbox Subsystem", spacing: { after: 300 } }),

            // Subsystem descriptions
            new Paragraph({
              children: [
                new TextRun({ text: "User Interface (UI) Subsystem: ", bold: true }),
                new TextRun("Manages the Web IDE, the Progress Dashboard, and the Admin portal."),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "User Management Subsystem: ", bold: true }),
                new TextRun("Handles authentication and profile analytics."),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Quest Management Subsystem: ", bold: true }),
                new TextRun("Admin tool for managing challenges and test cases."),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Execution & Validation Subsystem: ", bold: true }),
                new TextRun("Interfaces with the Sandbox to run code and validates results."),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "AI & Analytics Service Subsystem: ", bold: true }),
                new TextRun("Connects to an external LLM for personalized hint generation & process analytics as well as progress."),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Database Management Subsystem: ", bold: true }),
                new TextRun("Stores persistent records of quests, users, and progress."),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Logging & Monitoring Subsystem: ", bold: true }),
                new TextRun("Handles logging unauthorized access attempts, and tracking system performance."),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Secure Sandbox Subsystem: ", bold: true }),
                new TextRun("Handles security for the containers, detects and terminates containers after viewing suspicious logs."),
              ],
              spacing: { after: 400 },
            }),

            // 4. Hardware/Software Mapping
            new Paragraph({
              text: "Hardware/Software Mapping",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400 },
            }),
            new Paragraph({
              text: "To prevent I/O contention on the Database Server node, the system is configured to use independent storage volumes for the relational database and the system logs.",
              spacing: { after: 200 },
            }),
            new DocxTable({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new DocxTableRow({
                  children: [
                    createTableCell("Client Device", true),
                    createTableCell("Application Server", true),
                    createTableCell("Database Server", true),
                  ],
                }),
                new DocxTableRow({
                  children: [
                    createTableCell("User Interface Subsystem"),
                    createTableCell("Quest Management"),
                    createTableCell("Database Management"),
                  ],
                }),
                new DocxTableRow({
                  children: [
                    createTableCell("HTTPS"),
                    createTableCell("Execution & Validation"),
                    createTableCell("Logging & Monitoring"),
                  ],
                }),
                new DocxTableRow({
                  children: [
                    createTableCell(""),
                    createTableCell("User Management"),
                    createTableCell("SQL / TCP"),
                  ],
                }),
                new DocxTableRow({
                  children: [
                    createTableCell(""),
                    createTableCell("Secure Sandbox"),
                    createTableCell("AI Cloud Service"),
                  ],
                }),
                new DocxTableRow({
                  children: [
                    createTableCell(""),
                    createTableCell("AI & Analytics"),
                    createTableCell(""),
                  ],
                }),
              ],
            }),

            // 5. Persistent Data Management
            new Paragraph({
              text: "Persistent Data Management",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400 },
            }),
            new Paragraph({
              text: "The database schema consists of the following entities:",
              spacing: { after: 200 },
            }),

            // User Table
            new Paragraph({
              text: "User Table",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200 },
            }),
            new DocxTable({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new DocxTableRow({
                  children: [
                    createTableCell("Column", true),
                    createTableCell("Type", true),
                    createTableCell("Description", true),
                  ],
                }),
                new DocxTableRow({ children: [createTableCell("user_id (PK)"), createTableCell("UUID"), createTableCell("Primary key")] }),
                new DocxTableRow({ children: [createTableCell("username"), createTableCell("string"), createTableCell("User's display name")] }),
                new DocxTableRow({ children: [createTableCell("email"), createTableCell("string"), createTableCell("User's email address")] }),
                new DocxTableRow({ children: [createTableCell("password_hash"), createTableCell("string"), createTableCell("Hashed password")] }),
                new DocxTableRow({ children: [createTableCell("role"), createTableCell("enum"), createTableCell("learner, admin")] }),
                new DocxTableRow({ children: [createTableCell("is_deleted"), createTableCell("boolean"), createTableCell("Soft delete flag")] }),
              ],
            }),

            // Quest Table
            new Paragraph({
              text: "Quest Table",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300 },
            }),
            new DocxTable({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new DocxTableRow({
                  children: [
                    createTableCell("Column", true),
                    createTableCell("Type", true),
                    createTableCell("Description", true),
                  ],
                }),
                new DocxTableRow({ children: [createTableCell("quest_id (PK)"), createTableCell("UUID"), createTableCell("Primary key")] }),
                new DocxTableRow({ children: [createTableCell("title"), createTableCell("string"), createTableCell("Quest title")] }),
                new DocxTableRow({ children: [createTableCell("description"), createTableCell("string"), createTableCell("Quest description")] }),
                new DocxTableRow({ children: [createTableCell("level"), createTableCell("int"), createTableCell("Difficulty level")] }),
                new DocxTableRow({ children: [createTableCell("initial_code"), createTableCell("text"), createTableCell("Starter code template")] }),
                new DocxTableRow({ children: [createTableCell("solution_code"), createTableCell("text"), createTableCell("Reference solution")] }),
                new DocxTableRow({ children: [createTableCell("explanation"), createTableCell("text"), createTableCell("Solution explanation")] }),
                new DocxTableRow({ children: [createTableCell("is_deleted"), createTableCell("boolean"), createTableCell("Soft delete flag")] }),
                new DocxTableRow({ children: [createTableCell("created_at"), createTableCell("timestamp"), createTableCell("Creation timestamp")] }),
              ],
            }),

            // TestCase Table
            new Paragraph({
              text: "TestCase Table",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300 },
            }),
            new DocxTable({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new DocxTableRow({
                  children: [
                    createTableCell("Column", true),
                    createTableCell("Type", true),
                    createTableCell("Description", true),
                  ],
                }),
                new DocxTableRow({ children: [createTableCell("test_case_id (PK)"), createTableCell("UUID"), createTableCell("Primary key")] }),
                new DocxTableRow({ children: [createTableCell("quest_id (FK)"), createTableCell("UUID"), createTableCell("Foreign key to Quest")] }),
                new DocxTableRow({ children: [createTableCell("input_data"), createTableCell("text"), createTableCell("Test input")] }),
                new DocxTableRow({ children: [createTableCell("expected_output"), createTableCell("text"), createTableCell("Expected result")] }),
                new DocxTableRow({ children: [createTableCell("is_hidden"), createTableCell("boolean"), createTableCell("Hidden from learners")] }),
                new DocxTableRow({ children: [createTableCell("is_deleted"), createTableCell("boolean"), createTableCell("Soft delete flag")] }),
              ],
            }),

            // Submission Table
            new Paragraph({
              text: "Submission Table",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300 },
            }),
            new DocxTable({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new DocxTableRow({
                  children: [
                    createTableCell("Column", true),
                    createTableCell("Type", true),
                    createTableCell("Description", true),
                  ],
                }),
                new DocxTableRow({ children: [createTableCell("submission_id (PK)"), createTableCell("UUID"), createTableCell("Primary key")] }),
                new DocxTableRow({ children: [createTableCell("user_id (FK)"), createTableCell("UUID"), createTableCell("Foreign key to User")] }),
                new DocxTableRow({ children: [createTableCell("quest_id (FK)"), createTableCell("UUID"), createTableCell("Foreign key to Quest")] }),
                new DocxTableRow({ children: [createTableCell("submitted_code"), createTableCell("text"), createTableCell("User's submitted code")] }),
                new DocxTableRow({ children: [createTableCell("result"), createTableCell("enum"), createTableCell("pass, fail")] }),
                new DocxTableRow({ children: [createTableCell("error_message"), createTableCell("text"), createTableCell("Error message if failed")] }),
                new DocxTableRow({ children: [createTableCell("execution_time"), createTableCell("float"), createTableCell("Execution time in seconds")] }),
                new DocxTableRow({ children: [createTableCell("submitted_at"), createTableCell("timestamp"), createTableCell("Submission timestamp")] }),
              ],
            }),

            // Progress Table
            new Paragraph({
              text: "Progress Table",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300 },
            }),
            new DocxTable({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new DocxTableRow({
                  children: [
                    createTableCell("Column", true),
                    createTableCell("Type", true),
                    createTableCell("Description", true),
                  ],
                }),
                new DocxTableRow({ children: [createTableCell("progress_id (PK)"), createTableCell("UUID"), createTableCell("Primary key")] }),
                new DocxTableRow({ children: [createTableCell("user_id (FK)"), createTableCell("UUID"), createTableCell("Foreign key to User")] }),
                new DocxTableRow({ children: [createTableCell("current_level"), createTableCell("int"), createTableCell("Current quest level")] }),
                new DocxTableRow({ children: [createTableCell("quests_completed"), createTableCell("int"), createTableCell("Number of completed quests")] }),
                new DocxTableRow({ children: [createTableCell("updated_at"), createTableCell("timestamp"), createTableCell("Last update timestamp")] }),
              ],
            }),

            // 6. Access Control and Security
            new Paragraph({
              text: "Access Control and Security",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400 },
            }),
            new Paragraph({
              text: "Access control determines which functionalities of the system each user is granted permission to access. Different users have varying levels of access to different subsystems within the system. To ensure security and protect against unauthorized access, malicious data modifications, and accidental introduction of inconsistencies, the system implements access control policies and security measures.",
              spacing: { after: 300 },
            }),

            // Subsystem Access Control Matrix
            new Paragraph({
              text: "Subsystem Access Control Matrix",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200 },
            }),
            new DocxTable({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new DocxTableRow({
                  children: [
                    createTableCell("Subsystem", true),
                    createTableCell("Components", true),
                    createTableCell("Operations", true),
                    createTableCell("Users", true),
                  ],
                }),
                ...subsystemData.map(row => new DocxTableRow({
                  children: row.map(cell => createTableCell(cell)),
                })),
              ],
            }),

            // Resource-Level Access Control
            new Paragraph({
              text: "Resource-Level Access Control Matrix",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300 },
            }),
            new DocxTable({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new DocxTableRow({
                  children: [
                    createTableCell("Resource / Action", true),
                    createTableCell("Anonymous", true),
                    createTableCell("Learner", true),
                    createTableCell("Admin", true),
                  ],
                }),
                ...resourceData.map(row => new DocxTableRow({
                  children: row.map(cell => createTableCell(cell)),
                })),
              ],
            }),

            // Security Architecture
            new Paragraph({
              text: "Security Architecture",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300 },
            }),
            new Paragraph({ text: "Multi-Layered Security Model:", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "• Layer 1: Network Security - HTTPS/TLS encryption, WAF, DDoS protection" }),
            new Paragraph({ text: "• Layer 2: Application Security - Input validation, CSRF protection, rate limiting" }),
            new Paragraph({ text: "• Layer 3: Authentication - JWT tokens, secure password hashing, session management" }),
            new Paragraph({ text: "• Layer 4: Authorization - Role-based access control (RBAC), resource-level permissions" }),
            new Paragraph({ text: "• Layer 5: Data Security - AES-256 encryption at rest, secure credential storage" }),
            new Paragraph({ text: "• Layer 6: Sandbox Security - Isolated code execution, resource limits, process isolation" }),

            // Sandbox Security
            new Paragraph({
              text: "Sandbox Security Controls",
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 200 },
            }),
            new Paragraph({ text: "Allowed Controls:" }),
            new Paragraph({ text: "✓ Process isolation (containers/VMs)" }),
            new Paragraph({ text: "✓ 5-second execution timeout" }),
            new Paragraph({ text: "✓ Memory limits per execution" }),
            new Paragraph({ text: "✓ No network access" }),
            new Paragraph({ text: "✓ Read-only filesystem" }),
            new Paragraph({ text: "Blocked Operations:", spacing: { before: 100 } }),
            new Paragraph({ text: "✗ System calls (fork, exec, socket)" }),
            new Paragraph({ text: "✗ File system access outside sandbox" }),
            new Paragraph({ text: "✗ Dangerous module imports" }),
            new Paragraph({ text: "✗ Outbound network connections" }),

            // Role Storage
            new Paragraph({
              text: "Role Storage Schema",
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 200 },
            }),
            new Paragraph({
              text: "Security Note: Roles are stored in a separate table (not on the User table) to prevent privilege escalation attacks. Never trust client-side role checks.",
              spacing: { after: 200 },
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "codequest-system-design.docx");
  };

  return (
    <div className="min-h-screen bg-background print:bg-white">
      <div className="print:hidden">
        <Header />
      </div>
      
      <main className="container mx-auto px-4 py-8 max-w-6xl print:max-w-none print:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <Badge variant="outline" className="text-primary border-primary print:border-gray-500 print:text-gray-700">
              System Design Document
            </Badge>
            <h1 className="text-4xl font-bold print:text-black">Access Control & Security</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto print:text-gray-600">
              Comprehensive security architecture for the CodeQuest learning platform, 
              covering authentication, authorization, data protection, and sandbox security.
            </p>
            
            {/* Print/Export buttons */}
            <div className="flex flex-wrap justify-center gap-3 print:hidden">
              <Button variant="outline" onClick={handlePrint} className="gap-2">
                <Printer className="w-4 h-4" />
                Print
              </Button>
              <Button variant="outline" onClick={handleExportPDF} className="gap-2">
                <Download className="w-4 h-4" />
                PDF
              </Button>
              <Button variant="outline" onClick={handleExportWord} className="gap-2">
                <FileText className="w-4 h-4" />
                Word (.docx)
              </Button>
              <Button variant="outline" onClick={handleExportText} className="gap-2">
                <FileCode className="w-4 h-4" />
                Text
              </Button>
            </div>
          </div>

          {/* Security Overview */}
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { icon: Shield, label: "Authentication", desc: "JWT-based auth", color: "text-blue-500" },
              { icon: Lock, label: "Authorization", desc: "RBAC policies", color: "text-green-500" },
              { icon: Database, label: "Data Security", desc: "Encryption at rest", color: "text-purple-500" },
              { icon: Server, label: "Sandbox", desc: "Isolated execution", color: "text-orange-500" },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-6 text-center">
                    <item.icon className={`w-10 h-10 mx-auto mb-3 ${item.color}`} />
                    <h3 className="font-semibold">{item.label}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-5 print:hidden">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="access">Access Control</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="matrix">Access Matrix</TabsTrigger>
              <TabsTrigger value="diagrams" className="gap-1">
                <GitBranch className="w-3 h-3" />
                Diagrams
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Security Architecture Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-muted-foreground">
                    CodeQuest implements a multi-layered security architecture designed to protect 
                    user data, ensure safe code execution, and prevent unauthorized access. The 
                    security model follows the principle of defense-in-depth with multiple security 
                    controls at each layer.
                  </p>

                  <div className="bg-muted/50 p-6 rounded-lg">
                    <h4 className="font-semibold mb-4">Security Layers</h4>
                    <div className="space-y-3">
                      {[
                        { layer: "Layer 1: Network Security", desc: "HTTPS/TLS encryption, WAF, DDoS protection" },
                        { layer: "Layer 2: Application Security", desc: "Input validation, CSRF protection, rate limiting" },
                        { layer: "Layer 3: Authentication", desc: "JWT tokens, secure password hashing, session management" },
                        { layer: "Layer 4: Authorization", desc: "Role-based access control (RBAC), resource-level permissions" },
                        { layer: "Layer 5: Data Security", desc: "Encryption at rest, secure credential storage" },
                        { layer: "Layer 6: Sandbox Security", desc: "Isolated code execution, resource limits, process isolation" },
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <Badge variant="outline" className="shrink-0 mt-0.5">{i + 1}</Badge>
                          <div>
                            <p className="font-medium">{item.layer}</p>
                            <p className="text-sm text-muted-foreground">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Security Requirements Mapping */}
                  <div>
                    <h4 className="font-semibold mb-4">Security Requirements (from NFR)</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Requirement</TableHead>
                          <TableHead>Implementation</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-mono">NFR-10.1</TableCell>
                          <TableCell>Protected against Remote Code Execution (RCE) attacks</TableCell>
                          <TableCell>Sandboxed execution environment with isolated containers</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-mono">NFR-10.2</TableCell>
                          <TableCell>HTTPS for all traffic and secure hashing for credentials</TableCell>
                          <TableCell>TLS 1.3, bcrypt password hashing with salt</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-mono">NFR-10.3</TableCell>
                          <TableCell>Rate-limiting on Code Submission API to prevent DoS</TableCell>
                          <TableCell>5 submissions/minute per user (NFR-01.4)</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-mono">NFR-07.2</TableCell>
                          <TableCell>Sandbox must be resilient against common exploits</TableCell>
                          <TableCell>Process isolation, resource limits, syscall filtering</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Access Control Tab */}
            <TabsContent value="access" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Role-Based Access Control (RBAC)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* User Roles */}
                  <div>
                    <h4 className="font-semibold mb-4">Actor Roles</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-500">Learner</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Primary user of the platform who completes quests, submits code, 
                          and tracks their learning progress.
                        </p>
                        <div className="text-sm">
                          <p className="font-medium mb-1">Permissions:</p>
                          <ul className="list-disc list-inside text-muted-foreground space-y-1">
                            <li>View and attempt published quests</li>
                            <li>Submit code for evaluation</li>
                            <li>View own progress and achievements</li>
                            <li>Access hints and knowledge scrolls</li>
                            <li>Update own profile</li>
                          </ul>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-red-500">Admin</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Platform administrator with full access to manage content, 
                          users, and system analytics.
                        </p>
                        <div className="text-sm">
                          <p className="font-medium mb-1">Permissions:</p>
                          <ul className="list-disc list-inside text-muted-foreground space-y-1">
                            <li>All Learner permissions</li>
                            <li>Create, update, delete quests</li>
                            <li>Manage test cases and solutions</li>
                            <li>View all user progress and analytics</li>
                            <li>Suspend/remove user accounts (US-014)</li>
                            <li>Access admin dashboard</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Database Schema for Roles */}
                  <div className="bg-muted/50 p-6 rounded-lg">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      Role Storage Schema (Separate Table)
                    </h4>
                    <pre className="bg-background p-4 rounded-lg text-sm overflow-x-auto">
{`-- Role enum type
CREATE TYPE public.app_role AS ENUM ('admin', 'learner');

-- Separate user_roles table (NOT on User table)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.User(user_id) 
        ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'learner',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
-- (prevents infinite recursion in RLS policies)
CREATE OR REPLACE FUNCTION public.has_role(
    _user_id UUID, 
    _role app_role
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;`}
                    </pre>
                    <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <p className="text-sm flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                        <span>
                          <strong>Security Note:</strong> Roles are stored in a separate table 
                          (not on the User table) to prevent privilege escalation attacks. 
                          Never trust client-side role checks.
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* RLS Policies */}
                  <div>
                    <h4 className="font-semibold mb-4">Row Level Security (RLS) Policies</h4>
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <h5 className="font-medium flex items-center gap-2 mb-2">
                          <FileCode className="w-4 h-4" />
                          Quest Table Policies
                        </h5>
                        <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`-- Learners can only view published quests
CREATE POLICY "Learners view published quests"
  ON public.Quest FOR SELECT
  TO authenticated
  USING (is_deleted = false AND is_published = true);

-- Admins can manage all quests
CREATE POLICY "Admins manage quests"
  ON public.Quest FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));`}
                        </pre>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h5 className="font-medium flex items-center gap-2 mb-2">
                          <FileCode className="w-4 h-4" />
                          Submission Table Policies
                        </h5>
                        <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`-- Users can only view their own submissions
CREATE POLICY "Users view own submissions"
  ON public.Submission FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own submissions
CREATE POLICY "Users create submissions"
  ON public.Submission FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins can view all submissions (for analytics)
CREATE POLICY "Admins view all submissions"
  ON public.Submission FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));`}
                        </pre>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h5 className="font-medium flex items-center gap-2 mb-2">
                          <FileCode className="w-4 h-4" />
                          Progress Table Policies
                        </h5>
                        <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`-- Users can view their own progress
CREATE POLICY "Users view own progress"
  ON public.Progress FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- System can update progress on quest completion
CREATE POLICY "System updates progress"
  ON public.Progress FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Authentication Flow */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-primary" />
                    Authentication Flow
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/50 p-6 rounded-lg">
                    <h4 className="font-semibold mb-4">Authentication Sequence</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3 p-3 bg-background rounded border">
                        <Badge variant="outline">1</Badge>
                        <span>User → Web UI: Enter credentials</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-background rounded border">
                        <Badge variant="outline">2</Badge>
                        <span>Web UI → Auth Service: POST /auth/login</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-background rounded border">
                        <Badge variant="outline">3</Badge>
                        <span>Auth Service → Database: Validate credentials</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-background rounded border">
                        <Badge variant="outline">4</Badge>
                        <span>Auth Service: Verify password (bcrypt) + Generate JWT</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-background rounded border">
                        <Badge variant="outline">5</Badge>
                        <span>Auth Service → Web UI: Return JWT + Refresh Token</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-background rounded border">
                        <Badge variant="outline">6</Badge>
                        <span>Web UI: Store tokens securely (httpOnly cookies)</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <h5 className="font-medium mb-2">JWT Token Structure</h5>
                      <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user_id",
    "email": "user@example.com",
    "role": "learner",
    "iat": 1704067200,
    "exp": 1704153600
  }
}`}
                      </pre>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h5 className="font-medium mb-2">Token Configuration</h5>
                      <ul className="text-sm space-y-2 text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Access token expiry: 24 hours
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Refresh token expiry: 7 days
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Algorithm: HS256 with secret key
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Secure httpOnly cookies
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              {/* Sandbox Security */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="w-5 h-5 text-primary" />
                    Sandbox Security (Code Execution)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-muted-foreground">
                    The Secure Sandbox Subsystem executes user-submitted code in an isolated 
                    environment to prevent malicious code from affecting the platform or other users.
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4 space-y-3">
                      <h5 className="font-medium flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-500" />
                        Security Controls
                      </h5>
                      <ul className="text-sm space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                          <span>Process isolation using containers/VMs</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                          <span>5-second execution timeout (NFR-06.2)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                          <span>Memory limit per execution</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                          <span>No network access from sandbox</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                          <span>Read-only filesystem (except temp)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                          <span>Temp files purged after execution (NFR-01.2)</span>
                        </li>
                      </ul>
                    </div>

                    <div className="border rounded-lg p-4 space-y-3">
                      <h5 className="font-medium flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        Blocked Operations
                      </h5>
                      <ul className="text-sm space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                          <span>System calls (fork, exec, socket)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                          <span>File system access outside sandbox</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                          <span>Import of dangerous modules (os, subprocess)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                          <span>Outbound network connections</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                          <span>Inter-process communication</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Execution Flow */}
                  <div className="bg-muted/50 p-6 rounded-lg">
                    <h5 className="font-medium mb-4">Secure Execution Flow</h5>
                    <div className="flex flex-wrap gap-2 items-center text-sm">
                      <Badge className="bg-primary">User Code</Badge>
                      <span>→</span>
                      <Badge variant="outline">Input Validation</Badge>
                      <span>→</span>
                      <Badge variant="outline">Rate Limit Check</Badge>
                      <span>→</span>
                      <Badge variant="outline">Spawn Sandbox</Badge>
                      <span>→</span>
                      <Badge variant="outline">Execute with Limits</Badge>
                      <span>→</span>
                      <Badge variant="secondary">Timeout Check</Badge>
                    </div>
                    <div className="mt-3 grid md:grid-cols-2 gap-3">
                      <div className="p-3 bg-destructive/10 rounded border border-destructive/20">
                        <p className="text-sm font-medium text-destructive">If Timeout:</p>
                        <p className="text-xs text-muted-foreground">Kill Process → Return Timeout Error → Cleanup</p>
                      </div>
                      <div className="p-3 bg-green-500/10 rounded border border-green-500/20">
                        <p className="text-sm font-medium text-green-600">If Success:</p>
                        <p className="text-xs text-muted-foreground">Capture Output → Compare Test Cases → Return Result → Cleanup</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Security */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    Data Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <h5 className="font-medium mb-3">Data at Rest</h5>
                      <ul className="text-sm space-y-2 text-muted-foreground">
                        <li>• AES-256 encryption for database</li>
                        <li>• Bcrypt hashing for passwords (cost factor 12)</li>
                        <li>• Encrypted backups</li>
                        <li>• Secure key management (HSM/KMS)</li>
                      </ul>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h5 className="font-medium mb-3">Data in Transit</h5>
                      <ul className="text-sm space-y-2 text-muted-foreground">
                        <li>• TLS 1.3 for all connections</li>
                        <li>• HTTPS enforced (HSTS)</li>
                        <li>• Certificate pinning for mobile</li>
                        <li>• Encrypted WebSocket connections</li>
                      </ul>
                    </div>
                  </div>

                  {/* Sensitive Data Handling */}
                  <div>
                    <h5 className="font-medium mb-3">Sensitive Data Classification</h5>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data Type</TableHead>
                          <TableHead>Classification</TableHead>
                          <TableHead>Protection</TableHead>
                          <TableHead>Visibility</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">password_hash</TableCell>
                          <TableCell><Badge variant="destructive">Critical</Badge></TableCell>
                          <TableCell>Bcrypt, never exposed</TableCell>
                          <TableCell className="flex items-center gap-1"><EyeOff className="w-4 h-4" /> Never</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">email</TableCell>
                          <TableCell><Badge className="bg-yellow-500">PII</Badge></TableCell>
                          <TableCell>Encrypted, RLS protected</TableCell>
                          <TableCell className="flex items-center gap-1"><Eye className="w-4 h-4" /> Owner + Admin</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">solution_code</TableCell>
                          <TableCell><Badge className="bg-yellow-500">Sensitive</Badge></TableCell>
                          <TableCell>Admin-only access</TableCell>
                          <TableCell className="flex items-center gap-1"><EyeOff className="w-4 h-4" /> Admin only</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">submitted_code</TableCell>
                          <TableCell><Badge variant="secondary">Private</Badge></TableCell>
                          <TableCell>RLS protected</TableCell>
                          <TableCell className="flex items-center gap-1"><Eye className="w-4 h-4" /> Owner + Admin</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">hidden test cases</TableCell>
                          <TableCell><Badge className="bg-yellow-500">Sensitive</Badge></TableCell>
                          <TableCell>is_hidden flag</TableCell>
                          <TableCell className="flex items-center gap-1"><EyeOff className="w-4 h-4" /> Admin only</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* API Security */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    API Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4">
                      <h5 className="font-medium mb-2">Rate Limiting</h5>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• 5 code submissions/minute</li>
                        <li>• 100 API requests/minute</li>
                        <li>• 10 login attempts/hour</li>
                      </ul>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h5 className="font-medium mb-2">Input Validation</h5>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Schema validation (Zod)</li>
                        <li>• SQL injection prevention</li>
                        <li>• XSS sanitization</li>
                      </ul>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h5 className="font-medium mb-2">Headers & CORS</h5>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Strict CORS policy</li>
                        <li>• CSRF token validation</li>
                        <li>• Security headers (CSP)</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Access Matrix Tab */}
            <TabsContent value="matrix" className="space-y-6">
              {/* Subsystem-level Access Control Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" />
                    Subsystem Access Control
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Access control determines which functionalities of the system each user is granted permission to access. 
                    Different users have varying levels of access to different subsystems within the system.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[180px]">Subsystem</TableHead>
                          <TableHead className="min-w-[180px]">Components</TableHead>
                          <TableHead className="min-w-[200px]">Operations</TableHead>
                          <TableHead className="min-w-[120px]">Users</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* User Interface Subsystem */}
                        <TableRow>
                          <TableCell className="font-medium align-top" rowSpan={3}>
                            User Interface (UI) Subsystem
                          </TableCell>
                          <TableCell>Dashboard UI</TableCell>
                          <TableCell>View progress, achievements, statistics</TableCell>
                          <TableCell><Badge className="bg-blue-500">Learner</Badge> <Badge className="bg-red-500">Admin</Badge></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Web IDE</TableCell>
                          <TableCell>Write code, run tests, submit solutions</TableCell>
                          <TableCell><Badge className="bg-blue-500">Learner</Badge> <Badge className="bg-red-500">Admin</Badge></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Admin Portal</TableCell>
                          <TableCell>Manage quests, users, view analytics</TableCell>
                          <TableCell><Badge className="bg-red-500">Admin</Badge></TableCell>
                        </TableRow>

                        {/* User Management Subsystem */}
                        <TableRow className="bg-muted/20">
                          <TableCell className="font-medium align-top" rowSpan={2}>
                            User Management Subsystem
                          </TableCell>
                          <TableCell>Auth Service</TableCell>
                          <TableCell>Login, logout, register, password reset</TableCell>
                          <TableCell><Badge variant="outline">Anonymous</Badge> <Badge className="bg-blue-500">Learner</Badge> <Badge className="bg-red-500">Admin</Badge></TableCell>
                        </TableRow>
                        <TableRow className="bg-muted/20">
                          <TableCell>Profile API</TableCell>
                          <TableCell>View/update own profile, view all users (admin)</TableCell>
                          <TableCell><Badge className="bg-blue-500">Learner</Badge> <Badge className="bg-red-500">Admin</Badge></TableCell>
                        </TableRow>

                        {/* Quest Management Subsystem */}
                        <TableRow>
                          <TableCell className="font-medium align-top" rowSpan={2}>
                            Quest Management Subsystem
                          </TableCell>
                          <TableCell>Quest Service</TableCell>
                          <TableCell>View published quests, attempt quests</TableCell>
                          <TableCell><Badge variant="outline">Anonymous</Badge> <Badge className="bg-blue-500">Learner</Badge> <Badge className="bg-red-500">Admin</Badge></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Quest Content API</TableCell>
                          <TableCell>Create, update, delete, publish quests</TableCell>
                          <TableCell><Badge className="bg-red-500">Admin</Badge></TableCell>
                        </TableRow>

                        {/* Execution & Validation Subsystem */}
                        <TableRow className="bg-muted/20">
                          <TableCell className="font-medium align-top" rowSpan={2}>
                            Execution & Validation Subsystem
                          </TableCell>
                          <TableCell>Sandbox Execution</TableCell>
                          <TableCell>Execute submitted code in isolated environment</TableCell>
                          <TableCell><Badge className="bg-blue-500">Learner</Badge> <Badge className="bg-red-500">Admin</Badge></TableCell>
                        </TableRow>
                        <TableRow className="bg-muted/20">
                          <TableCell>Validation Engine</TableCell>
                          <TableCell>Run test cases, validate output</TableCell>
                          <TableCell><Badge variant="secondary">System</Badge></TableCell>
                        </TableRow>

                        {/* AI & Analytics Service Subsystem */}
                        <TableRow>
                          <TableCell className="font-medium align-top" rowSpan={2}>
                            AI & Analytics Service Subsystem
                          </TableCell>
                          <TableCell>LLM External API</TableCell>
                          <TableCell>Generate hints, explanations</TableCell>
                          <TableCell><Badge className="bg-blue-500">Learner</Badge> <Badge className="bg-red-500">Admin</Badge></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Progress Analytics</TableCell>
                          <TableCell>View own progress / View all user analytics</TableCell>
                          <TableCell><Badge className="bg-blue-500">Learner</Badge> (own) <Badge className="bg-red-500">Admin</Badge> (all)</TableCell>
                        </TableRow>

                        {/* Database Management Subsystem */}
                        <TableRow className="bg-muted/20">
                          <TableCell className="font-medium align-top">
                            Database Management Subsystem
                          </TableCell>
                          <TableCell>Database Access Layer</TableCell>
                          <TableCell>CRUD operations (RLS enforced)</TableCell>
                          <TableCell><Badge variant="secondary">System</Badge></TableCell>
                        </TableRow>

                        {/* Logging & Monitoring Subsystem */}
                        <TableRow>
                          <TableCell className="font-medium align-top">
                            Logging & Monitoring Subsystem
                          </TableCell>
                          <TableCell>Logging Service</TableCell>
                          <TableCell>Write logs, view audit trails</TableCell>
                          <TableCell><Badge variant="secondary">System</Badge> <Badge className="bg-red-500">Admin</Badge> (view)</TableCell>
                        </TableRow>

                        {/* Secure Sandbox Subsystem */}
                        <TableRow className="bg-muted/20">
                          <TableCell className="font-medium align-top">
                            Secure Sandbox Subsystem
                          </TableCell>
                          <TableCell>Container Security</TableCell>
                          <TableCell>Detect exploits, terminate suspicious containers</TableCell>
                          <TableCell><Badge variant="secondary">System</Badge></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Anonymous</Badge>
                      <span>Unauthenticated users</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-500">Learner</Badge>
                      <span>Authenticated learners</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-500">Admin</Badge>
                      <span>Platform administrators</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">System</Badge>
                      <span>Internal system processes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Original Resource-Action Matrix */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" />
                    Resource-Level Access Control Matrix
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[200px]">Resource / Action</TableHead>
                          <TableHead className="text-center">Anonymous</TableHead>
                          <TableHead className="text-center">Learner</TableHead>
                          <TableHead className="text-center">Admin</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Quest Resources */}
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={4} className="font-semibold">Quest Management</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>View published quests</TableCell>
                          <TableCell className="text-center"><CheckCircle className="w-4 h-4 text-green-500 mx-auto" /></TableCell>
                          <TableCell className="text-center"><CheckCircle className="w-4 h-4 text-green-500 mx-auto" /></TableCell>
                          <TableCell className="text-center"><CheckCircle className="w-4 h-4 text-green-500 mx-auto" /></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>View unpublished quests</TableCell>
                          <TableCell className="text-center"><XCircle className="w-4 h-4 text-red-500 mx-auto" /></TableCell>
                          <TableCell className="text-center"><XCircle className="w-4 h-4 text-red-500 mx-auto" /></TableCell>
                          <TableCell className="text-center"><CheckCircle className="w-4 h-4 text-green-500 mx-auto" /></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Create/Edit quests</TableCell>
                          <TableCell className="text-center"><XCircle className="w-4 h-4 text-red-500 mx-auto" /></TableCell>
                          <TableCell className="text-center"><XCircle className="w-4 h-4 text-red-500 mx-auto" /></TableCell>
                          <TableCell className="text-center"><CheckCircle className="w-4 h-4 text-green-500 mx-auto" /></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Delete quests</TableCell>
                          <TableCell className="text-center"><XCircle className="w-4 h-4 text-red-500 mx-auto" /></TableCell>
                          <TableCell className="text-center"><XCircle className="w-4 h-4 text-red-500 mx-auto" /></TableCell>
                          <TableCell className="text-center"><CheckCircle className="w-4 h-4 text-green-500 mx-auto" /></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>View solution_code</TableCell>
                          <TableCell className="text-center"><XCircle className="w-4 h-4 text-red-500 mx-auto" /></TableCell>
                          <TableCell className="text-center"><XCircle className="w-4 h-4 text-red-500 mx-auto" /></TableCell>
                          <TableCell className="text-center"><CheckCircle className="w-4 h-4 text-green-500 mx-auto" /></TableCell>
                        </TableRow>

                        {/* Submission Resources */}
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={4} className="font-semibold">Code Submissions</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Submit code</TableCell>
                          <TableCell className="text-center"><XCircle className="w-4 h-4 text-red-500 mx-auto" /></TableCell>
                          <TableCell className="text-center"><CheckCircle className="w-4 h-4 text-green-500 mx-auto" /></TableCell>
                          <TableCell className="text-center"><CheckCircle className="w-4 h-4 text-green-500 mx-auto" /></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>View own submissions</TableCell>
                          <TableCell className="text-center"><XCircle className="w-4 h-4 text-red-500 mx-auto" /></TableCell>
                          <TableCell className="text-center"><CheckCircle className="w-4 h-4 text-green-500 mx-auto" /></TableCell>
                          <TableCell className="text-center"><CheckCircle className="w-4 h-4 text-green-500 mx-auto" /></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>View all submissions</TableCell>
                          <TableCell className="text-center"><XCircle className="w-4 h-4 text-red-500 mx-auto" /></TableCell>
                          <TableCell className="text-center"><XCircle className="w-4 h-4 text-red-500 mx-auto" /></TableCell>
                          <TableCell className="text-center"><CheckCircle className="w-4 h-4 text-green-500 mx-auto" /></TableCell>
                        </TableRow>

                        {/* User Resources */}
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={4} className="font-semibold">User Management</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Register account</TableCell>
                          <TableCell className="text-center"><CheckCircle className="w-4 h-4 text-green-500 mx-auto" /></TableCell>
                          <TableCell className="text-center">-</TableCell>
                          <TableCell className="text-center">-</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>View own profile</TableCell>
                          <TableCell className="text-center"><XCircle className="w-4 h-4 text-red-500 mx-auto" /></TableCell>
                          <TableCell className="text-center"><CheckCircle className="w-4 h-4 text-green-500 mx-auto" /></TableCell>
                          <TableCell className="text-center"><CheckCircle className="w-4 h-4 text-green-500 mx-auto" /></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>View all users</TableCell>
                          <TableCell className="text-center"><XCircle className="w-4 h-4 text-red-500 mx-auto" /></TableCell>
                          <TableCell className="text-center"><XCircle className="w-4 h-4 text-red-500 mx-auto" /></TableCell>
                          <TableCell className="text-center"><CheckCircle className="w-4 h-4 text-green-500 mx-auto" /></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Suspend/remove users</TableCell>
                          <TableCell className="text-center"><XCircle className="w-4 h-4 text-red-500 mx-auto" /></TableCell>
                          <TableCell className="text-center"><XCircle className="w-4 h-4 text-red-500 mx-auto" /></TableCell>
                          <TableCell className="text-center"><CheckCircle className="w-4 h-4 text-green-500 mx-auto" /></TableCell>
                        </TableRow>

                        {/* Analytics */}
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={4} className="font-semibold">Analytics & Progress</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>View own progress</TableCell>
                          <TableCell className="text-center"><XCircle className="w-4 h-4 text-red-500 mx-auto" /></TableCell>
                          <TableCell className="text-center"><CheckCircle className="w-4 h-4 text-green-500 mx-auto" /></TableCell>
                          <TableCell className="text-center"><CheckCircle className="w-4 h-4 text-green-500 mx-auto" /></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>View platform analytics</TableCell>
                          <TableCell className="text-center"><XCircle className="w-4 h-4 text-red-500 mx-auto" /></TableCell>
                          <TableCell className="text-center"><XCircle className="w-4 h-4 text-red-500 mx-auto" /></TableCell>
                          <TableCell className="text-center"><CheckCircle className="w-4 h-4 text-green-500 mx-auto" /></TableCell>
                        </TableRow>

                        {/* Test Cases */}
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={4} className="font-semibold">Test Cases</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>View visible test cases</TableCell>
                          <TableCell className="text-center"><XCircle className="w-4 h-4 text-red-500 mx-auto" /></TableCell>
                          <TableCell className="text-center"><CheckCircle className="w-4 h-4 text-green-500 mx-auto" /></TableCell>
                          <TableCell className="text-center"><CheckCircle className="w-4 h-4 text-green-500 mx-auto" /></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>View hidden test cases</TableCell>
                          <TableCell className="text-center"><XCircle className="w-4 h-4 text-red-500 mx-auto" /></TableCell>
                          <TableCell className="text-center"><XCircle className="w-4 h-4 text-red-500 mx-auto" /></TableCell>
                          <TableCell className="text-center"><CheckCircle className="w-4 h-4 text-green-500 mx-auto" /></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Manage test cases</TableCell>
                          <TableCell className="text-center"><XCircle className="w-4 h-4 text-red-500 mx-auto" /></TableCell>
                          <TableCell className="text-center"><XCircle className="w-4 h-4 text-red-500 mx-auto" /></TableCell>
                          <TableCell className="text-center"><CheckCircle className="w-4 h-4 text-green-500 mx-auto" /></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div className="mt-6 flex gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Allowed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span>Denied</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Audit Logging */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCode className="w-5 h-5 text-primary" />
                    Audit Logging
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    All security-relevant actions are logged for compliance and forensic analysis.
                  </p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h5 className="font-medium mb-3">Logged Events</h5>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• User login/logout attempts</li>
                        <li>• Failed authentication (with IP)</li>
                        <li>• Password changes</li>
                        <li>• Role assignments/changes</li>
                      </ul>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Quest CRUD operations</li>
                        <li>• User account modifications</li>
                        <li>• Rate limit violations</li>
                        <li>• Sandbox security events</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Diagrams Tab */}
            <TabsContent value="diagrams" className="space-y-6">
              {/* Export Draw.io Button */}
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const drawioXml = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="2024-01-01T00:00:00.000Z" agent="CodeQuest Export" version="22.0.0" type="device">
  <diagram id="class-diagram" name="Class Diagram">
    <mxGraphModel dx="1434" dy="780" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        
        <!-- User Entity -->
        <mxCell id="user-entity" value="&lt;b&gt;User&lt;/b&gt;&lt;br&gt;&amp;lt;&amp;lt;entity&amp;gt;&amp;gt;" style="swimlane;fontStyle=0;childLayout=stackLayout;horizontal=1;startSize=40;fillColor=#dae8fc;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;strokeColor=#6c8ebf;" vertex="1" parent="1">
          <mxGeometry x="40" y="200" width="180" height="180" as="geometry" />
        </mxCell>
        <mxCell id="user-attrs" value="+ id: string&#xa;+ username: string&#xa;+ email: string&#xa;+ hashedPassword: string&#xa;+ role: string&#xa;+ createdAt: DateTime" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;" vertex="1" parent="user-entity">
          <mxGeometry y="40" width="180" height="140" as="geometry" />
        </mxCell>
        
        <!-- Learner Entity -->
        <mxCell id="learner-entity" value="&lt;b&gt;Learner&lt;/b&gt;&lt;br&gt;&amp;lt;&amp;lt;entity&amp;gt;&amp;gt;" style="swimlane;fontStyle=0;childLayout=stackLayout;horizontal=1;startSize=40;fillColor=#dae8fc;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;strokeColor=#6c8ebf;" vertex="1" parent="1">
          <mxGeometry x="300" y="100" width="180" height="140" as="geometry" />
        </mxCell>
        <mxCell id="learner-attrs" value="+ id: string&#xa;+ userid: string&#xa;+ currentLevel: integer&#xa;+ totalPoints: integer" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;" vertex="1" parent="learner-entity">
          <mxGeometry y="40" width="180" height="100" as="geometry" />
        </mxCell>
        
        <!-- Quest Entity -->
        <mxCell id="quest-entity" value="&lt;b&gt;Quest&lt;/b&gt;&lt;br&gt;&amp;lt;&amp;lt;entity&amp;gt;&amp;gt;" style="swimlane;fontStyle=0;childLayout=stackLayout;horizontal=1;startSize=40;fillColor=#dae8fc;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;strokeColor=#6c8ebf;" vertex="1" parent="1">
          <mxGeometry x="40" y="450" width="180" height="220" as="geometry" />
        </mxCell>
        <mxCell id="quest-attrs" value="+ id: string&#xa;+ title: string&#xa;+ description: string&#xa;+ level: integer&#xa;+ initialCode: string&#xa;+ solutionCode: string&#xa;+ explanation: string&#xa;+ createdAt: DateTime&#xa;+ updatedAt: DateTime" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;" vertex="1" parent="quest-entity">
          <mxGeometry y="40" width="180" height="180" as="geometry" />
        </mxCell>
        
        <!-- TestCase Entity -->
        <mxCell id="testcase-entity" value="&lt;b&gt;TestCase&lt;/b&gt;&lt;br&gt;&amp;lt;&amp;lt;entity&amp;gt;&amp;gt;" style="swimlane;fontStyle=0;childLayout=stackLayout;horizontal=1;startSize=40;fillColor=#dae8fc;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;strokeColor=#6c8ebf;" vertex="1" parent="1">
          <mxGeometry x="280" y="450" width="180" height="160" as="geometry" />
        </mxCell>
        <mxCell id="testcase-attrs" value="+ id: string&#xa;+ questId: string&#xa;+ inputData: List&lt;Args&gt;&#xa;+ expectedOutput: Future&lt;type&gt;&#xa;+ isHidden: boolean" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;" vertex="1" parent="testcase-entity">
          <mxGeometry y="40" width="180" height="120" as="geometry" />
        </mxCell>
        
        <!-- AuthenticationService Controller -->
        <mxCell id="auth-service" value="&lt;b&gt;AuthenticationService&lt;/b&gt;&lt;br&gt;&amp;lt;&amp;lt;controller&amp;gt;&amp;gt;" style="swimlane;fontStyle=0;childLayout=stackLayout;horizontal=1;startSize=40;fillColor=#fff2cc;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;strokeColor=#d6b656;" vertex="1" parent="1">
          <mxGeometry x="600" y="40" width="280" height="80" as="geometry" />
        </mxCell>
        <mxCell id="auth-service-methods" value="+ createUser(username, email, password): string" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;" vertex="1" parent="auth-service">
          <mxGeometry y="40" width="280" height="40" as="geometry" />
        </mxCell>
        
        <!-- AuthorizationService Controller -->
        <mxCell id="authz-service" value="&lt;b&gt;AuthorizationService&lt;/b&gt;&lt;br&gt;&amp;lt;&amp;lt;controller&amp;gt;&amp;gt;" style="swimlane;fontStyle=0;childLayout=stackLayout;horizontal=1;startSize=40;fillColor=#fff2cc;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;strokeColor=#d6b656;" vertex="1" parent="1">
          <mxGeometry x="600" y="140" width="280" height="100" as="geometry" />
        </mxCell>
        <mxCell id="authz-service-methods" value="+ findUser(username): Learner/Admin&#xa;+ compareHashedPassword(): boolean" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;" vertex="1" parent="authz-service">
          <mxGeometry y="40" width="280" height="60" as="geometry" />
        </mxCell>
        
        <!-- UserInterface Boundary -->
        <mxCell id="user-interface" value="&lt;b&gt;UserInterface&lt;/b&gt;&lt;br&gt;&amp;lt;&amp;lt;boundary&amp;gt;&amp;gt;" style="swimlane;fontStyle=0;childLayout=stackLayout;horizontal=1;startSize=40;fillColor=#d5e8d4;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;strokeColor=#82b366;" vertex="1" parent="1">
          <mxGeometry x="520" y="260" width="180" height="100" as="geometry" />
        </mxCell>
        <mxCell id="user-interface-methods" value="+ requestSignin(): Promise&#xa;+ requestLogin(): Promise" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;" vertex="1" parent="user-interface">
          <mxGeometry y="40" width="180" height="60" as="geometry" />
        </mxCell>
        
        <!-- QuestUI Boundary -->
        <mxCell id="quest-ui" value="&lt;b&gt;QuestUI&lt;/b&gt;&lt;br&gt;&amp;lt;&amp;lt;boundary&amp;gt;&amp;gt;" style="swimlane;fontStyle=0;childLayout=stackLayout;horizontal=1;startSize=40;fillColor=#d5e8d4;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;strokeColor=#82b366;" vertex="1" parent="1">
          <mxGeometry x="520" y="380" width="260" height="140" as="geometry" />
        </mxCell>
        <mxCell id="quest-ui-methods" value="+ displayQuest(quest): Future&lt;void&gt;&#xa;+ submitCode(code): Promise&#xa;+ requestHint(code, questId): Future&lt;string&gt;&#xa;+ runCode(code): Future&lt;Result&gt;" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;" vertex="1" parent="quest-ui">
          <mxGeometry y="40" width="260" height="100" as="geometry" />
        </mxCell>
        
        <!-- AdminUI Boundary -->
        <mxCell id="admin-ui" value="&lt;b&gt;AdminUI&lt;/b&gt;&lt;br&gt;&amp;lt;&amp;lt;boundary&amp;gt;&amp;gt;" style="swimlane;fontStyle=0;childLayout=stackLayout;horizontal=1;startSize=40;fillColor=#d5e8d4;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;strokeColor=#82b366;" vertex="1" parent="1">
          <mxGeometry x="40" y="720" width="280" height="160" as="geometry" />
        </mxCell>
        <mxCell id="admin-ui-methods" value="+ requestCreateQuest(newquest): Promise&#xa;+ requestEditQuest(quest): Promise&#xa;+ requestDeleteQuest(questId): Promise&#xa;+ requestGetQuestById(questId): Future&lt;Quest&gt;&#xa;+ requestGetAllQuest(): Future&lt;List&lt;Quest&gt;&gt;" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;" vertex="1" parent="admin-ui">
          <mxGeometry y="40" width="280" height="120" as="geometry" />
        </mxCell>
        
        <!-- LearnerUI Boundary -->
        <mxCell id="learner-ui" value="&lt;b&gt;LearnerUI&lt;/b&gt;&lt;br&gt;&amp;lt;&amp;lt;boundary&amp;gt;&amp;gt;" style="swimlane;fontStyle=0;childLayout=stackLayout;horizontal=1;startSize=40;fillColor=#d5e8d4;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;strokeColor=#82b366;" vertex="1" parent="1">
          <mxGeometry x="40" y="100" width="180" height="80" as="geometry" />
        </mxCell>
        <mxCell id="learner-ui-methods" value="+ requestProgress()&#xa;+ requestAnalytics()" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;" vertex="1" parent="learner-ui">
          <mxGeometry y="40" width="180" height="40" as="geometry" />
        </mxCell>
        
        <!-- LearnerManager Controller -->
        <mxCell id="learner-manager" value="&lt;b&gt;LearnerManager&lt;/b&gt;&lt;br&gt;&amp;lt;&amp;lt;controller&amp;gt;&amp;gt;" style="swimlane;fontStyle=0;childLayout=stackLayout;horizontal=1;startSize=40;fillColor=#fff2cc;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;strokeColor=#d6b656;" vertex="1" parent="1">
          <mxGeometry x="40" y="10" width="200" height="80" as="geometry" />
        </mxCell>
        <mxCell id="learner-manager-methods" value="+ analyzeProgress(): Future&lt;Result&gt;&#xa;+ analyzeUserData(): Future&lt;Result&gt;" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;" vertex="1" parent="learner-manager">
          <mxGeometry y="40" width="200" height="40" as="geometry" />
        </mxCell>
        
        <!-- QuestManager Controller -->
        <mxCell id="quest-manager" value="&lt;b&gt;QuestManager&lt;/b&gt;&lt;br&gt;&amp;lt;&amp;lt;controller&amp;gt;&amp;gt;" style="swimlane;fontStyle=0;childLayout=stackLayout;horizontal=1;startSize=40;fillColor=#fff2cc;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;strokeColor=#d6b656;" vertex="1" parent="1">
          <mxGeometry x="380" y="720" width="260" height="160" as="geometry" />
        </mxCell>
        <mxCell id="quest-manager-methods" value="+ createQuest(newquest): Promise&#xa;+ editQuest(quest): Promise&#xa;+ deleteQuest(questId): Promise&#xa;+ getQuestById(questId): Future&lt;Quest&gt;&#xa;+ getAllQuest(): Future&lt;List&lt;Quest&gt;&gt;" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;" vertex="1" parent="quest-manager">
          <mxGeometry y="40" width="260" height="120" as="geometry" />
        </mxCell>
        
        <!-- SubmissionManager Controller -->
        <mxCell id="submission-manager" value="&lt;b&gt;SubmissionManager&lt;/b&gt;&lt;br&gt;&amp;lt;&amp;lt;controller&amp;gt;&amp;gt;" style="swimlane;fontStyle=0;childLayout=stackLayout;horizontal=1;startSize=40;fillColor=#fff2cc;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;strokeColor=#d6b656;" vertex="1" parent="1">
          <mxGeometry x="520" y="540" width="280" height="80" as="geometry" />
        </mxCell>
        <mxCell id="submission-manager-methods" value="+ comparesTestCase(code, questId): Future&lt;Result&gt;" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;" vertex="1" parent="submission-manager">
          <mxGeometry y="40" width="280" height="40" as="geometry" />
        </mxCell>
        
        <!-- QuestController Controller -->
        <mxCell id="quest-controller" value="&lt;b&gt;QuestController&lt;/b&gt;&lt;br&gt;&amp;lt;&amp;lt;controller&amp;gt;&amp;gt;" style="swimlane;fontStyle=0;childLayout=stackLayout;horizontal=1;startSize=40;fillColor=#fff2cc;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;strokeColor=#d6b656;" vertex="1" parent="1">
          <mxGeometry x="850" y="540" width="260" height="120" as="geometry" />
        </mxCell>
        <mxCell id="quest-controller-methods" value="+ requestCodeCheck(code): Future&lt;Result&gt;&#xa;+ requestCodeRun(code): Future&lt;Result&gt;&#xa;+ requestHint(code): Future&lt;string&gt;" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;" vertex="1" parent="quest-controller">
          <mxGeometry y="40" width="260" height="80" as="geometry" />
        </mxCell>
        
        <!-- PythonRunner Boundary -->
        <mxCell id="python-runner" value="&lt;b&gt;PythonRunner&lt;/b&gt;&lt;br&gt;&amp;lt;&amp;lt;boundary&amp;gt;&amp;gt;" style="swimlane;fontStyle=0;childLayout=stackLayout;horizontal=1;startSize=40;fillColor=#d5e8d4;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;strokeColor=#82b366;" vertex="1" parent="1">
          <mxGeometry x="850" y="380" width="260" height="80" as="geometry" />
        </mxCell>
        <mxCell id="python-runner-methods" value="+ runPythonAsync(code): Future&lt;Result&gt;" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;" vertex="1" parent="python-runner">
          <mxGeometry y="40" width="260" height="40" as="geometry" />
        </mxCell>
        
        <!-- LLMHintManager Controller -->
        <mxCell id="llm-hint-manager" value="&lt;b&gt;LLMHintManager&lt;/b&gt;&lt;br&gt;&amp;lt;&amp;lt;controller&amp;gt;&amp;gt;" style="swimlane;fontStyle=0;childLayout=stackLayout;horizontal=1;startSize=40;fillColor=#fff2cc;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;strokeColor=#d6b656;" vertex="1" parent="1">
          <mxGeometry x="520" y="640" width="320" height="80" as="geometry" />
        </mxCell>
        <mxCell id="llm-hint-manager-methods" value="+ generateHint(learnerId, questId, code): string" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;" vertex="1" parent="llm-hint-manager">
          <mxGeometry y="40" width="320" height="40" as="geometry" />
        </mxCell>
        
        <!-- Relationships -->
        <mxCell id="rel1" value="&amp;lt;&amp;lt;calls&amp;gt;&amp;gt;" style="endArrow=open;endSize=12;dashed=1;html=1;exitX=0.5;exitY=1;entryX=0.5;entryY=0;" edge="1" parent="1" source="learner-manager" target="learner-ui">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        
        <mxCell id="rel2" value="Label" style="endArrow=open;endSize=12;html=1;exitX=1;exitY=0.5;entryX=0;entryY=0.5;" edge="1" parent="1">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="220" y="300" as="sourcePoint" />
            <mxPoint x="300" y="170" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        
        <mxCell id="rel3" value="&amp;lt;&amp;lt;calls&amp;gt;&amp;gt;" style="endArrow=open;endSize=12;dashed=1;html=1;" edge="1" parent="1" source="admin-ui" target="quest-manager">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        
        <mxCell id="rel4" value="&amp;lt;&amp;lt;uses&amp;gt;&amp;gt;" style="endArrow=open;endSize=12;dashed=1;html=1;" edge="1" parent="1" source="quest-ui" target="submission-manager">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        
        <mxCell id="rel5" value="&amp;lt;&amp;lt;calls&amp;gt;&amp;gt;" style="endArrow=open;endSize=12;dashed=1;html=1;" edge="1" parent="1" source="submission-manager" target="quest-controller">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        
        <mxCell id="rel6" value="&amp;lt;&amp;lt;executes&amp;gt;&amp;gt;" style="endArrow=open;endSize=12;dashed=1;html=1;" edge="1" parent="1" source="quest-controller" target="python-runner">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        
        <mxCell id="rel7" value="&amp;lt;&amp;lt;uses&amp;gt;&amp;gt;" style="endArrow=open;endSize=12;dashed=1;html=1;" edge="1" parent="1" source="quest-controller" target="llm-hint-manager">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        
        <mxCell id="rel8" value="&amp;lt;&amp;lt;call&amp;gt;&amp;gt;" style="endArrow=open;endSize=12;dashed=1;html=1;" edge="1" parent="1" source="user-interface" target="auth-service">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        
        <mxCell id="rel9" value="&amp;lt;&amp;lt;call&amp;gt;&amp;gt;" style="endArrow=open;endSize=12;dashed=1;html=1;" edge="1" parent="1" source="user-interface" target="authz-service">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        
        <mxCell id="rel10" value="1" style="endArrow=none;html=1;endFill=0;startArrow=none;startFill=0;" edge="1" parent="1">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="130" y="380" as="sourcePoint" />
            <mxPoint x="130" y="450" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        
        <mxCell id="rel11" value="*" style="endArrow=none;html=1;endFill=0;startArrow=none;startFill=0;" edge="1" parent="1">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="220" y="530" as="sourcePoint" />
            <mxPoint x="280" y="530" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
                    const blob = new Blob([drawioXml], { type: 'application/xml' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'codequest-class-diagram.drawio';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Draw.io XML
                </Button>
              </div>

              {/* Class Diagram */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" />
                    Class Diagram (System Architecture)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/30 p-6 rounded-lg border overflow-x-auto">
                    <pre className="text-xs font-mono text-muted-foreground whitespace-pre leading-relaxed">
{`┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                    CODEQUEST CLASS DIAGRAM                                                               │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                                                          │
│   ┌──────────────────────────┐                                                     ┌───────────────────────────────────┐                │
│   │   LearnerManager         │                                                     │   AuthenticationService            │                │
│   │   <<controller>>         │                                                     │   <<controller>>                   │                │
│   ├──────────────────────────┤                                                     ├───────────────────────────────────┤                │
│   │ + analyzeProgress()      │                                                     │ + createUser(username, email,     │                │
│   │ + analyzeUserData()      │                                                     │   password): string               │                │
│   └────────────┬─────────────┘                                                     └─────────────────┬─────────────────┘                │
│                │ <<calls>>                                                                           │ <<call>>                         │
│                ▼                                                                                     ▼                                  │
│   ┌──────────────────────────┐          Label          ┌──────────────────────────┐   ┌───────────────────────────────────┐             │
│   │   LearnerUI              │    ┌─────────────────►  │   Learner                │   │   UserInterface                   │             │
│   │   <<boundary>>           │    │       1            │   <<entity>>             │   │   <<boundary>>                    │             │
│   ├──────────────────────────┤    │                    ├──────────────────────────┤   ├───────────────────────────────────┤             │
│   │ + requestProgress()      │    │                    │ + id: string             │   │ + requestSignin(): Promise        │             │
│   │ + requestAnalytics()     │    │                    │ + userid: string         │   │ + requestLogin(): Promise         │             │
│   └──────────────────────────┘    │                    │ + currentLevel: integer  │   └─────────────────┬─────────────────┘             │
│                                   │                    │ + totalPoints: integer   │                     │ <<call>>                      │
│                                   │                    └──────────────────────────┘                     ▼                               │
│   ┌──────────────────────────┐    │                           │ <<updates>>           ┌───────────────────────────────────┐             │
│   │   User                   │────┘                           ▼                       │   AuthorizationService            │             │
│   │   <<entity>>             │                    ┌───────────────────────────┐       │   <<controller>>                  │             │
│   ├──────────────────────────┤                    │   LLMHintManager          │       ├───────────────────────────────────┤             │
│   │ + id: string             │                    │   <<controller>>          │       │ + findUser(username): Learner/    │             │
│   │ + username: string       │                    ├───────────────────────────┤       │   Admin                           │             │
│   │ + email: string          │ <<uses>>           │ + generateHint(learnerId, │       │ + compareHashedPassword():        │             │
│   │ + hashedPassword: string │ ─────────────────► │   questId, code): string  │       │   boolean                         │             │
│   │ + role: string           │                    └───────────────────────────┘       └───────────────────────────────────┘             │
│   │ + createdAt: DateTime    │                                                                                                          │
│   └────────────┬─────────────┘                    ┌───────────────────────────┐       ┌───────────────────────────────────┐             │
│                │ <<uses>>                         │   QuestUI                 │       │   PythonRunner                    │             │
│                ▼                                  │   <<boundary>>            │       │   <<boundary>>                    │             │
│   ┌──────────────────────────┐                    ├───────────────────────────┤       ├───────────────────────────────────┤             │
│   │   Quest                  │◄───────────────────│ + displayQuest(quest)     │       │ + runPythonAsync(code):           │             │
│   │   <<entity>>             │    1       *       │ + submitCode(code)        │       │   Future<Result>                  │             │
│   ├──────────────────────────┤                    │ + requestHint(code,       │       └─────────────────┬─────────────────┘             │
│   │ + id: string             │                    │   questId): Future<string>│                         │ <<executes>>                  │
│   │ + title: string          │                    │ + runCode(code)           │                         ▼                               │
│   │ + description: string    │                    └───────────┬───────────────┘       ┌───────────────────────────────────┐             │
│   │ + level: integer         │                                │ <<uses>>              │   QuestController                 │             │
│   │ + initialCode: string    │ <<uses>>                       ▼                       │   <<controller>>                  │             │
│   │ + solutionCode: string   │ ◄──────────────────────────────────────────────────────┤───────────────────────────────────┤             │
│   │ + explanation: string    │                    ┌───────────────────────────┐       │ + requestCodeCheck(code):         │             │
│   │ + createdAt: DateTime    │                    │   SubmissionManager       │       │   Future<Result>                  │             │
│   │ + updatedAt: DateTime    │                    │   <<controller>>          │ ──────│ + requestCodeRun(code):           │             │
│   └────────────┬─────────────┘                    ├───────────────────────────┤<<call>│   Future<Result>                  │             │
│                │ 1                                │ + comparesTestCase(code,  │       │ + requestHint(code):              │             │
│                │                                  │   questId): Future<Result>│       │   Future<string>                  │             │
│                ▼ *                                └───────────────────────────┘       └───────────────────────────────────┘             │
│   ┌──────────────────────────┐                                                                                                          │
│   │   TestCase               │                                                                                                          │
│   │   <<entity>>             │                                                                                                          │
│   ├──────────────────────────┤                                                                                                          │
│   │ + id: string             │                                                                                                          │
│   │ + questId: string        │                                                                                                          │
│   │ + inputData: List<Args>  │                                                                                                          │
│   │ + expectedOutput:        │                                                                                                          │
│   │   Future<type>           │                                                                                                          │
│   │ + isHidden: boolean      │                                                                                                          │
│   └──────────────────────────┘                                                                                                          │
│                                                                                                                                          │
│   ┌──────────────────────────────────┐        <<calls>>       ┌───────────────────────────────────┐                                     │
│   │   AdminUI                        │ ──────────────────────►│   QuestManager                    │                                     │
│   │   <<boundary>>                   │                        │   <<controller>>                  │                                     │
│   ├──────────────────────────────────┤                        ├───────────────────────────────────┤                                     │
│   │ + requestCreateQuest(newquest)   │                        │ + createQuest(newquest): Promise  │                                     │
│   │ + requestEditQuest(quest)        │                        │ + editQuest(quest): Promise       │                                     │
│   │ + requestDeleteQuest(questId)    │                        │ + deleteQuest(questId): Promise   │                                     │
│   │ + requestGetQuestById(questId)   │                        │ + getQuestById(questId):          │                                     │
│   │ + requestGetAllQuest()           │                        │   Future<Quest>                   │                                     │
│   └──────────────────────────────────┘                        │ + getAllQuest(): Future<List>     │                                     │
│                                                               └───────────────────────────────────┘                                     │
│                                                                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐    │
│  │  LEGEND:  [Entity]──blue   [Controller]──yellow   [Boundary]──green   ──────► Association   - - - -► Dependency                │    │
│  └─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘`}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* Database ERD Diagram */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    Database Entity-Relationship Diagram (ERD)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/30 p-6 rounded-lg border overflow-x-auto">
                    <pre className="text-xs font-mono text-muted-foreground whitespace-pre leading-relaxed">
{`┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                   DATABASE ERD - PERSISTENT DATA MANAGEMENT                                              │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                                                          │
│                                                   ┌─────────────────────────────┐                                                        │
│                                                   │           User              │                                                        │
│                                                   │        <<entity>>           │                                                        │
│                                                   ├─────────────────────────────┤                                                        │
│                                                   │ PK user_id: UUID            │                                                        │
│                                                   │    username: string         │                                                        │
│                                                   │    email: string            │                                                        │
│                                                   │    password_hash: string    │                                                        │
│                                                   │    role: string             │                                                        │
│                                                   │    is_deleted: boolean      │                                                        │
│                                                   │    created_at: timestamp    │                                                        │
│                                                   │    updated_at: timestamp    │                                                        │
│                                                   │    deleted_at: timestamp    │                                                        │
│                                                   │    created_by: UUID         │                                                        │
│                                                   │    updated_by: UUID         │                                                        │
│                                                   │    deleted_by: UUID         │                                                        │
│                                                   └─────────────┬───────────────┘                                                        │
│                                                                 │                                                                        │
│                               ┌─────────────────────────────────┼─────────────────────────────────┐                                      │
│                               │ 1                               │ 1                               │ 1                                    │
│                               ▼                                 ▼                                 ▼                                      │
│               ┌─────────────────────────────┐   ┌─────────────────────────────┐   ┌─────────────────────────────┐                        │
│               │         Learner             │   │          Progress           │   │        Submission           │                        │
│               │        <<entity>>           │   │         <<entity>>          │   │        <<entity>>           │                        │
│               ├─────────────────────────────┤   ├─────────────────────────────┤   ├─────────────────────────────┤                        │
│               │ PK learner_id: UUID         │   │ PK progress_id: UUID        │   │ PK submission_id: UUID      │                        │
│               │ FK user_id: UUID            │   │ FK user_id: UUID            │   │ FK user_id: UUID            │                        │
│               │    current_level: string    │   │ FK quest_id: UUID           │   │ FK quest_id: UUID           │                        │
│               │    total_points: integer    │   │    status: enum             │   │    submitted_code: text     │                        │
│               │    is_deleted: boolean      │   │    last_attempt_at: ts      │   │    result: enum (pass/fail) │                        │
│               │    created_at: timestamp    │   │    is_deleted: boolean      │   │    execution_time: float    │                        │
│               │    updated_at: timestamp    │   │    created_at: timestamp    │   │    error_message: string?   │                        │
│               │    deleted_at: timestamp    │   │    deleted_at: timestamp    │   │    submitted_at: timestamp  │                        │
│               │    created_by: UUID         │   │    updated_at: timestamp    │   │    is_deleted: boolean      │                        │
│               │    updated_by: UUID         │   │    created_by: UUID         │   │    created_at: timestamp    │                        │
│               │    deleted_by: UUID         │   │    deleted_by: UUID         │   │    deleted_at: timestamp    │                        │
│               └─────────────────────────────┘   │    updated_by: UUID         │   │    created_by: UUID         │                        │
│                                                 └──────────────┬──────────────┘   │    updated_by: UUID         │                        │
│                                                                │                   │    deleted_by: UUID         │                        │
│                                                                │ *                 └──────────────┬──────────────┘                        │
│                                                                │                                  │ *                                     │
│                                                                └──────────────────┬───────────────┘                                      │
│                                                                                   │ 1                                                     │
│                                                                                   ▼                                                       │
│                                                       ┌─────────────────────────────┐                                                    │
│                                                       │           Quest             │                                                    │
│                                                       │         <<entity>>          │                                                    │
│                                                       ├─────────────────────────────┤                                                    │
│                                                       │ PK quest_id: UUID           │                                                    │
│                                                       │    title: string            │                                                    │
│                                                       │    description: string      │                                                    │
│                                                       │    level: integer           │                                                    │
│                                                       │    initial_code: text       │                                                    │
│                                                       │    solution_code: text      │                                                    │
│                                                       │    explanation: text        │                                                    │
│                                                       │    is_deleted: boolean      │                                                    │
│                                                       │    created_at: timestamp    │                                                    │
│                                                       │    updated_at: timestamp    │                                                    │
│                                                       │    deleted_at: timestamp    │                                                    │
│                                                       │    created_by: UUID         │                                                    │
│                                                       │    updated_by: UUID         │                                                    │
│                                                       │    deleted_by: UUID         │                                                    │
│                                                       └─────────────┬───────────────┘                                                    │
│                                                                     │ 1                                                                  │
│                                                                     ▼ *                                                                  │
│                                                       ┌─────────────────────────────┐                                                    │
│                                                       │         TestCase            │                                                    │
│                                                       │        <<entity>>           │                                                    │
│                                                       ├─────────────────────────────┤                                                    │
│                                                       │ PK test_case_id: UUID       │                                                    │
│                                                       │ FK quest_id: UUID           │                                                    │
│                                                       │    input_data: jsonb        │                                                    │
│                                                       │    expected_output: text    │                                                    │
│                                                       │    is_hidden: boolean       │                                                    │
│                                                       │    is_deleted: boolean      │                                                    │
│                                                       │    created_at: timestamp    │                                                    │
│                                                       │    updated_at: timestamp    │                                                    │
│                                                       │    deleted_at: timestamp    │                                                    │
│                                                       │    created_by: UUID         │                                                    │
│                                                       │    updated_by: UUID         │                                                    │
│                                                       │    deleted_by: UUID         │                                                    │
│                                                       └─────────────────────────────┘                                                    │
│                                                                                                                                          │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  RELATIONSHIPS:  User ─1───*─ Learner    User ─1───*─ Progress    User ─1───*─ Submission    Quest ─1───*─ TestCase             │  │
│  │                  Quest ─1───*─ Progress  Quest ─1───*─ Submission                                                                 │  │
│  └────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘`}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* Hardware/Software Mapping Diagram */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    Hardware/Software Mapping (Deployment)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/30 p-6 rounded-lg border overflow-x-auto">
                    <pre className="text-xs font-mono text-muted-foreground whitespace-pre leading-relaxed">
{`┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                               HARDWARE/SOFTWARE MAPPING - DEPLOYMENT ARCHITECTURE                                         │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                                                           │
│    ┌────────────────────┐                                                                                                                 │
│    │   CLIENT DEVICE    │                                                                                                                 │
│    │    (Browser)       │                                                                                                                 │
│    ├────────────────────┤                                                                                                                 │
│    │ • Web Browser      │                                                                                                                 │
│    │ • React Frontend   │                                                                                                                 │
│    │ • User Interface   │                                                                                                                 │
│    └─────────┬──────────┘                                                                                                                 │
│              │ HTTPS                                                                                                                      │
│              ▼                                                                                                                            │
│    ┌──────────────────────────────────────────────────────────────────────────────────────────────┐                                       │
│    │                                    APPLICATION SERVER                                         │                                       │
│    ├──────────────────────────────────────────────────────────────────────────────────────────────┤                                       │
│    │                                                                                               │                                       │
│    │  ┌──────────────────────────┐   ┌──────────────────────────┐   ┌──────────────────────────┐  │                                       │
│    │  │   User Interface         │   │   Execution & Validation │   │   Quest Management       │  │                                       │
│    │  │     Subsystem            │   │       Subsystem          │   │      Subsystem           │  │                                       │
│    │  ├──────────────────────────┤   ├──────────────────────────┤   ├──────────────────────────┤  │                                       │
│    │  │ • Dashboard UI           │   │ • Code Execution API     │   │ • Quest Service          │  │                                       │
│    │  │ • Web IDE                │   │ • Result Validation      │   │ • Quest Content API      │  │                                       │
│    │  └──────────────────────────┘   └──────────────────────────┘   └──────────────────────────┘  │                                       │
│    │                                                                                               │                                       │
│    │  ┌──────────────────────────┐   ┌──────────────────────────┐   ┌──────────────────────────┐  │                                       │
│    │  │   User Management        │   │   Database Management    │   │   Logging & Monitoring   │  │                                       │
│    │  │     Subsystem            │   │       Subsystem          │   │      Subsystem           │  │                                       │
│    │  ├──────────────────────────┤   ├──────────────────────────┤   ├──────────────────────────┤  │                                       │
│    │  │ • Auth Service           │   │ • Database Access Layer  │   │ • Logging Service        │  │                                       │
│    │  │ • Profile API            │   │ • Connection Pooling     │   │ • Performance Metrics    │  │                                       │
│    │  └──────────────────────────┘   └──────────────────────────┘   └──────────────────────────┘  │                                       │
│    │                                                                                               │                                       │
│    └───────┬─────────────────────────────────┬──────────────────────────────────┬─────────────────┘                                       │
│            │ SQL                              │ HTTPS                            │ TCP                                                    │
│            ▼                                  ▼                                  ▼                                                        │
│    ┌──────────────────────┐          ┌──────────────────────┐          ┌──────────────────────┐                                           │
│    │   DATABASE SERVER    │          │   AI CLOUD SERVICE   │          │   SANDBOX CLUSTER    │                                           │
│    ├──────────────────────┤          ├──────────────────────┤          ├──────────────────────┤                                           │
│    │ • PostgreSQL DB      │          │ • AI & Analytics     │          │ • Secure Sandbox     │                                           │
│    │ • Relational Data    │          │   Subsystem          │          │   Subsystem          │                                           │
│    │ • System Logs        │          │ • LLM External API   │          │ • Sandbox Execution  │                                           │
│    │   (Separate Volume)  │          │ • Progress Analytics │          │ • Container Isolation│                                           │
│    │ • Row Level Security │          │ • Hint Generation    │          │ • Resource Limits    │                                           │
│    └──────────────────────┘          └──────────────────────┘          └──────────────────────┘                                           │
│                                                                                                                                           │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │  NOTES:                                                                                                                            │   │
│  │  • Independent storage volumes for DB and logs prevent I/O contention                                                              │   │
│  │  • Sandbox cluster uses container orchestration for code execution isolation                                                       │   │
│  │  • All communication encrypted (HTTPS/TLS) except internal database (private network)                                             │   │
│  │  • AI service is external (LLM API) for hint generation and analytics                                                              │   │
│  └────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                                                           │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘`}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* Security Architecture Diagram */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Security Architecture Diagram
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/30 p-6 rounded-lg border overflow-x-auto">
                    <pre className="text-sm font-mono text-muted-foreground whitespace-pre">
{`┌─────────────────────────────────────────────────────────────────────────┐
│                         SECURITY ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐            │
│   │   Client    │──────│   WAF/CDN   │──────│   HTTPS     │            │
│   │  (Browser)  │      │  (Layer 1)  │      │   TLS 1.3   │            │
│   └─────────────┘      └─────────────┘      └──────┬──────┘            │
│                                                     │                    │
│   ┌─────────────────────────────────────────────────▼──────────────┐   │
│   │                    APPLICATION LAYER                            │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │   │
│   │  │ Input Valid. │  │ Rate Limiting│  │ CSRF Protect │          │   │
│   │  │   (Layer 2)  │  │   (Layer 2)  │  │   (Layer 2)  │          │   │
│   │  └──────────────┘  └──────────────┘  └──────────────┘          │   │
│   └─────────────────────────────────────────────────┬──────────────┘   │
│                                                      │                   │
│   ┌──────────────────────────────────────────────────▼─────────────┐   │
│   │                     AUTH SERVICE (Layer 3)                      │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │   │
│   │  │ JWT Tokens   │  │   bcrypt     │  │   Session    │          │   │
│   │  │              │  │   Hashing    │  │   Mgmt       │          │   │
│   │  └──────────────┘  └──────────────┘  └──────────────┘          │   │
│   └─────────────────────────────────────────────────┬──────────────┘   │
│                                                      │                   │
│   ┌───────────────────┬──────────────────────────────▼─────────────┐   │
│   │   RBAC (Layer 4)  │              DATA LAYER (Layer 5)          │   │
│   │  ┌─────────────┐  │  ┌──────────────┐  ┌──────────────┐        │   │
│   │  │ user_roles  │  │  │  PostgreSQL  │  │  AES-256     │        │   │
│   │  │ has_role()  │  │  │    + RLS     │  │  Encryption  │        │   │
│   │  └─────────────┘  │  └──────────────┘  └──────────────┘        │   │
│   └───────────────────┴────────────────────────────────────────────┘   │
│                                                                          │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                    SANDBOX (Layer 6)                            │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │   │
│   │  │  Container   │  │   Resource   │  │   No Network │          │   │
│   │  │  Isolation   │  │    Limits    │  │    Access    │          │   │
│   │  └──────────────┘  └──────────────┘  └──────────────┘          │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘`}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* Authentication Flow Diagram */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-primary" />
                    Authentication Flow Diagram
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/30 p-6 rounded-lg border overflow-x-auto">
                    <pre className="text-sm font-mono text-muted-foreground whitespace-pre">
{`┌──────────┐          ┌──────────┐          ┌──────────┐          ┌──────────┐
│   User   │          │  Web UI  │          │   Auth   │          │ Database │
│          │          │          │          │ Service  │          │          │
└────┬─────┘          └────┬─────┘          └────┬─────┘          └────┬─────┘
     │                     │                     │                     │
     │  1. Enter Creds     │                     │                     │
     │────────────────────>│                     │                     │
     │                     │                     │                     │
     │                     │  2. POST /auth/login│                     │
     │                     │────────────────────>│                     │
     │                     │                     │                     │
     │                     │                     │  3. Query User      │
     │                     │                     │────────────────────>│
     │                     │                     │                     │
     │                     │                     │  4. Return User     │
     │                     │                     │<────────────────────│
     │                     │                     │                     │
     │                     │                     │ ┌─────────────────┐ │
     │                     │                     │ │ 5. Verify Pass  │ │
     │                     │                     │ │    (bcrypt)     │ │
     │                     │                     │ │ 6. Generate JWT │ │
     │                     │                     │ └─────────────────┘ │
     │                     │                     │                     │
     │                     │  7. JWT + Refresh   │                     │
     │                     │<────────────────────│                     │
     │                     │                     │                     │
     │                     │ ┌─────────────────┐ │                     │
     │                     │ │ 8. Store tokens │ │                     │
     │                     │ │  (httpOnly)     │ │                     │
     │                     │ └─────────────────┘ │                     │
     │                     │                     │                     │
     │  9. Login Success   │                     │                     │
     │<────────────────────│                     │                     │
     │                     │                     │                     │`}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* RBAC Diagram */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Role-Based Access Control (RBAC) Diagram
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/30 p-6 rounded-lg border overflow-x-auto">
                    <pre className="text-sm font-mono text-muted-foreground whitespace-pre">
{`                          ┌─────────────────────────────────┐
                          │          RBAC SYSTEM            │
                          └─────────────────────────────────┘
                                         │
              ┌──────────────────────────┴──────────────────────────┐
              │                                                     │
              ▼                                                     ▼
     ┌─────────────────┐                               ┌─────────────────┐
     │     LEARNER     │                               │      ADMIN      │
     │    (Default)    │                               │  (Privileged)   │
     └────────┬────────┘                               └────────┬────────┘
              │                                                  │
              ▼                                                  ▼
     ┌─────────────────────────┐                      ┌─────────────────────────┐
     │      PERMISSIONS        │                      │      PERMISSIONS        │
     ├─────────────────────────┤                      ├─────────────────────────┤
     │ ✓ View published quests │                      │ ✓ All Learner perms     │
     │ ✓ Submit code           │                      │ ✓ Create/Edit quests    │
     │ ✓ View own progress     │                      │ ✓ Delete quests         │
     │ ✓ Access hints          │                      │ ✓ View solution_code    │
     │ ✓ View achievements     │                      │ ✓ Manage test cases     │
     │ ✓ Update own profile    │                      │ ✓ View all users        │
     │ ✗ View solutions        │                      │ ✓ Suspend/remove users  │
     │ ✗ Manage quests         │                      │ ✓ View analytics        │
     │ ✗ View other users      │                      │ ✓ Access admin panel    │
     └─────────────────────────┘                      └─────────────────────────┘
                                         
     ┌─────────────────────────────────────────────────────────────────────────┐
     │                        DATABASE SCHEMA                                   │
     ├─────────────────────────────────────────────────────────────────────────┤
     │  user_roles (SEPARATE TABLE - Not on User table!)                       │
     │  ├── id: UUID (PK)                                                      │
     │  ├── user_id: UUID (FK → User)                                          │
     │  ├── role: ENUM('admin', 'learner')                                     │
     │  └── created_at: TIMESTAMP                                              │
     └─────────────────────────────────────────────────────────────────────────┘`}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* Sandbox Execution Flow */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="w-5 h-5 text-primary" />
                    Sandbox Execution Security Flow
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/30 p-6 rounded-lg border overflow-x-auto">
                    <pre className="text-sm font-mono text-muted-foreground whitespace-pre">
{`┌────────────────────────────────────────────────────────────────────────────────┐
│                        SANDBOX EXECUTION FLOW                                   │
└────────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────┐
  │  User Code  │
  │  Submitted  │
  └──────┬──────┘
         │
         ▼
  ┌─────────────────┐      ┌─────────────────┐
  │ Input Validation│──NO──│  Reject with    │
  │   (Sanitize)    │      │  Error Message  │
  └────────┬────────┘      └─────────────────┘
           │ YES
           ▼
  ┌─────────────────┐      ┌─────────────────┐
  │  Rate Limit     │──NO──│  429: Too Many  │
  │    Check        │      │    Requests     │
  └────────┬────────┘      └─────────────────┘
           │ OK
           ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │                    ISOLATED SANDBOX CONTAINER                    │
  │  ┌─────────────────────────────────────────────────────────┐    │
  │  │  • No network access                                     │    │
  │  │  • Read-only filesystem                                  │    │
  │  │  • Memory limit enforced                                 │    │
  │  │  • Blocked syscalls: fork, exec, socket                  │    │
  │  │  • 5-second timeout                                      │    │
  │  └─────────────────────────────────────────────────────────┘    │
  │                              │                                   │
  │                              ▼                                   │
  │  ┌─────────────────┐    ┌─────────────────┐                     │
  │  │ Execute Code    │    │ Monitor Process │                     │
  │  └────────┬────────┘    └────────┬────────┘                     │
  │           │                      │                               │
  └───────────┼──────────────────────┼───────────────────────────────┘
              │                      │
              ▼                      ▼
       ┌──────────────┐       ┌──────────────┐
       │   TIMEOUT?   │───YES─│ Kill Process │
       └──────┬───────┘       │ Return Error │
              │ NO            └──────────────┘
              ▼
       ┌──────────────┐       ┌──────────────┐
       │   ERROR?     │───YES─│ Capture Error│
       └──────┬───────┘       │ Log & Return │
              │ NO            └──────────────┘
              ▼
       ┌─────────────────┐
       │ Capture Output  │
       │ Run Test Cases  │
       └────────┬────────┘
                │
                ▼
       ┌─────────────────┐
       │ Return Result   │
       │ + Cleanup Temp  │
       └─────────────────┘`}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* Data Access Control with RLS */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    Data Access Control with RLS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/30 p-6 rounded-lg border overflow-x-auto">
                    <pre className="text-sm font-mono text-muted-foreground whitespace-pre">
{`┌────────────────────────────────────────────────────────────────────────────────┐
│                     ROW LEVEL SECURITY (RLS) FLOW                              │
└────────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────┐
                    │   API Request   │
                    │  with JWT Token │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Extract User  │
                    │   from auth.uid │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ has_role() fn   │◄──── Security Definer
                    │ Check user_roles│      (Prevents Recursion)
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
       ┌────────────┐ ┌────────────┐ ┌────────────┐
       │   Quest    │ │ Submission │ │  Progress  │
       │   Table    │ │   Table    │ │   Table    │
       └─────┬──────┘ └─────┬──────┘ └─────┬──────┘
             │              │              │
             ▼              ▼              ▼
       ┌────────────┐ ┌────────────┐ ┌────────────┐
       │ RLS Policy │ │ RLS Policy │ │ RLS Policy │
       │            │ │            │ │            │
       │ Learner:   │ │ Owner:     │ │ Owner:     │
       │ published  │ │ own rows   │ │ own rows   │
       │ only       │ │ only       │ │ only       │
       │            │ │            │ │            │
       │ Admin:     │ │ Admin:     │ │ Admin:     │
       │ all rows   │ │ all rows   │ │ all rows   │
       └────────────┘ └────────────┘ └────────────┘`}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* Mermaid Diagram Code Reference */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCode className="w-5 h-5 text-primary" />
                    Mermaid Diagram Code (for Documentation)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Copy these Mermaid diagram codes to use in your documentation tools (GitHub, Notion, Confluence, etc.)
                  </p>
                  
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h5 className="font-medium mb-2">1. Security Architecture</h5>
                      <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`graph TD
    A[Client Browser] --> B[WAF / CDN]
    B --> C[HTTPS TLS 1.3]
    C --> D[Application Layer]
    D --> E[Auth Service]
    E --> F[Database + RLS]
    D --> G[Sandbox]
    
    subgraph Layer 2: App Security
        D1[Input Validation]
        D2[Rate Limiting]
        D3[CSRF Protection]
    end
    
    subgraph Layer 3: Authentication
        E1[JWT Tokens]
        E2[bcrypt Hashing]
        E3[Session Management]
    end
    
    subgraph Layer 5: Data
        F1[PostgreSQL]
        F2[AES-256 Encryption]
    end
    
    subgraph Layer 6: Sandbox
        G1[Container Isolation]
        G2[Resource Limits]
        G3[No Network]
    end`}
                      </pre>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h5 className="font-medium mb-2">2. Authentication Flow</h5>
                      <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`sequenceDiagram
    participant U as User
    participant W as Web UI
    participant A as Auth Service
    participant D as Database
    
    U->>W: Enter credentials
    W->>A: POST /auth/login
    A->>D: Query user by email
    D-->>A: Return user record
    A->>A: Verify password (bcrypt)
    A->>A: Generate JWT + Refresh token
    A-->>W: Return tokens
    W->>W: Store in httpOnly cookies
    W-->>U: Login successful`}
                      </pre>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h5 className="font-medium mb-2">3. RBAC Structure</h5>
                      <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`graph TD
    A[User] --> B{Role Check}
    B -->|Learner| C[Learner Permissions]
    B -->|Admin| D[Admin Permissions]
    
    C --> C1[View Quests]
    C --> C2[Submit Code]
    C --> C3[View Progress]
    
    D --> D1[All Learner Perms]
    D --> D2[Manage Content]
    D --> D3[View Analytics]
    D --> D4[Manage Users]`}
                      </pre>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h5 className="font-medium mb-2">4. Sandbox Execution Flow</h5>
                      <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`flowchart TD
    A[User Code] --> B{Input Valid?}
    B -->|No| C[Reject]
    B -->|Yes| D{Rate Limit OK?}
    D -->|No| E[429 Error]
    D -->|Yes| F[Spawn Sandbox]
    F --> G[Execute with Limits]
    G --> H{Timeout?}
    H -->|Yes| I[Kill & Error]
    H -->|No| J{Success?}
    J -->|No| K[Return Error]
    J -->|Yes| L[Run Tests]
    L --> M[Return Result]
    M --> N[Cleanup]`}
                      </pre>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h5 className="font-medium mb-2">5. RLS Data Flow</h5>
                      <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`flowchart TD
    A[API Request + JWT] --> B[Extract auth.uid]
    B --> C[has_role Function]
    C --> D{Check user_roles}
    
    D --> E[Quest Table]
    D --> F[Submission Table]
    D --> G[Progress Table]
    
    E --> E1[Learner: published only]
    E --> E2[Admin: all rows]
    
    F --> F1[Owner: own rows]
    F --> F2[Admin: all rows]
    
    G --> G1[Owner: own rows]
    G --> G2[Admin: all rows]`}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { 
            background: white !important; 
            color: black !important;
          }
          .print\\:hidden { display: none !important; }
          .print\\:bg-white { background: white !important; }
          .print\\:text-black { color: black !important; }
          .print\\:text-gray-600 { color: #4b5563 !important; }
          .print\\:text-gray-700 { color: #374151 !important; }
          .print\\:border-gray-500 { border-color: #6b7280 !important; }
          [data-state] { display: block !important; }
          .bg-muted, .bg-muted\\/30, .bg-muted\\/50 { background: #f3f4f6 !important; }
        }
      `}</style>
    </div>
  );
};

export default AccessControlSecurity;
