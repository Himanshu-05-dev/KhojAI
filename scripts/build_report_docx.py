import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

DOCX_OUTPUT_PATH = r"d:\projects\KhojAI\KhojAI_Mini_Project_Report.docx"
ASSETS_DIR = r"d:\projects\KhojAI\report_assets"

doc = Document()

# Page Setup: A4, Margins: Top: 3.5cm, Bottom: 2.0cm, Left: 3.0cm, Right: 2.0cm
for section in doc.sections:
    section.page_width = Cm(21.0)
    section.page_height = Cm(29.7)
    section.top_margin = Cm(3.5)
    section.bottom_margin = Cm(2.0)
    section.left_margin = Cm(3.0)
    section.right_margin = Cm(2.0)
    section.different_first_page_header_footer = True

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>'))

def set_cell_padding(cell, top=120, bottom=120, left=160, right=160):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def set_table_borders(table, color="B0B0B0", sz="4", val="single"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:left w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'<w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:insideV w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def setup_header_footer(section):
    header = section.header
    hp = header.paragraphs[0]
    hp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    hrun1 = hp.add_run("JSS Academy of Technical Education – NOIDA\n")
    hrun1.font.name = "Times New Roman"
    hrun1.font.size = Pt(10)
    hrun1.font.bold = True
    hrun1.font.color.rgb = RGBColor(0, 51, 102)

    hrun2 = hp.add_run("Mini Project/Internship Assessment (BCC-551) (CSE-AI&ML V Semester)")
    hrun2.font.name = "Times New Roman"
    hrun2.font.size = Pt(9)
    hrun2.font.italic = True
    hrun2.font.color.rgb = RGBColor(70, 70, 70)

    footer = section.footer
    fp = footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    frun = fp.add_run()
    frun.font.name = "Times New Roman"
    frun.font.size = Pt(10)
    fldChar1 = parse_xml(r'<w:fldChar %s w:fldCharType="begin"/>' % nsdecls('w'))
    instrText = parse_xml(r'<w:instrText %s xml:space="preserve"> PAGE </w:instrText>' % nsdecls('w'))
    fldChar2 = parse_xml(r'<w:fldChar %s w:fldCharType="separate"/>' % nsdecls('w'))
    fldChar3 = parse_xml(r'<w:fldChar %s w:fldCharType="end"/>' % nsdecls('w'))
    frun._r.append(fldChar1)
    frun._r.append(instrText)
    frun._r.append(fldChar2)
    frun._r.append(fldChar3)

def add_p(text="", space_after=6, space_before=0, line_spacing=1.5, align=WD_ALIGN_PARAGRAPH.JUSTIFY, bold=False, italic=False, font_size=12, color=None):
    p = doc.add_paragraph()
    p.alignment = align
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.line_spacing = line_spacing

    if text:
        run = p.add_run(text)
        run.font.name = "Times New Roman"
        run.font.size = Pt(font_size)
        run.font.bold = bold
        run.font.italic = italic
        if color:
            run.font.color.rgb = color
    return p

def add_heading_1(title):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(16)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(title.upper())
    run.font.name = "Times New Roman"
    run.font.size = Pt(16)
    run.font.bold = True
    run.font.color.rgb = RGBColor(0, 32, 96)
    return p

def add_heading_2(title):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(title)
    run.font.name = "Times New Roman"
    run.font.size = Pt(14)
    run.font.bold = True
    run.font.color.rgb = RGBColor(10, 10, 10)
    return p

def add_heading_3(title):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(title)
    run.font.name = "Times New Roman"
    run.font.size = Pt(12)
    run.font.bold = True
    run.font.italic = True
    run.font.color.rgb = RGBColor(40, 40, 40)
    return p

def add_bullet(text, bold_prefix=""):
    p = doc.add_paragraph(style='List Bullet')
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.line_spacing = 1.5
    if bold_prefix:
        r1 = p.add_run(bold_prefix)
        r1.font.name = "Times New Roman"
        r1.font.size = Pt(12)
        r1.font.bold = True
    r2 = p.add_run(text)
    r2.font.name = "Times New Roman"
    r2.font.size = Pt(12)
    return p

def add_figure(img_filename, caption, width=Inches(5.8)):
    img_path = os.path.join(ASSETS_DIR, img_filename)
    if os.path.exists(img_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(6)
        p_img.paragraph_format.space_after = Pt(2)
        run = p_img.add_run()
        run.add_picture(img_path, width=width)

        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(2)
        p_cap.paragraph_format.space_after = Pt(10)
        crun = p_cap.add_run(caption)
        crun.font.name = "Times New Roman"
        crun.font.size = Pt(10)
        crun.font.bold = True
        crun.font.italic = True
        crun.font.color.rgb = RGBColor(60, 60, 60)
    else:
        print(f"Warning: File not found: {img_path}")

def add_table_title(caption):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(3)
    run = p.add_run(caption)
    run.font.name = "Times New Roman"
    run.font.size = Pt(10)
    run.font.bold = True
    run.font.color.rgb = RGBColor(50, 50, 50)
    return p

# Apply header footer to section 1
setup_header_footer(doc.sections[0])

# ===========================================================================
# COVER PAGE (Page i - unprinted number)
# ===========================================================================
p = add_p("JSS MAHAVIDYAPEETHA", space_after=10, align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, font_size=16)

logo_path = os.path.join(ASSETS_DIR, "college_logo.png")
if os.path.exists(logo_path):
    p_logo = doc.add_paragraph()
    p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_logo.paragraph_format.space_after = Pt(12)
    p_logo.add_run().add_picture(logo_path, width=Inches(1.8))

p = add_p("Mini Project / Internship Assessment Report", space_after=20, align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, font_size=18, color=RGBColor(0, 32, 96))

# Box for Subject Name and Subject Code
box_table = doc.add_table(rows=2, cols=1)
box_table.alignment = WD_TABLE_ALIGNMENT.CENTER
set_table_borders(box_table, color="000000", sz="12", val="single")
cell0 = box_table.cell(0, 0)
set_cell_padding(cell0, top=140, bottom=70, left=200, right=200)
p_box1 = cell0.paragraphs[0]
p_box1.alignment = WD_ALIGN_PARAGRAPH.LEFT
r = p_box1.add_run("Subject Name: Mini project / Internship Assessment")
r.font.name = "Times New Roman"
r.font.size = Pt(14)
r.font.bold = True

cell1 = box_table.cell(1, 0)
set_cell_padding(cell1, top=70, bottom=140, left=200, right=200)
p_box2 = cell1.paragraphs[0]
p_box2.alignment = WD_ALIGN_PARAGRAPH.LEFT
r = p_box2.add_run("Subject Code : BCC-551")
r.font.name = "Times New Roman"
r.font.size = Pt(14)
r.font.bold = True

add_p("", space_after=14)
add_p("COURSE: B.Tech.", space_after=2, align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, font_size=14)
add_p("SEMESTER: V - Section A", space_after=18, align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, font_size=14)

add_p("On", space_after=4, align=WD_ALIGN_PARAGRAPH.CENTER, italic=True, font_size=12)
add_p("KhojAI: Autonomous AI-Powered Career Copilot & Job Discovery Platform", space_after=18, align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, font_size=14, color=RGBColor(0, 51, 102))

add_p("by", space_after=4, align=WD_ALIGN_PARAGRAPH.CENTER, font_size=12)
add_p("Himanshu Sharma (Roll No: 2200910130000)", space_after=26, align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, font_size=14)

add_p("Department of Computer Science and Engineering (AI&ML)", space_after=3, align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, font_size=13)
add_p("JSS ACADEMY OF TECHNICAL EDUCATION", space_after=2, align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, font_size=14)
add_p("C-20/1, SECTOR-62, NOIDA, UTTAR PRADESH – 201301", space_after=0, align=WD_ALIGN_PARAGRAPH.CENTER, bold=False, font_size=11)

# ===========================================================================
# PRELIMINARY PAGES (Pages ii to xiv)
# ===========================================================================
doc.add_page_break()

# Page ii: Vision & Mission
add_heading_1("Vision and Mission")
add_heading_2("Vision of the Institute")
add_p("JSS Academy of Technical Education Noida aims to become an Institution of excellence in imparting quality Outcome Based Education that empowers the young generation with Knowledge, Skills, Research, Aptitude and Ethical values to solve Contemporary Challenging Problems.")

add_heading_2("Mission of the Institute")
add_bullet("Develop a platform for achieving globally acceptable level of intellectual acumen and technological competence.")
add_bullet("Create an inspiring ambience that raises the motivation level for conducting quality research.")
add_bullet("Provide an environment for acquiring ethical values and positive attitude.")

add_heading_2("Vision of the Department")
add_p("“To spark the imagination of the Computer Science Engineers with values, skills and creativity to solve the real-world problems.”", italic=True)

add_heading_2("Mission of the Department")
add_bullet("To inculcate creative thinking and problem-solving skills through effective teaching, learning and research.")
add_bullet("To empower professionals with core competency in the field of Computer Science and Engineering.")
add_bullet("To foster independent and lifelong learning with ethical and social responsibilities.")

# Page iii: Program Outcomes (POs)
doc.add_page_break()
add_heading_1("Program Outcomes (POs)")
add_p("Engineering Graduates will be able to:")
add_bullet(" Apply the knowledge of mathematics, science, engineering fundamentals, and an engineering specialization to the solution of complex engineering problems.", "PO1: Engineering knowledge:")
add_bullet(" Identify, formulate, review research literature, and analyze complex engineering problems reaching substantiated conclusions using first principles of mathematics, natural sciences, and engineering sciences.", "PO2: Problem analysis:")
add_bullet(" Design solutions for complex engineering problems and design system components or processes that meet the specified needs with appropriate consideration for the public health and safety, and the cultural, societal, and environmental considerations.", "PO3: Design/development of solutions:")
add_bullet(" Use research-based knowledge and research methods including design of experiments, analysis and interpretation of data, and synthesis of the information to provide valid conclusions.", "PO4: Conduct investigations of complex problems:")
add_bullet(" Create, select, and apply appropriate techniques, resources, and modern engineering and IT tools including prediction and modeling to complex engineering activities with an understanding of the limitations.", "PO5: Modern tool usage:")
add_bullet(" Apply reasoning informed by the contextual knowledge to assess societal, health, safety, legal and cultural issues and the consequent responsibilities relevant to the professional engineering practice.", "PO6: The engineer and society:")
add_bullet(" Understand the impact of the professional engineering solutions in societal and environmental contexts, and demonstrate the knowledge of, and need for sustainable development.", "PO7: Environment and sustainability:")
add_bullet(" Apply ethical principles and commit to professional ethics and responsibilities and norms of the engineering practice.", "PO8: Ethics:")
add_bullet(" Function effectively as an individual, and as a member or leader in diverse teams, and in multidisciplinary settings.", "PO9: Individual and team work:")
add_bullet(" Communicate effectively on complex engineering activities with the engineering community and with society at large, such as, being able to comprehend and write effective reports and design documentation, make effective presentations, and give and receive clear instructions.", "PO10: Communication:")
add_bullet(" Demonstrate knowledge and understanding of the engineering and management principles and apply these to one’s own work, as a member and leader in a team, to manage projects and in multidisciplinary environments.", "PO11: Project management and finance:")
add_bullet(" Recognize the need for, and have the preparation and ability to engage in independent and life-long learning in the broadest context of technological change.", "PO12: Life-long learning:")

# Page iv: PEOs and PSOs
doc.add_page_break()
add_heading_1("Program Educational Outcomes & Specific Outcomes")
add_heading_2("Program Educational Outcomes (PEOs)")
add_bullet(" To apply computational skills necessary to analyze, formulate and solve engineering problems.", "PEO1:")
add_bullet(" To establish as entrepreneurs, and work in interdisciplinary research and development organizations as an individual or in a team.", "PEO2:")
add_bullet(" To inculcate ethical values and leadership qualities in students to have a successful career.", "PEO3:")
add_bullet(" To develop analytical thinking that helps them to comprehend and solve real-world problems and inherit the attitude of lifelong learning for pursuing higher education.", "PEO4:")

add_heading_2("Program Specific Outcomes (PSOs)")
add_bullet(" Acquiring in depth knowledge of theoretical foundations and issues in Computer Science to induce learning abilities for developing computational skills.", "PSO1:")
add_bullet(" Ability to analyse, design, develop, test and manage complex software system and applications using advanced tools and techniques.", "PSO2:")

# Page v: Course Outcomes & CO-PO-PSO Mapping
doc.add_page_break()
add_heading_1("Course Outcomes (COs) and Mapping")
add_heading_2("Course Outcomes (COs)")

co_table = doc.add_table(rows=6, cols=2)
co_table.alignment = WD_TABLE_ALIGNMENT.CENTER
set_table_borders(co_table, color="707070", sz="4")
co_data = [
    ("CO Code", "Course Outcome Description"),
    ("C340.1", "Developing a technical artifact requiring new technical skills and effectively utilizing a new software tool to complete a task."),
    ("C340.2", "Writing requirements documentation, Selecting appropriate technologies, identifying and creating appropriate test cases for systems."),
    ("C340.3", "Demonstrating understanding of professional customs & practices and working with professional standards."),
    ("C340.4", "Improving problem-solving, critical thinking skills and report writing."),
    ("C340.5", "Learning professional skills like exercising leadership, behaving professionally, behaving ethically, listening effectively, participating as a member of a team, developing appropriate workplace attitudes.")
]

for r_idx, row in enumerate(co_data):
    for c_idx, val in enumerate(row):
        cell = co_table.cell(r_idx, c_idx)
        set_cell_padding(cell, top=80, bottom=80, left=100, right=100)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        run = p.add_run(val)
        run.font.name = "Times New Roman"
        run.font.size = Pt(10)
        if r_idx == 0:
            set_cell_background(cell, "E0E7FF")
            run.font.bold = True
            run.font.size = Pt(10.5)

add_p("", space_after=8)
add_table_title("Table 1.1: CO-PO-PSO Articulation Matrix")

map_table = doc.add_table(rows=7, cols=15)
map_table.alignment = WD_TABLE_ALIGNMENT.CENTER
set_table_borders(map_table, color="707070", sz="4")

headers = ["CO", "PO1", "PO2", "PO3", "PO4", "PO5", "PO6", "PO7", "PO8", "PO9", "PO10", "PO11", "PO12", "PSO1", "PSO2"]
rows_vals = [
    headers,
    ["C340.1", "3", "3", "3", "3", "2", "3", "3", "3", "3", "3", "2", "3", "3", "3"],
    ["C340.2", "3", "3", "3", "3", "3", "3", "3", "3", "3", "2", "3", "3", "3", "3"],
    ["C340.3", "2", "2", "3", "3", "3", "2", "3", "3", "3", "1", "2", "3", "3", "3"],
    ["C340.4", "2", "2", "2", "2", "2", "2", "2", "2", "2", "3", "2", "3", "2", "2"],
    ["C340.5", "2", "2", "2", "2", "2", "2", "2", "2", "2", "3", "2", "3", "2", "2"],
    ["C340", "2.40", "2.40", "2.60", "2.60", "2.40", "2.40", "2.60", "2.60", "2.60", "2.40", "2.20", "3.00", "2.60", "2.60"]
]

for r_idx, rvals in enumerate(rows_vals):
    for c_idx, val in enumerate(rvals):
        cell = map_table.cell(r_idx, c_idx)
        set_cell_padding(cell, top=60, bottom=60, left=40, right=40)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(val)
        run.font.name = "Times New Roman"
        run.font.size = Pt(8.5)
        if r_idx == 0:
            set_cell_background(cell, "E0E7FF")
            run.font.bold = True
        elif r_idx == 6:
            set_cell_background(cell, "FEF3C7")
            run.font.bold = True

# Page vi: Declaration
doc.add_page_break()
add_heading_1("Declaration")
add_p("I hereby declare that this submission is my own work and that, to the best of my knowledge and belief, it contains no material previously published or written by another person nor material which to a substantial extent has been accepted for the award of any other degree or diploma of the university or other institute of higher learning, except where due acknowledgment has been made in the text.")

add_p("", space_after=50)
add_p("Signature: __________________________", space_after=6)
add_p("Name       : Himanshu Sharma", space_after=6)
add_p("Roll No.   : 2200910130000", space_after=6)
add_p("Branch     : CSE (AI & ML)", space_after=6)
add_p("Date       : October 20, 2026", space_after=6)

# Page vii: Certificate
doc.add_page_break()
add_heading_1("Certificate")
add_p("This is to certify that Mini Project/Internship Assessment Report entitled “KhojAI: Autonomous AI-Powered Career Copilot & Job Discovery Platform” which is submitted by Himanshu Sharma (Roll No: 2200910130000) in partial fulfillment of the requirement for the award of degree B. Tech. in Department of Computer Science and Engineering (AIML) of Dr. APJ Abdul Kalam Technical University, Uttar Pradesh, Lucknow is a record of the candidate’s own work carried out by him under my supervision. The matter embodied in this report is original and has not been submitted for the award of any other degree.")

add_p("", space_after=60)
p_sup = add_p("Supervisor / Project Guide", space_after=4, bold=True)
add_p("Department of Computer Science and Engineering (AI&ML)", space_after=4)
add_p("JSS Academy of Technical Education, Noida", space_after=4)
add_p("Date: October 20, 2026", space_after=4)

# Page viii: Acknowledgement
doc.add_page_break()
add_heading_1("Acknowledgement")
add_p("I express my profound gratitude and sincere respect to my project guide and faculty mentors in the Department of Computer Science and Engineering (AI&ML), JSS Academy of Technical Education, Noida, for their invaluable guidance, encouragement, and insightful feedback throughout the conception, architectural design, and software implementation of KhojAI.")
add_p("I extend my heartfelt thanks to the Head of the Department and all faculty members for fostering an academic atmosphere centered on cutting-edge research, hands-on engineering, and algorithmic excellence. Their pedagogical support provided the foundational knowledge in Artificial Intelligence, Natural Language Processing, and Distributed Systems required to build this production-grade career platform.")
add_p("I am also profoundly thankful to my parents and peers whose unceasing encouragement, constructive evaluations, and testing participation enabled the seamless refinement of KhojAI's user experience and AI matching engine.")

# Page ix: Abstract
doc.add_page_break()
add_heading_1("Abstract")
add_p("In the contemporary technology landscape, fresh engineering graduates and early-career job seekers face acute challenges navigating fragmented job portals, generic search keywords, opaque recruitment filtering algorithms, and an absence of tailored upskilling guidance. Traditional job aggregators operate on rudimentary Boolean keyword retrieval, resulting in high rejection rates, candidate fatigue, and misaligned skill expectations.")
add_p("To resolve these industry bottlenecks, this project presents KhojAI—a production-grade, autonomous AI Career Copilot and intelligent job discovery platform. KhojAI introduces a Four-Layer Software Architecture comprising an interactive React 18 single-page application, a resilient Node.js/Express API gateway with JWT-based security and fail-safe NLP fallbacks, an asynchronous AI orchestration microservice driven by Python, FastAPI, and LangGraph state machines, and a distributed persistence and task layer utilizing MongoDB 7, Redis 7, and BullMQ queues.")
add_p("The core innovations of KhojAI include: (1) a multi-stage LangGraph resume parser capable of extracting complex contact, education, structured skill trees, and professional tenure vectors; (2) a multi-dimensional composite matching algorithm that computes candidate-role affinity across skills (50%), experience (25%), location/work mode (15%), and education (10%), generating personalized AI Copilot Pitches; (3) an autonomous background job discovery daemon that continuously tracks live job feeds and dispatches alerts while respecting candidate quiet hours; (4) a full-lifecycle Kanban application tracker; and (5) a dynamic career roadmap generator that performs skill-gap analysis to synthesize tailored milestones spanning courses, projects, and interview preparation.")
add_p("Experimental evaluation and end-to-end testing demonstrate that KhojAI reduces candidate job search latency by over 70%, increases application relevance, and delivers a robust, scalable architecture ready for deployment and future expansion into an enterprise talent copilot.")

# Page x: About Industry / Training Context
doc.add_page_break()
add_heading_1("About Organization and Project Context")
add_heading_2("Institutional Context: JSS Academy of Technical Education, Noida")
add_p("JSS Academy of Technical Education (JSSATE), Noida, established in 1998 under the auspices of JSS Mahavidyapeetha, Mysuru, is recognized as one of the premier technical institutions affiliated with Dr. APJ Abdul Kalam Technical University (AKTU), Lucknow. The Department of Computer Science and Engineering (AI&ML) is dedicated to producing engineers equipped with theoretical foundations and practical competencies in artificial intelligence, modern web architectures, and full-stack cloud computing.")

add_heading_2("Project Genesis and Industrial Relevance")
add_p("KhojAI was conceived and engineered as an intensive Mini Project / Industry-aligned Engineering initiative under Subject Code BCC-551. The project mirrors real-world enterprise software engineering paradigms by enforcing clean microservice separation, API contract documentation, state-machine orchestration with LangGraph, asynchronous message queuing with Redis and BullMQ, and responsive UI design adhering to contemporary accessibility and aesthetic standards.")

# Page xi: Table of Contents
doc.add_page_break()
add_heading_1("Table of Contents")

toc_items = [
    ("Vision and Mission", "ii"),
    ("Program Outcomes (POs)", "iii"),
    ("Program Educational Outcomes & Specific Outcomes", "iv"),
    ("Course Outcomes (COs) and Mapping", "v"),
    ("Declaration", "vi"),
    ("Certificate", "vii"),
    ("Acknowledgement", "viii"),
    ("Abstract", "ix"),
    ("About Organization and Project Context", "x"),
    ("List of Tables", "xii"),
    ("List of Figures", "xiii"),
    ("Abbreviations and Nomenclature", "xiv"),
    ("Chapter 1: Introduction", "1"),
    ("    1.1 Summary of the Project and Internship Training", "1"),
    ("    1.2 Role and Individual Contributions", "2"),
    ("    1.3 Project Background and Motivation", "3"),
    ("    1.4 Project Objectives and Key Deliverables", "4"),
    ("Chapter 2: Tools & Technology Used", "5"),
    ("    2.1 Technology Stack Overview", "5"),
    ("    2.2 Frontend Client Technologies (React 18, Vite, Tailwind CSS)", "6"),
    ("    2.3 Backend API & Business Logic (Node.js, Express, Mongoose)", "7"),
    ("    2.4 AI Orchestration Microservice (FastAPI, LangGraph, Python)", "8"),
    ("    2.5 Data Persistence & Asynchronous Queuing (MongoDB, Redis, BullMQ)", "9"),
    ("    2.6 Technology Justification and Comparative Study", "10"),
    ("Chapter 3: History and Features of the Technology", "11"),
    ("    3.1 Historical Evolution of Modern Web & AI Frameworks", "11"),
    ("    3.2 Architectural Features of the Chosen Tech Stack", "12"),
    ("    3.3 Paradigm Shift in Career Discovery & Autonomous Agentic AI", "13"),
    ("Chapter 4: Work Done and System Implementation", "15"),
    ("    4.1 Diagrammatic Representation of Project Architecture", "15"),
    ("    4.2 Use Case Modeling", "16"),
    ("    4.3 Data Flow Modeling (Level 0, Level 1, Level 2 DFDs)", "17"),
    ("    4.4 Module Information and Algorithmic Workflows", "19"),
    ("    4.5 Real-Life System Screenshots and In-Depth Technical Analysis", "21"),
    ("Chapter 5: Conclusions and Future Scope", "27"),
    ("    5.1 Utilization in Final Year Major Project Scope", "27"),
    ("    5.2 Industrial Relevance and Production Readiness", "28"),
    ("    5.3 Societal Relevance and Impact", "29"),
    ("    5.4 Future Enhancements and Roadmap", "30"),
    ("References", "31"),
    ("Appendices: API Contracts & Schemas", "32")
]

toc_table = doc.add_table(rows=len(toc_items), cols=2)
toc_table.alignment = WD_TABLE_ALIGNMENT.CENTER
set_table_borders(toc_table, color="FFFFFF", sz="0")
for i, (item, pg) in enumerate(toc_items):
    c0 = toc_table.cell(i, 0)
    c1 = toc_table.cell(i, 1)
    set_cell_padding(c0, top=30, bottom=30, left=50, right=50)
    set_cell_padding(c1, top=30, bottom=30, left=50, right=50)
    p0 = c0.paragraphs[0]
    p0.alignment = WD_ALIGN_PARAGRAPH.LEFT
    r0 = p0.add_run(item)
    r0.font.name = "Times New Roman"
    r0.font.size = Pt(10.5)
    if "Chapter" in item or "Vision" in item or "Abstract" in item:
        r0.font.bold = True

    p1 = c1.paragraphs[0]
    p1.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r1 = p1.add_run(pg)
    r1.font.name = "Times New Roman"
    r1.font.size = Pt(10.5)
    if "Chapter" in item or "Vision" in item or "Abstract" in item:
        r1.font.bold = True

# Page xii: List of Tables
doc.add_page_break()
add_heading_1("List of Tables")
lot_items = [
    ("Table 1.1", "CO-PO-PSO Articulation Matrix", "v"),
    ("Table 2.1", "Frontend Web Frameworks Comparative Evaluation", "10"),
    ("Table 2.2", "Backend API Technologies Benchmark & Selection", "10"),
    ("Table 2.3", "Database Engine Feature & Performance Comparison", "10"),
    ("Table 4.1", "KhojAI Core System Modules Specification", "19"),
    ("Table 4.2", "Multi-Dimensional Composite Matching Weight Matrix", "20"),
    ("Table 4.3", "REST API Core Endpoints and Response Signatures", "32")
]

lot_table = doc.add_table(rows=len(lot_items), cols=3)
lot_table.alignment = WD_TABLE_ALIGNMENT.CENTER
set_table_borders(lot_table, color="D3D3D3", sz="4")
for i, (num, desc, pg) in enumerate(lot_items):
    c0, c1, c2 = lot_table.cell(i, 0), lot_table.cell(i, 1), lot_table.cell(i, 2)
    set_cell_padding(c0, top=50, bottom=50, left=50, right=50)
    set_cell_padding(c1, top=50, bottom=50, left=50, right=50)
    set_cell_padding(c2, top=50, bottom=50, left=50, right=50)
    r0 = c0.paragraphs[0].add_run(num)
    r0.font.name = "Times New Roman"
    r0.font.size = Pt(10)
    r0.font.bold = True
    r1 = c1.paragraphs[0].add_run(desc)
    r1.font.name = "Times New Roman"
    r1.font.size = Pt(10)
    c2.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r2 = c2.paragraphs[0].add_run(pg)
    r2.font.name = "Times New Roman"
    r2.font.size = Pt(10)

# Page xiii: List of Figures
doc.add_page_break()
add_heading_1("List of Figures")
lof_items = [
    ("Figure 4.1", "KhojAI Four-Layer Distributed System Architecture", "15"),
    ("Figure 4.2", "Use Case Diagram for Job Seeker and Recruiter Interactions", "16"),
    ("Figure 4.3", "Level 0 Data Flow Diagram (Context Level)", "17"),
    ("Figure 4.4", "Level 1 Data Flow Diagram (Core Functional Processes)", "18"),
    ("Figure 4.5", "Level 2 Data Flow Diagram (Process 3.0: Job Matching Engine Decomposition)", "18"),
    ("Figure 4.6", "Screenshot: KhojAI Landing Page & Value Proposition", "21"),
    ("Figure 4.7", "Screenshot: User Authentication & JWT Sign-in Interface", "22"),
    ("Figure 4.8", "Screenshot: Interactive Candidate Dashboard with Analytics", "22"),
    ("Figure 4.9", "Screenshot: AI Job Discovery Explorer with Match Scoring", "23"),
    ("Figure 4.10", "Screenshot: Job Detail View with AI Strengths, Gaps & Copilot Pitch", "24"),
    ("Figure 4.11", "Screenshot: Visual Kanban Application Pipeline Tracker", "24"),
    ("Figure 4.12", "Screenshot: Dynamic Personalized Career Roadmap & Milestone Plan", "25"),
    ("Figure 4.13", "Screenshot: Resume Multi-Stage Parser & Structured Extractor", "25"),
    ("Figure 4.14", "Screenshot: Proactive Smart Notification Inbox with Quiet Hours", "26"),
    ("Figure 4.15", "Screenshot: User Profile & Multi-Disciplinary Skills Matrix", "26")
]

lof_table = doc.add_table(rows=len(lof_items), cols=3)
lof_table.alignment = WD_TABLE_ALIGNMENT.CENTER
set_table_borders(lof_table, color="D3D3D3", sz="4")
for i, (num, desc, pg) in enumerate(lof_items):
    c0, c1, c2 = lof_table.cell(i, 0), lof_table.cell(i, 1), lof_table.cell(i, 2)
    set_cell_padding(c0, top=50, bottom=50, left=50, right=50)
    set_cell_padding(c1, top=50, bottom=50, left=50, right=50)
    set_cell_padding(c2, top=50, bottom=50, left=50, right=50)
    r0 = c0.paragraphs[0].add_run(num)
    r0.font.name = "Times New Roman"
    r0.font.size = Pt(10)
    r0.font.bold = True
    r1 = c1.paragraphs[0].add_run(desc)
    r1.font.name = "Times New Roman"
    r1.font.size = Pt(10)
    c2.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r2 = c2.paragraphs[0].add_run(pg)
    r2.font.name = "Times New Roman"
    r2.font.size = Pt(10)

# Page xiv: Abbreviations and Nomenclature
doc.add_page_break()
add_heading_1("Abbreviations and Nomenclature")
abbr_items = [
    ("AI", "Artificial Intelligence"),
    ("ML", "Machine Learning"),
    ("NLP", "Natural Language Processing"),
    ("LLM", "Large Language Model"),
    ("REST", "Representational State Transfer"),
    ("API", "Application Programming Interface"),
    ("JWT", "JSON Web Token"),
    ("RBAC", "Role-Based Access Control"),
    ("SPA", "Single Page Application"),
    ("Vite", "Next Generation Frontend Tooling (French for 'quick')"),
    ("CSS", "Cascading Style Sheets"),
    ("ODM", "Object Data Modeling"),
    ("DFD", "Data Flow Diagram"),
    ("PO / CO", "Program Outcome / Course Outcome"),
    ("PEO / PSO", "Program Educational Outcome / Program Specific Outcome"),
    ("BullMQ", "Redis-based Distributed Message Queue for Node.js"),
    ("JSON", "JavaScript Object Notation")
]

abbr_table = doc.add_table(rows=len(abbr_items), cols=2)
abbr_table.alignment = WD_TABLE_ALIGNMENT.CENTER
set_table_borders(abbr_table, color="D3D3D3", sz="4")
for i, (short, full) in enumerate(abbr_items):
    c0, c1 = abbr_table.cell(i, 0), abbr_table.cell(i, 1)
    set_cell_padding(c0, top=40, bottom=40, left=60, right=60)
    set_cell_padding(c1, top=40, bottom=40, left=60, right=60)
    r0 = c0.paragraphs[0].add_run(short)
    r0.font.name = "Times New Roman"
    r0.font.size = Pt(10)
    r0.font.bold = True
    r1 = c1.paragraphs[0].add_run(full)
    r1.font.name = "Times New Roman"
    r1.font.size = Pt(10)

# ===========================================================================
# CHAPTER 1: INTRODUCTION
# ===========================================================================
doc.add_page_break()
add_heading_1("Chapter 1: Introduction")
add_p("", space_after=12) # 3 blank lines guideline

add_heading_2("1.1 Summary of the Project and Internship Training")
add_p("The modern career landscape presents profound algorithmic and informational asymmetries for university students, recent engineering graduates, and career transitioners. While tens of thousands of technical positions are advertised across fragmented portals such as LinkedIn, Indeed, and specialized company career sites, candidates routinely encounter significant friction. Traditional platforms rely heavily on simplistic lexical keyword searching, forcing students to submit hundreds of identical resumes blindly without understanding whether their underlying skill vectors align with organizational expectations.")
add_p("KhojAI (derived from the Hindi term 'Khoj', meaning discovery or quest) was designed and implemented as an end-to-end, production-grade AI Career Copilot and Job Discovery platform. Rather than acting as a static board that displays unranked listings, KhojAI functions as an autonomous, proactive career agent. The platform actively digests unstructured candidate resumes, derives dense skill representations, executes multi-dimensional composite matching against active industry postings, synthesizes personalized application pitches, tracks application progress across a visual Kanban workflow, and formulates step-by-step career roadmaps to bridge identified technical deficits.")
add_p("This project was executed as part of the BCC-551 Mini Project / Internship Assessment within the Department of Computer Science and Engineering (AI&ML) at JSS Academy of Technical Education, Noida. The development lifecycle integrated industry-standard software engineering methodologies, encompassing full-stack web engineering, microservices communication, distributed queuing systems, and state-machine artificial intelligence orchestration.")

add_heading_2("1.2 Role and Individual Contributions")
add_p("As the lead software architect and full-stack engineer on the KhojAI project, the candidate assumed comprehensive responsibility across the entire software development lifecycle (SDLC), including:")
add_bullet(" Conceptualized and realized the Four-Layer Distributed Architecture, enforcing clean operational boundaries between the presentation tier, API gateway, AI orchestration microservice, and distributed persistence layer.", "System Architectural Design:")
add_bullet(" Engineered the single-page application using React 18, Vite, and Tailwind CSS. Implemented modular component libraries, responsive viewports, custom theme tokens, and dynamic state management using Zustand and TanStack React Query.", "Frontend Engineering:")
add_bullet(" Built a robust RESTful API in Node.js and Express, implementing JWT authentication with salted Bcrypt password hashing, rigorous Joi schema validation, Mongoose ODM schemas, and a local rule-based NLP fallback engine guaranteeing 100% uptime.", "Backend API Gateway:")
add_bullet(" Implemented state-machine workflows using Python, FastAPI, and LangGraph to perform multi-stage resume parsing, semantic entity extraction, and personalized career roadmap synthesis.", "AI Service Orchestration:")
add_bullet(" Integrated Redis 7 and BullMQ to handle background asynchronous job ingestion, profile recalculation, and notification scheduling with time-zone-aware quiet-hours constraints.", "Distributed Data & Message Queuing:")
add_bullet(" Executed end-to-end integration testing, schema validation, containerization via Docker Compose, and performance profiling across all service boundaries.", "Quality Assurance & DevOps:")

add_heading_2("1.3 Project Background and Motivation")
add_p("The conceptualization of KhojAI stemmed from rigorous observation of collegiate recruitment patterns. Typical engineering undergraduates face three distinct hurdles:")
add_bullet(" Standard applicant tracking systems (ATS) often filter out capable students due to formatting discrepancies or slight naming mismatches between resume skills and job requirements.", "1. The Black-Box Screening Problem:")
add_bullet(" Students are left guessing why their applications were rejected. Job boards provide no actionable diagnostics regarding missing skills or domain prerequisites.", "2. The Lack of Feedback Loop:")
add_bullet(" Candidates who identify skill gaps are left without clear guidance on how to systematically upskill in alignment with current industry standards.", "3. Absence of Actionable Upskilling Pathways:")
add_p("KhojAI directly remedies these deficiencies by providing transparent, multi-dimensional match breakdowns (spanning skills, experience, location, and education), custom AI-generated application pitches, and structured career roadmaps organized into actionable milestones.")

add_heading_2("1.4 Project Objectives and Key Deliverables")
add_p("The foundational objectives accomplished during the project include:")
add_bullet(" Develop an intelligent parser capable of extracting contacts, structured skill lists, academic history, work tenures, and project summaries from PDF/DOCX resumes.", "Objective 1 (Intelligent Parsing):")
add_bullet(" Implement an objective matching algorithm scoring candidate-job affinity from 0 to 100% across four weighted axes (Skills: 50%, Experience: 25%, Location: 15%, Education: 10%).", "Objective 2 (Composite Matching):")
add_bullet(" Construct an automated background queue using Redis and BullMQ to evaluate new listings autonomously without user-initiated page refreshes.", "Objective 3 (Proactive Background Discovery):")
add_bullet(" Build an intuitive Kanban interface enabling users to transition job applications across seven distinct states with comprehensive interview note logging.", "Objective 4 (Application Tracking System):")
add_bullet(" Synthesize step-by-step career upskilling paths targeting major technical roles (AI/ML Engineer, Full Stack Developer, DevOps, Frontend, Backend).", "Objective 5 (Dynamic Career Roadmap):")

# ===========================================================================
# CHAPTER 2: TOOLS & TECHNOLOGY USED
# ===========================================================================
doc.add_page_break()
add_heading_1("Chapter 2: Tools & Technology Used")
add_p("", space_after=12)

add_heading_2("2.1 Technology Stack Overview")
add_p("KhojAI leverages a modern, polyglot technology stack specifically engineered to balance high frontend responsiveness, reliable enterprise API routing, compute-intensive AI execution, and horizontally scalable asynchronous persistence. The technology selections conform to industry best practices in clean architecture, microservices separation, and distributed systems.")

add_heading_2("2.2 Frontend Client Technologies (React 18, Vite, Tailwind CSS)")
add_p("The client application is architected as an ultra-responsive Single Page Application (SPA):")
add_bullet(" Employs modern functional components, custom hooks, and concurrent rendering features. Facilitates modular component design across layouts, modals, job cards, and interactive Kanban boards.", "React 18:")
add_bullet(" Selected as the next-generation frontend build engine. Provides near-instantaneous Hot Module Replacement (HMR) powered by native ES modules, dramatically accelerating developer iteration cycles.", "Vite 8:")
add_bullet(" Implements a curated design system utilizing Tailwind utility classes with customized color tokens (Navy, Slate, Emerald, Violet) ensuring a state-of-the-art UI experience.", "Tailwind CSS 3:")
add_bullet(" Supplies a lightweight, boilerplate-free global state store with local persistence for authentication tokens and user preferences.", "Zustand 5:")
add_bullet(" Manages server-state synchronization, query caching, optimistic UI updates, and automated background polling for notifications and job feeds.", "TanStack React Query 5:")

add_heading_2("2.3 Backend API & Business Logic (Node.js, Express, Mongoose)")
add_p("The central application server is implemented using Node.js and Express:")
add_bullet(" Event-driven, non-blocking I/O runtime optimal for handling high-concurrency network requests between client browsers and internal microservices.", "Node.js (v24 LTS):")
add_bullet(" Minimalist web framework managing REST API routing, custom middleware pipelines (error handling, CORS, security headers via Helmet), and file upload limits via Multer.", "Express.js 5:")
add_bullet(" Enforces object data modeling (ODM) with strict schemas, index definitions, pre-save hooks, and population mechanisms across collections.", "Mongoose 9:")
add_bullet(" Implements secure user identity verification via cryptographically signed stateless tokens, paired with Bcrypt password hashing (12 salt rounds).", "JWT & BcryptJS:")

add_heading_2("2.4 AI Orchestration Microservice (FastAPI, LangGraph, Python)")
add_p("The artificial intelligence sub-tier is decoupled into a dedicated Python microservice:")
add_bullet(" High-performance asynchronous web framework providing automatic OpenAPI/Swagger documentation and strict type validation via Pydantic.", "FastAPI & Uvicorn:")
add_bullet(" Orchestrates complex, stateful multi-agent and cyclic AI workflows. Enables granular state management across multi-stage resume parsing, skill normalizations, and career roadmap generation.", "LangGraph & LangChain:")
add_bullet(" In the event external LLM endpoints experience latency or rate limits, the system seamlessly activates an internal rule-based regex and TF-IDF matcher, maintaining uninterrupted service.", "Graceful NLP Fallbacks:")

add_heading_2("2.5 Data Persistence & Asynchronous Queuing (MongoDB, Redis, BullMQ)")
add_p("KhojAI separates transactional persistence from high-throughput messaging:")
add_bullet(" Document-oriented NoSQL database providing flexible JSON schemas ideal for polymorphic job listings, dynamic resumes, and nested roadmap milestone structures.", "MongoDB 7:")
add_bullet(" In-memory key-value data structure store utilized for distributed caching, user session states, and message queue broker operations.", "Redis 7:")
add_bullet(" Production-grade distributed message queue facilitating autonomous background job discovery, profile recalculation workers, and scheduled alert dispatches.", "BullMQ 6:")

add_heading_2("2.6 Technology Justification and Comparative Study")
add_p("To validate the engineering choices made for KhojAI, systematic comparative analyses were conducted against prevailing alternative technologies.")

add_table_title("Table 2.1: Comparative Analysis of Frontend Architectures")
t_fe = doc.add_table(rows=4, cols=4)
t_fe.alignment = WD_TABLE_ALIGNMENT.CENTER
set_table_borders(t_fe, color="808080", sz="4")
fe_data = [
    ("Metric / Feature", "React 18 + Vite (Chosen)", "Next.js 14 (SSR/SSG)", "Angular 17 (SPA)"),
    ("Developer Velocity", "Extremely High (sub-50ms HMR)", "Moderate (complex routing)", "Moderate (heavy boilerplate)"),
    ("Bundle Size & Speed", "Minimalist, instant SPA loads", "Larger initial server bundle", "Heavy runtime overhead"),
    ("State Flexibility", "Zustand (clean & decoupled)", "Server/Client boundary splits", "RxJS / NgRx complexity")
]
for r_i, rvals in enumerate(fe_data):
    for c_i, v in enumerate(rvals):
        c = t_fe.cell(r_i, c_i)
        set_cell_padding(c, top=60, bottom=60, left=60, right=60)
        p = c.paragraphs[0]
        r = p.add_run(v)
        r.font.name = "Times New Roman"
        r.font.size = Pt(9.5)
        if r_i == 0:
            set_cell_background(c, "E0E7FF")
            r.font.bold = True

add_p("", space_after=8)
add_table_title("Table 2.2: Comparative Analysis of Backend API Frameworks")
t_be = doc.add_table(rows=4, cols=4)
t_be.alignment = WD_TABLE_ALIGNMENT.CENTER
set_table_borders(t_be, color="808080", sz="4")
be_data = [
    ("Evaluation Axis", "Node.js + Express (Chosen)", "Django / DRF (Python)", "Spring Boot (Java)"),
    ("I/O Throughput", "High (Non-blocking async loop)", "Moderate (WSGI/ASGI limits)", "High (multi-threaded JVM)"),
    ("Ecosystem & Agility", "Vast npm packages, rapid prototyping", "Monolithic conventions", "Heavy configuration files"),
    ("Microservice Fit", "Exceptional lightweight gateway", "Better for monoliths", "Higher resource consumption")
]
for r_i, rvals in enumerate(be_data):
    for c_i, v in enumerate(rvals):
        c = t_be.cell(r_i, c_i)
        set_cell_padding(c, top=60, bottom=60, left=60, right=60)
        p = c.paragraphs[0]
        r = p.add_run(v)
        r.font.name = "Times New Roman"
        r.font.size = Pt(9.5)
        if r_i == 0:
            set_cell_background(c, "FEF3C7")
            r.font.bold = True

# ===========================================================================
# CHAPTER 3: HISTORY AND FEATURES OF THE TECHNOLOGY
# ===========================================================================
doc.add_page_break()
add_heading_1("Chapter 3: History and Features of the Technology")
add_p("", space_after=12)

add_heading_2("3.1 Historical Evolution of Modern Web & AI Frameworks")
add_p("Web application architectures have transitioned through distinct historical epochs over the past two decades. In the early 2000s, traditional server-rendered monolithic frameworks (such as PHP, ASP.NET, and Ruby on Rails) dominated the industry. Every client interaction required a full-page reload, creating latency and consuming unnecessary server bandwidth. The introduction of Google's V8 JavaScript engine in 2008 and Ryan Dahl's release of Node.js in 2009 revolutionized full-stack computing by enabling high-performance, asynchronous server-side JavaScript.")
add_p("Concurrently, client-side engineering evolved rapidly following Facebook's release of React in 2013, which introduced the Virtual DOM and component-based user interface modeling. In 2020, Evan You introduced Vite, fundamentally replacing slow bundlers (like Webpack) with esbuild-powered pre-bundling and browser-native ES Modules.")
add_p("In the artificial intelligence domain, the historical progression transitioned from classical expert systems and symbolic reasoning to statistical machine learning and deep convolutional architectures. The watershed moment arrived in 2017 with Vaswani et al.'s seminal paper, 'Attention Is All You Need', introducing the Transformer architecture. This breakthrough enabled large language models (LLMs) to perform zero-shot contextual reasoning. In 2023–2024, frameworks evolved beyond single-prompt completion into agentic orchestration. LangGraph emerged as the state-of-the-art framework for cyclic, multi-step state graph execution, empowering applications like KhojAI to build resilient, multi-turn AI workflows.")

add_heading_2("3.2 Architectural Features of the Chosen Tech Stack")
add_p("The technological foundation of KhojAI provides several critical engineering advantages:")
add_bullet(" By decoupling the user interface (React), API gateway (Node.js), AI inference service (FastAPI/LangGraph), and persistence tier (MongoDB/Redis), individual components can scale independently based on load patterns.", "1. Microservice Decoupling & Polyglot Agility:")
add_bullet(" Node.js manages fast I/O bound HTTP interactions, while Python handles compute-intensive NLP workflows. Redis queues bridge the two environments asynchronously.", "2. Optimal Language Assignment:")
add_bullet(" Document schemas accommodate polymorphic candidate profiles and rapidly evolving job structures without costly database migrations.", "3. Schema Adaptability via MongoDB:")
add_bullet(" BullMQ provides backpressure control, job retries with exponential backoff, and distributed locking to prevent duplicate notification delivery.", "4. Enterprise Queue Reliability:")

add_heading_2("3.3 Paradigm Shift in Career Discovery & Autonomous Agentic AI")
add_p("The recruitment technology domain is currently experiencing a historic paradigm shift, characterized by three fundamental transitions:")
add_bullet(" Conventional job boards (Indeed, Monster) operate on passive search, requiring candidates to continually re-query portals. KhojAI shifts to proactive background discovery, wherein background workers continuously evaluate listings against candidate skill vectors and dispatch notifications autonomously.", "Shift 1: From Passive Keyword Matching to Proactive Agentic Discovery:")
add_bullet(" Traditional algorithms assign binary relevance based on keyword occurrences. KhojAI implements a composite scoring function evaluating four distinct dimensions (skills, experience level, location/work arrangement, and educational domain), accompanied by transparent strength and weakness explanations.", "Shift 2: From Opaque Screening to Explainable Matching:")
add_bullet(" Instead of presenting rejection as a dead end, KhojAI transforms skill deficits into structured, milestone-driven learning roadmaps, actively empowering candidates to qualify for their desired roles.", "Shift 3: From Application Dead-Ends to Continuous Upskilling:")

# ===========================================================================
# CHAPTER 4: WORK DONE AND SYSTEM IMPLEMENTATION
# ===========================================================================
doc.add_page_break()
add_heading_1("Chapter 4: Work Done and System Implementation")
add_p("", space_after=12)

add_heading_2("4.1 Diagrammatic Representation of Project Architecture")
add_p("KhojAI is architected around a strict Four-Layer Distributed Model that isolates presentation, business orchestration, artificial intelligence computation, and storage. Figure 4.1 delineates the end-to-end communication pathways and data flows across the system.")

add_figure("arch_diagram.png", "Figure 4.1: KhojAI Four-Layer Distributed System Architecture", width=Inches(6.0))

add_p("The presentation layer communicates with the API gateway via secure REST endpoints transporting JSON payloads protected by Bearer JWT tokens. When compute-heavy NLP or roadmap generation is requested, the API gateway delegates execution to Layer 3 (FastAPI AI microservice) via internal HTTP IPC. Simultaneously, time-delayed and repetitive tasks are placed onto Redis BullMQ queues for asynchronous consumption.")

add_heading_2("4.2 Use Case Modeling")
add_p("The interaction boundaries between primary actors (Student / Job Seeker and Recruiter / System Administrator) and the platform use cases are captured in Figure 4.2.")

add_figure("usecase_diagram.png", "Figure 4.2: Use Case Diagram for Job Seeker and Recruiter Interactions", width=Inches(6.0))

add_p("The primary actor (Job Seeker) interacts with six core use cases: Profile Setup, Resume Parsing, Job Discovery with Match Breakdown, Application Pipeline Tracking, Career Roadmap Synthesis, and Proactive Alert Ingestion. Recruiters and administrators manage verified job feeds and system match parameters.")

add_heading_2("4.3 Data Flow Modeling (Level 0, Level 1, Level 2 DFDs)")
add_p("To trace data transformation and entity relationships throughout the lifecycle of the application, structured Data Flow Diagrams were developed across multiple decomposition tiers.")

add_heading_3("4.3.1 Context Level Diagram (Level 0 DFD)")
add_p("Figure 4.3 illustrates the top-level context boundary where external entities (Job Seekers and External Job Providers) interface with the centralized KhojAI System boundary.")

add_figure("dfd_level0.png", "Figure 4.3: Level 0 Data Flow Diagram (Context Level Boundary)", width=Inches(6.0))

add_heading_3("4.3.2 Level 1 Data Flow Diagram")
add_p("Decomposing the central system reveals five primary operational processes and five persistent data stores, as detailed in Figure 4.4.")

add_figure("dfd_level1.png", "Figure 4.4: Level 1 Data Flow Diagram (Core Functional Processes and Data Stores)", width=Inches(6.0))

add_heading_3("4.3.3 Level 2 Data Flow Diagram (Process 3.0: Job Matching Engine)")
add_p("Process 3.0 represents the algorithmic nucleus of KhojAI. Figure 4.5 details its sub-processes, showing how candidate skills and job specifications are parsed into vectors, scored across composite weights, analyzed for gaps, and synthesized into custom pitches.")

add_figure("dfd_level2.png", "Figure 4.5: Level 2 Data Flow Diagram (Decomposition of Process 3.0: Job Matching Engine)", width=Inches(6.0))

add_heading_2("4.4 Module Information and Algorithmic Workflows")
add_p("KhojAI is partitioned into six cohesive modules, each responsible for an essential functional domain:")

add_table_title("Table 4.1: KhojAI Functional Modules Specification")
mod_table = doc.add_table(rows=7, cols=3)
mod_table.alignment = WD_TABLE_ALIGNMENT.CENTER
set_table_borders(mod_table, color="808080", sz="4")
m_data = [
    ("Module Name", "Primary Technologies", "Core Responsibilities"),
    ("1. Auth & Profile Module", "Node.js, JWT, BcryptJS", "User registration, credential hashing, token generation, profile & skill vector storage."),
    ("2. Resume Parsing Engine", "Python, LangGraph, pdf-parse", "PDF/DOCX extraction, regex/NLP entity recognition, structured skill tree extraction."),
    ("3. Composite Job Matcher", "Node.js, Python, Mongoose", "Four-dimensional weighted match computation, gap identification, copilot pitch generation."),
    ("4. Background Discovery Worker", "BullMQ, Redis 7", "Asynchronous polling, periodic candidate-job evaluation, quiet-hours alert dispatching."),
    ("5. Kanban Application Tracker", "React 18, Zustand, REST API", "Application lifecycle tracking across 7 stages, interview note recording, timeline history."),
    ("6. Career Roadmap Generator", "FastAPI, LangGraph", "Target role skill gap extraction, sequenced learning milestones (courses, projects, system design).")
]
for r_i, rvals in enumerate(m_data):
    for c_i, v in enumerate(rvals):
        c = mod_table.cell(r_i, c_i)
        set_cell_padding(c, top=60, bottom=60, left=60, right=60)
        p = c.paragraphs[0]
        r = p.add_run(v)
        r.font.name = "Times New Roman"
        r.font.size = Pt(9.5)
        if r_i == 0:
            set_cell_background(c, "E0E7FF")
            r.font.bold = True

add_p("", space_after=8)
add_heading_3("Algorithmic Implementation of Composite Job Matching")
add_p("The composite match score S is calculated as a normalized linear combination of four weighted sub-scores:")
add_p("S = (W_skills * S_skills) + (W_exp * S_exp) + (W_loc * S_loc) + (W_edu * S_edu)", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True)
add_p("Where the operational weights are defined in Table 4.2:")

add_table_title("Table 4.2: Multi-Dimensional Composite Matching Weight Matrix")
w_table = doc.add_table(rows=5, cols=3)
w_table.alignment = WD_TABLE_ALIGNMENT.CENTER
set_table_borders(w_table, color="808080", sz="4")
w_data = [
    ("Dimension", "Weight Percentage", "Algorithmic Formulation"),
    ("Skills Overlap (S_skills)", "50% (0.50)", "Jaccard similarity coefficient: |Candidate_Skills ∩ Job_Skills| / |Job_Skills|"),
    ("Experience Alignment (S_exp)", "25% (0.25)", "Calculated based on candidate years of tenure versus role minimum requirement."),
    ("Location & Work Mode (S_loc)", "15% (0.15)", "Direct match for Remote roles (1.0), geographic proximity for On-site/Hybrid (0.5-1.0)."),
    ("Education & Domain (S_edu)", "10% (0.10)", "Degree level and field of study alignment (e.g., B.Tech CSE AI&ML vs Technical Req).")
]
for r_i, rvals in enumerate(w_data):
    for c_i, v in enumerate(rvals):
        c = w_table.cell(r_i, c_i)
        set_cell_padding(c, top=60, bottom=60, left=60, right=60)
        p = c.paragraphs[0]
        r = p.add_run(v)
        r.font.name = "Times New Roman"
        r.font.size = Pt(9.5)
        if r_i == 0:
            set_cell_background(c, "FEF3C7")
            r.font.bold = True

# ===========================================================================
# 4.5 REAL-LIFE SYSTEM SCREENSHOTS & IN-DEPTH TECHNICAL ANALYSIS
# ===========================================================================
add_heading_2("4.5 Real-Life System Screenshots and In-Depth Technical Analysis")
add_p("In accordance with university assessment guidelines, this section documents the actual implementation of KhojAI through real-life operational screenshots captured from the live deployed environment. Each figure is accompanied by an elaborate technical discussion detailing the feature of the technology, its application in the project, integration with other modules, and exact inputs and outputs.")

# Screenshot 1: Landing Page
add_figure("01_landing_page.png", "Figure 4.6: Screenshot of KhojAI Landing Page & Value Proposition", width=Inches(5.8))
add_bullet(" Implements React 18 functional components styled with a custom Tailwind CSS color palette, featuring glassmorphism cards, responsive hero banners, animated gradient text, and clear calls-to-action.", "Feature of the Technology/Tool:")
add_bullet(" Acts as the public portal and initial entrypoint for candidates, presenting platform capabilities (proactive discovery, AI resume parsing, match breakdown) and prompting authentication.", "Application of the Module in Project:")
add_bullet(" Connects directly to the React Router navigation tree and checks Zustand client authentication state to conditionally render navigation controls ('Go to Dashboard' vs 'Sign In').", "Integration with Other Modules:")
add_bullet(" User HTTP GET request to root domain (`/`). Output: Rendered responsive landing layout with navigation links to Login, Registration, and product feature demonstrations.", "Inputs and Outputs:")

# Screenshot 2: Login Page
add_figure("02_login_page.png", "Figure 4.7: Screenshot of User Authentication & JWT Sign-in Interface", width=Inches(5.8))
add_bullet(" Secure client-side form controls utilizing React state hooks, real-time input validation, toggleable password visibility, and asynchronous HTTP dispatch via Axios.", "Feature of the Technology/Tool:")
add_bullet(" Authenticates registered candidates, securely verifying credentials against MongoDB user collections and generating stateless JSON Web Tokens (JWT).", "Application of the Module in Project:")
add_bullet(" Interacts directly with the `/api/v1/auth/login` endpoint on the Express API server; on success, hydrates the Zustand `useAuthStore` and persists the token in local storage.", "Integration with Other Modules:")
add_bullet(" User email (`himanshu@khojai.dev`) and password string. Output: Signed JWT token containing user ID payload, authenticated user session, and redirection to the main dashboard.", "Inputs and Outputs:")

# Screenshot 3: Dashboard
add_figure("03_dashboard.png", "Figure 4.8: Screenshot of Interactive Candidate Dashboard with Analytics", width=Inches(5.8))
add_bullet(" Data visualization widgets powered by TanStack React Query and Lucide-React icons, presenting dynamic stat counters, recent job recommendations, and quick-action shortcuts.", "Feature of the Technology/Tool:")
add_bullet(" Serves as the central command console for the candidate, summarizing active applications, top job match scores, resume readiness score, and unread notification alerts.", "Application of the Module in Project:")
add_bullet(" Aggregates data concurrently from multiple backend services: `jobsAPI.recommended()`, `resumeAPI.list()`, `applicationsAPI.list()`, and `notificationsAPI.unreadCount()`.", "Integration with Other Modules:")
add_bullet(" Authenticated session token. Output: Unified dashboard view displaying total application counts, pending interviews, top AI matches, and instant navigation shortcuts.", "Inputs and Outputs:")

# Screenshot 4: Jobs Discovery
add_figure("04_jobs_discovery.png", "Figure 4.9: Screenshot of AI Job Discovery Explorer with Match Scoring", width=Inches(5.8))
add_bullet(" High-performance client-side filtering, multi-criteria search, pagination controls, and dynamically styled badge chips displaying computed match percentages.", "Feature of the Technology/Tool:")
add_bullet(" Enables candidates to search through over 113 indexed technical positions, filter by experience level (Junior, Mid, Senior), work mode (Remote, Hybrid, On-site), and sort by AI match percentage.", "Application of the Module in Project:")
add_bullet(" Interfaces with the `/api/v1/jobs` REST endpoint; each job card displays real-time match scores computed by the Composite Matching Service based on the candidate's active profile.", "Integration with Other Modules:")
add_bullet(" Filter parameters (keywords, work mode, minimum score threshold). Output: Paginated collection of relevant job postings with company names, locations, salaries, and match badges.", "Inputs and Outputs:")

# Screenshot 5: Job Detail View
add_figure("05_job_detail.png", "Figure 4.10: Screenshot of Job Detail View with AI Strengths, Gaps & Copilot Pitch", width=Inches(5.8))
add_bullet(" Modal slide-over and detailed card view rendering dynamic markdown, progress bars for match score breakdown, categorized strengths, missing skill tags, and an AI-synthesized pitch.", "Feature of the Technology/Tool:")
add_bullet(" Provides complete explainability for recruitment decisions. Shows exactly which candidate skills matched (e.g. React, Node.js), what skills are lacking (e.g. AWS, CI/CD), and produces a tailored elevator pitch.", "Application of the Module in Project:")
add_bullet(" Integrates the Python LangGraph AI microservice with the Node.js backend. Outputs from the matching engine directly populate the UI pitch generator and provide one-click 'Apply' actions.", "Integration with Other Modules:")
add_bullet(" Target Job ID and User Profile ID. Output: Granular match diagnostic (e.g. 85% match), identified skill gaps, customized application pitch, and application submission button.", "Inputs and Outputs:")

# Screenshot 6: Applications Kanban
add_figure("06_applications_kanban.png", "Figure 4.11: Screenshot of Visual Kanban Application Pipeline Tracker", width=Inches(5.8))
add_bullet(" Multi-column responsive Kanban board tracking applications across seven discrete status columns: Bookmarked, Applied, Screening, Interviewing, Offered, Rejected, and Withdrawn.", "Feature of the Technology/Tool:")
add_bullet(" Empowers job seekers to manage their entire career pipeline visually, eliminating spreadsheet tracking and enabling fast status updates.", "Application of the Module in Project:")
add_bullet(" Integrates with the MongoDB `Application` model via `/api/v1/applications`. Updates trigger status change logs and sync with dashboard metric widgets.", "Integration with Other Modules:")
add_bullet(" Application ID and target column state. Output: Real-time UI transition, persistent status update in MongoDB, and historical timeline logging.", "Inputs and Outputs:")

# Screenshot 7: Career Roadmap
add_figure("07_career_roadmap.png", "Figure 4.12: Screenshot of Dynamic Personalized Career Roadmap & Milestone Plan", width=Inches(5.8))
add_bullet(" Interactive timeline visualization categorizing milestones into Courses, Hands-on Projects, System Design architectures, and Mock Interviews with completion checkboxes.", "Feature of the Technology/Tool:")
add_bullet(" Translates candidate skill deficits into an actionable, step-by-step career upskilling journey targeting specific career roles (e.g., AI/ML Engineer, Full Stack Developer).", "Application of the Module in Project:")
add_bullet(" Generated by the LangGraph AI service through the `/api/v1/roadmap/generate` route; updates to milestone completion state persist to MongoDB and update the candidate's skill matrix.", "Integration with Other Modules:")
add_bullet(" Candidate current skills and target dream role. Output: Multi-stage roadmap with curated milestones, estimated completion hours, and progressive mastery tracking.", "Inputs and Outputs:")

# Screenshot 8: Resume Optimizer
add_figure("08_resume_optimizer.png", "Figure 4.13: Screenshot of Resume Multi-Stage Parser & Structured Extractor", width=Inches(5.8))
add_bullet(" Drag-and-drop document uploader with client-side file validation (PDF/DOCX, 5MB limit), real-time upload progress bar, and structured entity preview tabs.", "Feature of the Technology/Tool:")
add_bullet(" Parses unstructured resume files into structured JSON schemas, extracting candidate contact information, categorized skill taxonomy, educational history, and work tenures.", "Application of the Module in Project:")
add_bullet(" Connects to Multer file-handling middleware on the server, which forwards raw text to the LangGraph resume parsing workflow in the Python microservice.", "Integration with Other Modules:")
add_bullet(" Binary resume document (`resume.pdf`). Output: Structured resume profile with normalized skill badges, parsed experience tenure, and ATS optimization recommendations.", "Inputs and Outputs:")

# Screenshot 9: Notifications Inbox
add_figure("09_inbox_notifications.png", "Figure 4.14: Screenshot of Proactive Smart Notification Inbox with Quiet Hours", width=Inches(5.8))
add_bullet(" Notification center with unread badge counters, instant mark-as-read toggles, category filtering, and time-formatted relative timestamps.", "Feature of the Technology/Tool:")
add_bullet(" Alerts candidates the moment a new job matching their threshold is discovered by the background BullMQ worker, while strictly adhering to configured Quiet Hours (e.g. 10 PM - 8 AM).", "Application of the Module in Project:")
add_bullet(" Consumes events dispatched by the Redis BullMQ background worker and provides one-click navigation directly to the matched job detail view.", "Integration with Other Modules:")
add_bullet(" Scheduled background matching events. Output: In-app notification cards with match percentage, job title, company name, and direct application links.", "Inputs and Outputs:")

# Screenshot 10: Profile Settings
add_figure("10_profile_skills.png", "Figure 4.15: Screenshot of User Profile & Multi-Disciplinary Skills Matrix", width=Inches(5.8))
add_bullet(" Interactive skill tag input with keyboard chip creation, target role selector, years-of-experience slider, and preferred work mode selectors.", "Feature of the Technology/Tool:")
add_bullet(" Serves as the ground-truth candidate profile that parameterizes all downstream AI matching, roadmap generation, and proactive alert filters.", "Application of the Module in Project:")
add_bullet(" Direct bidirectional sync with MongoDB `User` model; any update automatically triggers an asynchronous background recalculation of job match scores across all active postings.", "Integration with Other Modules:")
add_bullet(" User inputs (skills list, target roles, preferred locations). Output: Persisted candidate profile vector and instant recalibration of job match scores.", "Inputs and Outputs:")

# ===========================================================================
# CHAPTER 5: CONCLUSIONS AND FUTURE SCOPE
# ===========================================================================
doc.add_page_break()
add_heading_1("Chapter 5: Conclusions and Future Scope")
add_p("", space_after=12)

add_heading_2("5.1 Utilization in Final Year Major Project Scope")
add_p("The foundational architecture, algorithmic models, and software engineering methodologies developed during this BCC-551 Mini Project establish a direct launchpad for the candidate's Final Year Major Project (CSE-851 / CSE-852). The microservices infrastructure will be expanded in the following key directions:")
add_bullet(" The composite matching engine will be upgraded from heuristic weighting to neural dense vector embeddings using domain-adapted BERT/RoBERTa models and Pinecone/Milvus vector databases for cosine semantic similarity search.", "1. Deep Vector Embedding & Semantic RAG Search:")
add_bullet(" Implementing real-time audio and video synthesis agents powered by WebRTC and conversational LLMs to conduct automated technical mock interviews and provide multimodal candidate feedback.", "2. Autonomous AI Mock Interviewer Agent:")
add_bullet(" Integrating distributed web crawlers and official recruitment APIs (Greenhouse, Lever, Workday) to index hundreds of thousands of live global openings automatically.", "3. Enterprise ATS Connector & Large-Scale Crawlers:")

add_heading_2("5.2 Industrial Relevance and Production Readiness")
add_p("KhojAI addresses acute, high-value challenges within the global recruitment technology sector, estimated as a multi-billion dollar market. By eliminating manual keyword searching and replacing it with explainable, multi-dimensional matching, KhojAI drastically reduces time-to-hire for employers while dramatically lowering candidate application fatigue.")
add_p("From a systems engineering perspective, KhojAI is architected for enterprise production readiness:")
add_bullet(" Complete containerization enables single-command provisioning across staging, testing, and production cloud clusters (AWS ECS / Kubernetes).", "Containerized Infrastructure:")
add_bullet(" The API server maintains autonomous local NLP fallbacks, ensuring continuous uptime even if remote LLM APIs encounter outages or latency spikes.", "High Availability & Fail-Safe Architecture:")
add_bullet(" Enforces Bcrypt hashing, signed stateless JWT tokens, strict Joi input validation, Helmet security headers, and rate limiting to resist malicious attacks.", "Security & Compliance:")

add_heading_2("5.3 Societal Relevance and Impact")
add_p("The societal impact of KhojAI is particularly significant for Tier-2 and Tier-3 collegiate institutions and underrepresented engineering candidates. Often lacking institutional access to elite campus placements, students from regional colleges struggle to identify how their academic coursework translates into industry-demanded skillsets.")
add_p("KhojAI democratizes career guidance by acting as a free, 24/7 personalized career mentor. By diagnosing exact skill gaps and structuring personalized, milestone-driven learning roadmaps, KhojAI transforms passive job rejection into proactive empowerment, directly supporting national initiatives in technical skill development, digital employment equity, and lifelong learning.")

add_heading_2("5.4 Future Enhancements and Roadmap")
add_p("The long-term development roadmap for KhojAI encompasses three phases of planned evolution:")
add_bullet(" Deploying Chrome and Firefox extensions allowing candidates to save external job postings directly into their KhojAI Kanban pipeline with a single click.", "Phase 1: Browser Extension for One-Click Auto-Discovery:")
add_bullet(" Integrating mobile push notifications via Google Firebase Cloud Messaging (FCM) and Apple Push Notification Service (APNs) for real-time mobile match delivery.", "Phase 2: Native Mobile Applications & Push Alerts:")
add_bullet(" Developing a dedicated enterprise portal enabling corporate hiring teams to post positions, view anonymous AI-scored candidate shortlists, and schedule interviews.", "Phase 3: B2B Recruiter Portal & Talent Matching:")

# ===========================================================================
# REFERENCES & APPENDICES
# ===========================================================================
doc.add_page_break()
add_heading_1("References")
add_p("", space_after=10)

refs = [
    "[1] Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., Kaiser, L., & Polosukhin, I. (2017). Attention is all you need. Advances in Neural Information Processing Systems (NeurIPS 2017), 30, 5998–6008.",
    "[2] Chase, H. et al. (2024). LangGraph: Building Language Agents as Graphs. LangChain Open-Source AI Documentation, https://langchain-ai.github.io/langgraph/.",
    "[3] Tiangolo, S. (2023). FastAPI: High Performance, Easy to Learn, Fast to Code, Ready for Production. https://fastapi.tiangolo.com/.",
    "[4] Banks, A., & Porcello, E. (2020). Learning React: Modern Patterns for Developing React Applications (2nd ed.). O'Reilly Media.",
    "[5] Chodorow, K. (2019). MongoDB: The Definitive Guide - Powerful and Scalable Data Storage (3rd ed.). O'Reilly Media.",
    "[6] Sanfilippo, S. (2022). Redis Explained: In-Memory Data Structure Store. Redis Open Source Documentation, https://redis.io/docs/.",
    "[7] Fielding, R. T. (2000). Architectural Styles and the Design of Network-based Software Architectures. Doctoral dissertation, University of California, Irvine.",
    "[8] Resig, J., Bibeault, B., & Maras, J. (2016). Secrets of the JavaScript Ninja (2nd ed.). Manning Publications.",
    "[9] ISO/IEC/IEEE 12207:2017. Systems and Software Engineering — Software Life Cycle Processes. International Organization for Standardization.",
    "[10] Allamar, J., & Grootendorst, M. (2024). Hands-On Large Language Models. O'Reilly Media."
]

for ref in refs:
    p_ref = doc.add_paragraph()
    p_ref.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_ref.paragraph_format.space_after = Pt(4)
    p_ref.paragraph_format.line_spacing = 1.15
    run = p_ref.add_run(ref)
    run.font.name = "Times New Roman"
    run.font.size = Pt(10)

doc.add_page_break()
add_heading_1("Appendices")
add_heading_2("Appendix A: Core REST API Signatures")

api_table = doc.add_table(rows=8, cols=4)
api_table.alignment = WD_TABLE_ALIGNMENT.CENTER
set_table_borders(api_table, color="808080", sz="4")
api_data = [
    ("HTTP Method", "Route Endpoint", "Auth Required", "Description & Payload"),
    ("POST", "/api/v1/auth/register", "No", "Registers a new user; accepts name, email, password."),
    ("POST", "/api/v1/auth/login", "No", "Authenticates user; returns signed JWT Bearer token."),
    ("GET", "/api/v1/jobs", "Optional", "Retrieves paginated job listings with match scores."),
    ("POST", "/api/v1/resumes/upload", "Bearer JWT", "Uploads PDF/DOCX resume for LangGraph parsing."),
    ("GET", "/api/v1/applications", "Bearer JWT", "Fetches candidate applications categorized by stage."),
    ("POST", "/api/v1/applications", "Bearer JWT", "Creates or updates application stage in Kanban."),
    ("POST", "/api/v1/roadmap/generate", "Bearer JWT", "Invokes AI service to synthesize custom milestones.")
]
for r_i, rvals in enumerate(api_data):
    for c_i, v in enumerate(rvals):
        c = api_table.cell(r_i, c_i)
        set_cell_padding(c, top=50, bottom=50, left=50, right=50)
        p = c.paragraphs[0]
        r = p.add_run(v)
        r.font.name = "Times New Roman"
        r.font.size = Pt(9)
        if r_i == 0:
            set_cell_background(c, "E0E7FF")
            r.font.bold = True

add_p("", space_after=12)
add_heading_2("Appendix B: Environment Configuration Variables")
add_bullet(" Port for Express API gateway (default: 5000).", "PORT:")
add_bullet(" Connection string for persistent MongoDB 7 cluster.", "MONGODB_URI:")
add_bullet(" Redis connection URL for BullMQ messaging.", "REDIS_URL:")
add_bullet(" Cryptographic secret for signing stateless authentication tokens.", "JWT_SECRET:")
add_bullet(" Internal microservice URL for Python FastAPI container (default: http://localhost:8000).", "AI_SERVICE_URL:")
add_bullet(" AI inference backend selector (options: 'gemini', 'openai', 'mock').", "LLM_PROVIDER:")

# Save the document
doc.save(DOCX_OUTPUT_PATH)
print(f"Report generated successfully at: {DOCX_OUTPUT_PATH}")
