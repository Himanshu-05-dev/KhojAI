import matplotlib.pyplot as plt
import matplotlib.patches as patches
import os

os.makedirs(r'd:\projects\KhojAI\report_assets', exist_ok=True)
out_dir = r'd:\projects\KhojAI\report_assets'

# Styling config
plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['font.family'] = 'sans-serif'

# -------------------------------------------------------------
# 1. System Architecture Diagram
# -------------------------------------------------------------
def make_arch_diagram():
    fig, ax = plt.subplots(figsize=(10, 6.5), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 7)
    ax.axis('off')

    # Title
    ax.text(5, 6.6, "KhojAI - Four-Layer System Architecture", fontsize=14, weight='bold', ha='center', color='#1E293B')

    # Layer 1
    rect1 = patches.FancyBboxPatch((0.5, 5.0), 9.0, 1.1, boxstyle="round,pad=0.1", fc='#E0E7FF', ec='#4338CA', lw=2)
    ax.add_patch(rect1)
    ax.text(5, 5.75, "LAYER 1: PRESENTATION & CLIENT LAYER (React 18 + Vite + Tailwind CSS)", fontsize=11, weight='bold', ha='center', color='#312E81')
    ax.text(5, 5.3, "Responsive Dashboard | Kanban Application Tracker | Interactive Roadmap | Resume Uploader | Toast System", fontsize=9, ha='center', color='#374151')

    # Arrow 1->2
    ax.annotate('', xy=(5, 4.3), xytext=(5, 5.0), arrowprops=dict(facecolor='#4F46E5', edgecolor='#4F46E5', width=2, headwidth=8))
    ax.text(5.2, 4.65, "REST API (JSON / JWT Auth)", fontsize=8, color='#4F46E5', weight='bold')

    # Layer 2
    rect2 = patches.FancyBboxPatch((0.5, 3.1), 9.0, 1.2, boxstyle="round,pad=0.1", fc='#FEF3C7', ec='#D97706', lw=2)
    ax.add_patch(rect2)
    ax.text(5, 3.9, "LAYER 2: APPLICATION & API GATEWAY LAYER (Node.js + Express + Mongoose)", fontsize=11, weight='bold', ha='center', color='#78350F')
    ax.text(5, 3.45, "JWT Auth & RBAC | Multi-Criteria Job Matching Service | Application State Engine | Background Worker Dispatch", fontsize=9, ha='center', color='#451A03')

    # Arrow 2->3 & 2->4
    ax.annotate('', xy=(2.75, 2.3), xytext=(3.5, 3.1), arrowprops=dict(facecolor='#059669', edgecolor='#059669', width=2, headwidth=8))
    ax.annotate('', xy=(7.25, 2.3), xytext=(6.5, 3.1), arrowprops=dict(facecolor='#2563EB', edgecolor='#2563EB', width=2, headwidth=8))
    ax.text(2.6, 2.7, "Internal HTTP / IPC", fontsize=8, color='#059669', weight='bold')
    ax.text(6.8, 2.7, "Redis Queue / ODM", fontsize=8, color='#2563EB', weight='bold')

    # Layer 3
    rect3 = patches.FancyBboxPatch((0.5, 0.5), 4.2, 1.8, boxstyle="round,pad=0.1", fc='#D1FAE5', ec='#059669', lw=2)
    ax.add_patch(rect3)
    ax.text(2.6, 1.9, "LAYER 3: AI ORCHESTRATION LAYER", fontsize=10, weight='bold', ha='center', color='#064E3B')
    ax.text(2.6, 1.6, "(Python + FastAPI + LangGraph)", fontsize=9, style='italic', ha='center', color='#065F46')
    ax.text(2.6, 1.2, "• Multi-Stage Resume Parser\n• LangGraph State Workflows\n• Personalized Roadmap Engine\n• Local NLP Rule Fallback", fontsize=8.5, ha='center', color='#1F2937')

    # Layer 4
    rect4 = patches.FancyBboxPatch((5.3, 0.5), 4.2, 1.8, boxstyle="round,pad=0.1", fc='#DBEAFE', ec='#2563EB', lw=2)
    ax.add_patch(rect4)
    ax.text(7.4, 1.9, "LAYER 4: DATA & INFRASTRUCTURE", fontsize=10, weight='bold', ha='center', color='#1E3A8A')
    ax.text(7.4, 1.6, "(MongoDB 7 + Redis 7 + BullMQ)", fontsize=9, style='italic', ha='center', color='#1D4ED8')
    ax.text(7.4, 1.2, "• MongoDB: User, Job, App, Resume\n• Redis: BullMQ Job Discovery Queue\n• Async Quiet-Hours Worker\n• Docker Containerization", fontsize=8.5, ha='center', color='#1F2937')

    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, 'arch_diagram.png'), dpi=300, bbox_inches='tight')
    plt.close()

# -------------------------------------------------------------
# 2. Use Case Diagram
# -------------------------------------------------------------
def make_usecase_diagram():
    fig, ax = plt.subplots(figsize=(10, 6.5), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 7)
    ax.axis('off')

    ax.text(5, 6.6, "KhojAI - Use Case Diagram", fontsize=14, weight='bold', ha='center', color='#1E293B')

    # System Boundary Box
    boundary = patches.FancyBboxPatch((2.6, 0.4), 6.8, 5.9, boxstyle="round,pad=0.1", fc='#F8FAFC', ec='#64748B', lw=1.5, ls='--')
    ax.add_patch(boundary)
    ax.text(6.0, 6.0, "KhojAI Career Discovery System", fontsize=11, weight='bold', color='#334155', ha='center')

    # Actors
    # Actor 1: Student / Job Seeker
    ax.scatter(1.2, 3.8, s=300, color='#3B82F6')
    ax.plot([1.2, 1.2], [3.2, 3.8], color='#3B82F6', lw=3)
    ax.plot([0.9, 1.5], [3.5, 3.5], color='#3B82F6', lw=3)
    ax.plot([1.2, 0.9], [3.2, 2.7], color='#3B82F6', lw=3)
    ax.plot([1.2, 1.5], [3.2, 2.7], color='#3B82F6', lw=3)
    ax.text(1.2, 2.4, "Student / Job Seeker\n(Primary Actor)", fontsize=9, weight='bold', ha='center', color='#1E3A8A')

    # Actor 2: Recruiter / Admin
    ax.scatter(1.2, 1.3, s=200, color='#6366F1')
    ax.plot([1.2, 1.2], [0.8, 1.3], color='#6366F1', lw=2.5)
    ax.plot([1.0, 1.4], [1.1, 1.1], color='#6366F1', lw=2.5)
    ax.plot([1.2, 1.0], [0.8, 0.4], color='#6366F1', lw=2.5)
    ax.plot([1.2, 1.4], [0.8, 0.4], color='#6366F1', lw=2.5)
    ax.text(1.2, 0.15, "Recruiter / Admin", fontsize=8.5, weight='bold', ha='center', color='#312E81')

    # Use cases
    use_cases = [
        ("UC1: Register & Manage Profile", 5.0),
        ("UC2: Upload & Parse Resume via NLP", 4.3),
        ("UC3: Discover Jobs & View AI Match Score", 3.6),
        ("UC4: Track Applications in Kanban Stages", 2.9),
        ("UC5: Generate Custom Career Roadmap", 2.2),
        ("UC6: Receive Proactive Job Match Alerts", 1.5),
        ("UC7: Manage Jobs & Match Feed (Admin)", 0.8)
    ]

    for label, y in use_cases:
        ellipse = patches.Ellipse((6.0, y), 5.0, 0.5, fc='#EEF2FF', ec='#4F46E5', lw=1.5)
        ax.add_patch(ellipse)
        ax.text(6.0, y - 0.05, label, fontsize=9, weight='bold', ha='center', color='#1E1B4B')

        # Connect Primary Actor to UC1-UC6
        if y >= 1.5:
            ax.plot([1.6, 3.5], [3.3, y], color='#94A3B8', lw=1.2, ls=':')
        else:
            ax.plot([1.6, 3.5], [0.9, y], color='#94A3B8', lw=1.2, ls=':')

    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, 'usecase_diagram.png'), dpi=300, bbox_inches='tight')
    plt.close()

# -------------------------------------------------------------
# 3. DFD Level 0 (Context Level Diagram)
# -------------------------------------------------------------
def make_dfd0_diagram():
    fig, ax = plt.subplots(figsize=(10, 5.5), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6)
    ax.axis('off')

    ax.text(5, 5.5, "KhojAI - Level 0 Data Flow Diagram (Context Level)", fontsize=13, weight='bold', ha='center', color='#1E293B')

    # External Entity: Student
    e1 = patches.Rectangle((0.6, 2.2), 2.2, 1.6, fc='#E0E7FF', ec='#3730A3', lw=2)
    ax.add_patch(e1)
    ax.text(1.7, 3.1, "STUDENT /\nJOB SEEKER", fontsize=10, weight='bold', ha='center', color='#1E1B4B')

    # Central Process: 0.0 KhojAI System
    p0 = patches.Circle((5.0, 3.0), 1.5, fc='#F0FDF4', ec='#16A34A', lw=2.5)
    ax.add_patch(p0)
    ax.text(5.0, 3.2, "0.0", fontsize=12, weight='bold', ha='center', color='#14532D')
    ax.text(5.0, 2.8, "KhojAI Career\nDiscovery Platform", fontsize=10, weight='bold', ha='center', color='#14532D')

    # External Entity: Job Boards & Recruiters
    e2 = patches.Rectangle((7.2, 2.2), 2.2, 1.6, fc='#FEF3C7', ec='#B45309', lw=2)
    ax.add_patch(e2)
    ax.text(8.3, 3.1, "EXTERNAL JOB\nPROVIDERS / APIS", fontsize=10, weight='bold', ha='center', color='#78350F')

    # Arrows E1 -> P0 & P0 -> E1
    ax.annotate('', xy=(3.5, 3.4), xytext=(2.8, 3.4), arrowprops=dict(facecolor='#4338CA', edgecolor='#4338CA', width=1.5, headwidth=6))
    ax.text(3.15, 3.6, "Profile, Resume, Target Role", fontsize=8, ha='center', color='#3730A3')

    ax.annotate('', xy=(2.8, 2.6), xytext=(3.5, 2.6), arrowprops=dict(facecolor='#059669', edgecolor='#059669', width=1.5, headwidth=6))
    ax.text(3.15, 2.3, "Matches, Roadmap, Alerts", fontsize=8, ha='center', color='#065F46')

    # Arrows E2 -> P0
    ax.annotate('', xy=(6.5, 3.2), xytext=(7.2, 3.2), arrowprops=dict(facecolor='#B45309', edgecolor='#B45309', width=1.5, headwidth=6))
    ax.text(6.85, 3.4, "Job Listings & Requirements", fontsize=8, ha='center', color='#78350F')

    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, 'dfd_level0.png'), dpi=300, bbox_inches='tight')
    plt.close()

# -------------------------------------------------------------
# 4. DFD Level 1
# -------------------------------------------------------------
def make_dfd1_diagram():
    fig, ax = plt.subplots(figsize=(10, 6.5), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 7)
    ax.axis('off')

    ax.text(5, 6.6, "KhojAI - Level 1 Data Flow Diagram", fontsize=13, weight='bold', ha='center', color='#1E293B')

    # Student Entity
    e1 = patches.Rectangle((0.4, 2.6), 1.8, 1.8, fc='#E0E7FF', ec='#3730A3', lw=1.8)
    ax.add_patch(e1)
    ax.text(1.3, 3.6, "Student /\nJob Seeker", fontsize=10, weight='bold', ha='center', color='#1E1B4B')

    # Processes
    procs = [
        ("1.0 Auth & Profile Mgmt", 5.7),
        ("2.0 Resume Parsing", 4.3),
        ("3.0 Job Matching Engine", 2.9),
        ("4.0 Application Tracking", 1.5),
        ("5.0 Roadmap Generation", 0.3)
    ]

    for label, y in procs:
        circ = patches.Circle((4.5, y + 0.3), 0.55, fc='#F0FDF4', ec='#16A34A', lw=1.8)
        ax.add_patch(circ)
        ax.text(4.5, y + 0.3, label.split()[0], fontsize=9, weight='bold', ha='center', color='#14532D')
        ax.text(4.5, y - 0.25, " ".join(label.split()[1:]), fontsize=8.5, weight='bold', ha='center', color='#1F2937')

        # Flow from Student to Process
        ax.plot([2.2, 3.9], [3.5, y + 0.3], color='#64748B', lw=1.2, ls='-')

    # Data Stores (Right Side)
    stores = [
        ("D1: Users DB", 5.7),
        ("D2: Resumes DB", 4.3),
        ("D3: Jobs & Matches DB", 2.9),
        ("D4: Applications DB", 1.5),
        ("D5: Roadmaps DB", 0.3)
    ]

    for sname, y in stores:
        # Open ended rectangle for datastore
        ax.plot([7.2, 9.4], [y + 0.6, y + 0.6], color='#1E3A8A', lw=1.5)
        ax.plot([7.2, 9.4], [y, y], color='#1E3A8A', lw=1.5)
        ax.plot([7.2, 7.2], [y, y + 0.6], color='#1E3A8A', lw=1.5)
        ax.fill_between([7.2, 9.4], y, y + 0.6, color='#DBEAFE', alpha=0.6)
        ax.text(8.3, y + 0.25, sname, fontsize=8.5, weight='bold', ha='center', color='#1E3A8A')

        # Arrow from Process to Data Store
        ax.annotate('', xy=(7.1, y + 0.3), xytext=(5.1, y + 0.3), arrowprops=dict(facecolor='#2563EB', edgecolor='#2563EB', width=1.2, headwidth=5))

    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, 'dfd_level1.png'), dpi=300, bbox_inches='tight')
    plt.close()

# -------------------------------------------------------------
# 5. DFD Level 2 (Decomposition of Job Matching Process 3.0)
# -------------------------------------------------------------
def make_dfd2_diagram():
    fig, ax = plt.subplots(figsize=(10, 6.5), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 7)
    ax.axis('off')

    ax.text(5, 6.6, "KhojAI - Level 2 Data Flow Diagram (Process 3.0: Job Matching Engine)", fontsize=13, weight='bold', ha='center', color='#1E293B')

    # Subprocesses
    sub_procs = [
        ("3.1", "Skill Vector\nExtraction", 1.8, 4.5),
        ("3.2", "Composite Score\nComputation", 5.0, 4.5),
        ("3.3", "Strengths &\nGap Analysis", 8.2, 4.5),
        ("3.4", "AI Copilot Pitch\nSynthesis", 5.0, 1.8),
        ("3.5", "Quiet-Hours Alert\nDispatcher", 1.8, 1.8)
    ]

    for pnum, pname, x, y in sub_procs:
        circ = patches.Circle((x, y), 0.75, fc='#FEF3C7', ec='#D97706', lw=2)
        ax.add_patch(circ)
        ax.text(x, y + 0.2, pnum, fontsize=10, weight='bold', ha='center', color='#78350F')
        ax.text(x, y - 0.2, pname, fontsize=8, weight='bold', ha='center', color='#451A03')

    # Connecting Arrows
    # 3.1 -> 3.2
    ax.annotate('', xy=(4.2, 4.5), xytext=(2.6, 4.5), arrowprops=dict(facecolor='#D97706', edgecolor='#D97706', width=1.5, headwidth=6))
    ax.text(3.4, 4.8, "Skills & Weightings", fontsize=8, ha='center', color='#78350F')

    # 3.2 -> 3.3
    ax.annotate('', xy=(7.4, 4.5), xytext=(5.8, 4.5), arrowprops=dict(facecolor='#D97706', edgecolor='#D97706', width=1.5, headwidth=6))
    ax.text(6.6, 4.8, "Match % & Gaps", fontsize=8, ha='center', color='#78350F')

    # 3.3 -> 3.4
    ax.annotate('', xy=(5.8, 2.1), xytext=(7.8, 3.8), arrowprops=dict(facecolor='#D97706', edgecolor='#D97706', width=1.5, headwidth=6))
    ax.text(7.2, 2.8, "Gap Vectors", fontsize=8, ha='center', color='#78350F')

    # 3.4 -> 3.5
    ax.annotate('', xy=(2.6, 1.8), xytext=(4.2, 1.8), arrowprops=dict(facecolor='#D97706', edgecolor='#D97706', width=1.5, headwidth=6))
    ax.text(3.4, 2.1, "Pitch & Score", fontsize=8, ha='center', color='#78350F')

    # Data Store D3
    ax.plot([3.8, 6.2], [0.5, 0.5], color='#1E3A8A', lw=1.5)
    ax.plot([3.8, 6.2], [0.1, 0.1], color='#1E3A8A', lw=1.5)
    ax.plot([3.8, 3.8], [0.1, 0.5], color='#1E3A8A', lw=1.5)
    ax.fill_between([3.8, 6.2], 0.1, 0.5, color='#DBEAFE', alpha=0.6)
    ax.text(5.0, 0.25, "D3: Matches & Alerts Queue", fontsize=8.5, weight='bold', ha='center', color='#1E3A8A')

    # Arrow 3.5 -> D3
    ax.annotate('', xy=(4.0, 0.5), xytext=(2.2, 1.05), arrowprops=dict(facecolor='#2563EB', edgecolor='#2563EB', width=1.2, headwidth=5))

    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, 'dfd_level2.png'), dpi=300, bbox_inches='tight')
    plt.close()

make_arch_diagram()
make_usecase_diagram()
make_dfd0_diagram()
make_dfd1_diagram()
make_dfd2_diagram()
print("All 5 project diagrams generated successfully!")
